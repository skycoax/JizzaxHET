"""
Ma'lumot yangilash va avariya aniqlash
=======================================
Har N soniyada CAS.NET dan ma'lumot olib,
WebSocket orqali dashboardlarga yuboradi.
"""
import asyncio
import logging
import time
from typing import Optional
from config import FETCH_INTERVAL

log = logging.getLogger(__name__)


class DataScheduler:
    def __init__(self, casnet, ws_manager, telegram) -> None:
        self._casnet   = casnet
        self._ws       = ws_manager
        self._tg       = telegram
        self._running  = False
        self._snapshot: Optional[dict] = None
        self._prev_offline: set[str] = set()

    def get_snapshot(self) -> Optional[dict]:
        return self._snapshot

    async def start(self) -> None:
        self._running = True
        log.info(f"Scheduler: har {FETCH_INTERVAL}s yangilanadi.")
        while self._running:
            try:
                await self._tick()
            except Exception as e:
                log.error(f"Scheduler xato: {e}")
            await asyncio.sleep(FETCH_INTERVAL)

    def stop(self) -> None:
        self._running = False

    async def _tick(self) -> None:
        devices = await self._casnet.get_devices()
        events  = await self._casnet.get_events(limit=50)
        snapshot = self._build_snapshot(devices, events)
        self._snapshot = snapshot

        # Yangi avariyalarni aniqlash
        offline_now = {
            d["id"] for d in devices
            if d.get("status") in ("offline", "fault")
            and d.get("type") == "concentrator"
        }
        new_alarms = offline_now - self._prev_offline
        self._prev_offline = offline_now

        # Telegram xabarlari
        if new_alarms:
            dev_map = {d["id"]: d for d in devices}
            for did in new_alarms:
                d = dev_map.get(did)
                if d:
                    await self._tg.notify_alarm(d)
                    log.info(f"Avariya: {did} ({d['district']})")

        # O'g'irlik aniqlash (energiya balansi)
        snapshot = self._detect_theft(snapshot)

        # WebSocket broadcast
        await self._ws.broadcast({
            "type": "snapshot",
            "data": snapshot,
        })

    def _build_snapshot(self, devices: list[dict], events: list[dict]) -> dict:
        districts = self._aggregate_districts(devices)
        kpis      = self._calc_kpis(devices)
        return {
            "devices":     devices,
            "districts":   districts,
            "lines":       [],
            "kpis":        kpis,
            "events":      events,
            "readings":    {},
            "loadProfile": [],
            "generatedAt": int(time.time() * 1000),
        }


    def _detect_theft(self, snapshot: dict) -> dict:
        """
        5-BOSQICH: Energiya balansi asosida o'g'irlik aniqlash.

        Har TP konsentrator uchun:
          yo'qotish% = (TP_kiritgan_kWh - hisoblagichlar_jami) / TP_kiritgan * 100

          > 8%  : ko'tarilgan yo'qotish (normal emas)
          > 15% : shubhali (ehtimol o'g'irlik)
          > 25% : o'g'irlik (bayroq)

        HOZIR: Mock hisoblash (tasodifiy).
        FASE 0 keyin: CAS.NET haqiqiy ko'rsatkichlari ishlatiladi.
        """
        import random
        rng = random.Random(int(time.time()) // 300)   # har 5 daqiqada o'zgaradi

        devices = snapshot.get("devices", [])
        theft_count = 0

        for d in devices:
            if d.get("type") != "concentrator":
                continue
            if d.get("status") == "offline":
                d["theft"] = False
                d["lossPercent"] = 0
                continue

            # TODO (Phase 0): CAS.NET readings dan haqiqiy hisoblash:
            # tp_input = readings[d["id"]]["plusA"]  (TP ga kirgan kWh)
            # meter_sum = sum(m["plusA"] for m in meters_under_tp)
            # loss_pct = (tp_input - meter_sum) / tp_input * 100

            # Mock: ba'zi TP larda sun'iy yo'qotish
            seed_val = hash(d["id"]) & 0xffffff
            rng2 = random.Random(seed_val ^ (int(time.time()) // 3600))
            base_loss = rng2.uniform(1, 6)   # normal texnik yo'qotish

            # Shubhali TP lar (seed asosida deterministik)
            if seed_val % 12 == 0:   base_loss = rng2.uniform(20, 35)  # o'g'irlik
            elif seed_val % 7 == 0:  base_loss = rng2.uniform(12, 18)  # shubhali

            loss = round(base_loss + rng.uniform(-0.5, 0.5), 1)
            d["lossPercent"] = loss

            if loss > 15:
                d["theft"] = True
                theft_count += 1
            elif loss > 8:
                d["theft"] = False
                d["lossElevated"] = True
            else:
                d["theft"] = False
                d.pop("lossElevated", None)

        # KPI yangilash
        if "kpis" in snapshot:
            snapshot["kpis"]["theftTps"] = theft_count

        return snapshot

    def _aggregate_districts(self, devices: list[dict]) -> list[dict]:
        from collections import defaultdict
        groups: dict[str, list] = defaultdict(list)
        for d in devices:
            groups[d["district"]].append(d)
        result = []
        STATUS_RANK = {"offline": 0, "fault": 1, "warning": 2, "online": 3}
        for name, devs in groups.items():
            online  = sum(1 for d in devs if d["status"] == "online")
            alarms  = sum(1 for d in devs if d["status"] in ("offline","fault"))
            warnings= sum(1 for d in devs if d["status"] == "warning")
            worst   = min(devs, key=lambda d: STATUS_RANK.get(d["status"], 3))["status"]
            lats = [d["lat"] for d in devs]
            lngs = [d["lng"] for d in devs]
            result.append({
                "name":         name,
                "deviceCount":  len(devs),
                "online":       online,
                "alarms":       alarms,
                "warnings":     warnings,
                "worstStatus":  worst,
                "availability": round(online / len(devs) * 100) if devs else 0,
                "lat":          sum(lats) / len(lats),
                "lng":          sum(lngs) / len(lngs),
            })
        return result

    def _calc_kpis(self, devices: list[dict]) -> dict:
        online = warnings = faults = offline = 0
        affected = connected = 0
        battery = overload = offline_tp = theft = 0
        for d in devices:
            if d["status"] == "online":    online   += 1
            elif d["status"] == "warning": warnings += 1
            elif d["status"] == "fault":   faults   += 1
            else:                          offline  += 1
            if d["status"] != "online":
                affected += max(0, d.get("metersTotal",0) - d.get("metersOnline",0))
            connected += d.get("metersTotal", 0)
            if d.get("type") == "concentrator":
                if d.get("onBattery") and d["status"] != "offline": battery  += 1
                if (d.get("loadPercent") or 0) >= 90:               overload += 1
                if d["status"] == "offline":                        offline_tp+= 1
                if d.get("theft"):                                  theft    += 1
        total = len(devices) or 1
        active_alarms = faults + offline
        system_status = "critical" if active_alarms >= 3 else "warning" if active_alarms or warnings else "stable"
        return {
            "totalNodes": total, "online": online, "warnings": warnings,
            "faults": faults, "offline": offline,
            "activeAlarms": active_alarms,
            "affectedConsumers": affected, "connectedConsumers": connected,
            "availability": round(online / total * 100, 1),
            "systemStatus": system_status,
            "batteryTps": battery, "activeLines": 0, "totalLines": 0,
            "overloadedTps": overload, "offlineTps": offline_tp, "theftTps": theft,
        }
