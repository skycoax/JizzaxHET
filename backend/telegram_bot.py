"""
Telegram bildirishnomalar
==========================
Avariya aniqlananda mas'ul shaxslarga xabar yuboradi.
"""
import logging
import time
from datetime import datetime
import httpx
from database import db_persons_for_district, db_log_alarm, db_get_config

log = logging.getLogger(__name__)


class TelegramNotifier:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=10.0)

    async def _send(self, chat_id: str, text: str, keyboard: dict | None = None) -> bool:
        cfg = db_get_config()
        token = cfg.get("tg_token", "")
        if not token:
            return False
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload: dict = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
        if keyboard:
            import json
            payload["reply_markup"] = json.dumps(keyboard)
        try:
            r = await self._client.post(url, json=payload)
            return r.json().get("ok", False)
        except Exception as e:
            log.error(f"Telegram xato [{chat_id}]: {e}")
            return False

    async def notify_alarm(self, device: dict) -> None:
        """Qurilma avariyasi haqida mas'ul shaxslarga xabar yuborish."""
        cfg = db_get_config()
        if cfg.get("tg_enabled", "false") != "true":
            return

        district = device.get("district", "")
        status   = device.get("status", "offline")
        persons  = db_persons_for_district(district, status)
        if not persons:
            log.debug(f"Telegram: {district} uchun mas'ul topilmadi")
            return

        msg = self._format_alarm(device)
        keyboard = {
            "inline_keyboard": [[
                {"text": "Tasdiqlash",  "callback_data": f"ack:{device['id']}"},
                {"text": "Yolda",       "callback_data": f"onway:{device['id']}"},
            ]]
        }
        notified = []
        for p in persons:
            ok = await self._send(p["telegram_id"], msg, keyboard)
            if ok:
                notified.append(p["name"])
                log.info(f"TG: {p['name']} ga yuborildi ({device['id']})")

        db_log_alarm(device["id"], device.get("name","?"),
                     district, status, notified)

    async def send_test(self, chat_id: str, name: str) -> bool:
        return await self._send(
            chat_id,
            f"Test xabar — Jizzax HET Monitoring\n\n"
            f"Salom, <b>{name}</b>!\n"
            f"Bot togri sozlangan — avariyalar haqida xabar olasiz.",
        )

    def _format_alarm(self, d: dict) -> str:
        status  = d.get("status","offline")
        emojis  = {"offline":"🔴","fault":"🟠","theft":"🟣","overload":"🟡"}
        labels  = {"offline":"ALOQA YOQ","fault":"NOSOZLIK","theft":"OGIRLIK","overload":"YUKLANISH"}
        emoji   = emojis.get(status,"⚠️")
        label   = labels.get(status, status.upper())
        ts      = d.get("faultSince") or int(time.time()*1000)
        dt_str  = datetime.fromtimestamp(ts/1000).strftime("%H:%M  %d.%m.%Y")
        return (
            f"{emoji} <b>YANGI AVARIYA — JIZZAX HET</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"TP: <b>{d.get('id','?')}</b>  ·  {d.get('name','?')}\n"
            f"Joylashuv: {d.get('district','?')}\n"
            f"Holat: <b>{label}</b>\n"
            f"Vaqt: {dt_str}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"Masul: {d.get('responsibleName','?')}\n"
            f"Tel: {d.get('responsiblePhone','?')}\n\n"
            f"Iltimos, darhol tekshiring!"
        )

    async def close(self) -> None:
        await self._client.aclose()
