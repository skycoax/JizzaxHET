"""
CAS.NET API Klienti
====================
0-BOSQICH natijasi bo'yicha to'ldiriladi.

Hozir mock ma'lumot qaytaradi — haqiqiy CAS.NET
API endpoint'lari aniqlangandan so'ng quyidagi
TODO bloklari real kod bilan almashtiriladi.
"""
import httpx
import logging
import time
import math
import random
from typing import Optional
from config import CASNET_URL, CASNET_USER, CASNET_PASS

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
#  0-BOSQICH: Quyidagi konstantalarni CAS.NET tadqiqotidan
#  olingan haqiqiy qiymatlar bilan almashtiring.
# ─────────────────────────────────────────────────────────────
CASNET_LOGIN_ENDPOINT   = "/api/auth/login"       # TODO: haqiqiy endpoint
CASNET_DEVICES_ENDPOINT = "/api/ami/devices"      # TODO: haqiqiy endpoint
CASNET_EVENTS_ENDPOINT  = "/api/events"           # TODO: haqiqiy endpoint
CASNET_READINGS_ENDPOINT= "/api/ami/readings"     # TODO: haqiqiy endpoint


class CasNetClient:
    """
    CAS.NET bilan ishlash uchun asenkron HTTP klient.
    
    JORIY HOLAT: Mock ma'lumot qaytaradi.
    KEYIN: Haqiqiy API endpointlari bilan ishlaydi.
    """

    def __init__(self) -> None:
        self._token: Optional[str] = None
        self._token_expires: float = 0
        self._session = httpx.AsyncClient(
            base_url=CASNET_URL,
            timeout=15.0,
            verify=False,   # LAN ichki sertifikatlar uchun
        )
        self._use_mock = True   # 0-BOSQICH tugaguncha True

    # ── Autentifikatsiya ──────────────────────────────────────

    async def _authenticate(self) -> bool:
        """
        TODO (0-BOSQICH): CAS.NET ga kirish.
        
        Haqiqiy endpoint va request format aniqlanganda:
        1.  CASNET_LOGIN_ENDPOINT ni to'g'rilang
        2.  request body formatini moslashtiring
        3.  token field nomini aniqlang (response da qayerda)
        4.  self._use_mock = False qiling
        """
        if not CASNET_USER or not CASNET_PASS:
            log.warning("CAS.NET login ma'lumotlari .env da kiritilmagan")
            return False
        try:
            # TODO: Haqiqiy request format
            r = await self._session.post(
                CASNET_LOGIN_ENDPOINT,
                json={"username": CASNET_USER, "password": CASNET_PASS}
            )
            r.raise_for_status()
            data = r.json()
            # TODO: tokenni to'g'ri field dan oling
            self._token = data.get("token") or data.get("access_token")
            self._token_expires = time.time() + 3600
            log.info("CAS.NET: autentifikatsiya muvaffaqiyatli")
            return True
        except Exception as e:
            log.error(f"CAS.NET auth xato: {e}")
            return False

    async def _ensure_auth(self) -> dict:
        """Token yangilash va header qaytarish."""
        if time.time() > self._token_expires - 60:
            await self._authenticate()
        return {"Authorization": f"Bearer {self._token}"} if self._token else {}

    # ── Asosiy metodlar ───────────────────────────────────────

    async def get_devices(self) -> list[dict]:
        """
        Barcha qurilmalar va ularning joriy holati.
        
        TODO (0-BOSQICH): Haqiqiy endpoint va response
        formatini aniqlang, keyin quyidagini yozing:
        
            headers = await self._ensure_auth()
            r = await self._session.get(CASNET_DEVICES_ENDPOINT, headers=headers)
            r.raise_for_status()
            raw = r.json()
            return self._parse_devices(raw)
        """
        if self._use_mock:
            return _mock_devices()
        
        # Haqiqiy kod (TODO):
        try:
            headers = await self._ensure_auth()
            r = await self._session.get(CASNET_DEVICES_ENDPOINT, headers=headers)
            r.raise_for_status()
            return self._parse_devices(r.json())
        except Exception as e:
            log.error(f"CAS.NET qurilmalar xato: {e}")
            return []

    async def get_events(self, limit: int = 100) -> list[dict]:
        """
        Tizim hodiyalari (avariyalar, tiklashlar va h.k.).
        
        TODO (0-BOSQICH): Haqiqiy endpoint formatini aniqlang.
        """
        if self._use_mock:
            return _mock_events()
        try:
            headers = await self._ensure_auth()
            r = await self._session.get(
                CASNET_EVENTS_ENDPOINT,
                headers=headers,
                params={"limit": limit}
            )
            r.raise_for_status()
            return self._parse_events(r.json())
        except Exception as e:
            log.error(f"CAS.NET hodisalar xato: {e}")
            return []

    async def get_readings(self, device_id: str, months: int = 6) -> list[dict]:
        """
        Bitta qurilma uchun oylik ko'rsatkichlar.
        
        TODO (0-BOSQICH): Haqiqiy endpoint va parametrlarni aniqlang.
        """
        if self._use_mock:
            return _mock_readings(device_id)
        try:
            headers = await self._ensure_auth()
            r = await self._session.get(
                f"{CASNET_READINGS_ENDPOINT}/{device_id}",
                headers=headers,
                params={"months": months}
            )
            r.raise_for_status()
            return self._parse_readings(r.json())
        except Exception as e:
            log.error(f"CAS.NET ko'rsatkichlar xato [{device_id}]: {e}")
            return []

    # ── Parser metodlar (TODO: CAS.NET formatiga moslash) ────

    def _parse_devices(self, raw: dict | list) -> list[dict]:
        """
        TODO (0-BOSQICH): CAS.NET response formatini
        bizning Device formatiga aylantirish.
        
        Masalan, agar CAS.NET bunday qaytarsa:
            {"devices": [{"id": "...", "status": 1, ...}]}
        
        Unda:
            items = raw.get("devices", [])
            return [self._map_device(d) for d in items]
        """
        log.warning("_parse_devices: TODO — CAS.NET format aniqlanmagan")
        return []

    def _parse_events(self, raw: dict | list) -> list[dict]:
        """TODO (0-BOSQICH): CAS.NET events formatini parse qilish."""
        log.warning("_parse_events: TODO — CAS.NET format aniqlanmagan")
        return []

    def _parse_readings(self, raw: dict | list) -> list[dict]:
        """TODO (0-BOSQICH): CAS.NET readings formatini parse qilish."""
        log.warning("_parse_readings: TODO — CAS.NET format aniqlanmagan")
        return []

    async def close(self) -> None:
        await self._session.aclose()


# ─────────────────────────────────────────────────────────────
#  MOCK MA'LUMOT — 0-bosqich tugaguncha ishlaydi
#  (Eslatma: bu frontend dagi mockData.ts bilan bir xil)
# ─────────────────────────────────────────────────────────────

_DISTRICTS = [
    ("Arnasoy tumani",      40.39, 67.65),
    ("Baxmal tumani",       39.91, 68.85),
    ("Gallaorol tumani",    40.27, 67.78),
    ("Sh. Rashidov tumani", 40.38, 67.98),
    ("Do'stlik tumani",     40.52, 68.01),
    ("Zomin tumani",        39.96, 68.40),
    ("Zarbdor tumani",      40.09, 67.47),
    ("Mirzacho'l tumani",   40.48, 68.55),
    ("Zafarobod tumani",    40.14, 67.58),
    ("Paxtakor tumani",     40.31, 67.53),
    ("Forish tumani",       39.88, 67.97),
    ("Yangiobod tumani",    40.27, 68.80),
    ("Jizzax shahri",       40.12, 67.84),
]

_PERSONS = [
    ("Akmal Karimov",    "+998 90 123 45 67"),
    ("Dilshod Rahimov",  "+998 91 234 56 78"),
    ("Sanjar Qodirov",   "+998 91 789 01 23"),
    ("Aziz Mahmudov",    "+998 91 111 22 33"),
    ("Shavkat Berdiyev", "+998 90 444 55 66"),
    ("Nodir Egamberdiyev","+998 94 777 88 99"),
    ("Anvar Xolmatov",   "+998 94 211 22 33"),
    ("Murod Yusupov",    "+998 91 433 44 55"),
    ("Jahongir Rajabov", "+998 91 999 00 11"),
    ("Qahramon Eshonov", "+998 93 544 55 66"),
    ("Shohrux Bozorov",  "+998 90 766 77 88"),
    ("Sarvar Torayev",   "+998 91 877 88 99"),
    ("Asror Komilov",    "+998 93 988 99 00"),
    ("Nodir Xasanov",    "+998 90 112 34 56"),
]

_rng = random.Random(20260611)

def _gen_loss(seed: int) -> float:
    """Mock yo'qotish % — deterministik, seed asosida."""
    r = random.Random(seed)
    base = r.uniform(1.5, 6.0)           # normal texnik yo'qotish
    if seed % 13 == 0:  base = r.uniform(22, 38)  # o'g'irlik
    elif seed % 8 == 0: base = r.uniform(14, 20)  # shubhali
    elif seed % 5 == 0: base = r.uniform(8, 13)   # ko'tarilgan
    return round(base, 1)

def _mock_devices() -> list[dict]:
    """Mock qurilmalar ro'yxati."""
    devices = []
    for i, (district, lat, lng) in enumerate(_DISTRICTS):
        n_tp = _rng.randint(2, 5)
        person = _PERSONS[i % len(_PERSONS)]
        for j in range(n_tp):
            r = _rng.random()
            status = "offline" if r < 0.05 else "fault" if r < 0.12 else "warning" if r < 0.20 else "online"
            total = _rng.randint(150, 450)
            online = 0 if status == "offline" else _rng.randint(max(0, total - 10), total)
            devices.append({
                "id": f"TP-{i+1:02d}{j+1:02d}",
                "name": f"{district.replace(' tumani','').replace(' shahri','')} TP-{j+1}",
                "type": "concentrator",
                "district": district,
                "lat": round(lat + _rng.uniform(-0.05, 0.05), 5),
                "lng": round(lng + _rng.uniform(-0.05, 0.05), 5),
                "status": status,
                "metersTotal": total,
                "metersOnline": online,
                "responsibleName": person[0],
                "responsiblePhone": person[1],
                "voltage": "—" if status == "offline" else f"{_rng.randint(224,234)} V",
                "loadPercent": 0 if status == "offline" else _rng.randint(35, 98),
                "onBattery": False,
                "theft": False,
                "lossPercent": _gen_loss(hash(f"{i}{j}") & 0xffffff),
                "lossElevated": False,
                "faultSince": int(time.time() * 1000) - _rng.randint(300000, 5400000) if status != "online" else None,
                "lastUpdate": int(time.time() * 1000),
            })
    return devices


def _mock_events() -> list[dict]:
    return []


def _mock_readings(device_id: str) -> list[dict]:
    rng = random.Random(hash(device_id) & 0x7fffffff)
    months = ["06/2026","05/2026","04/2026","03/2026","02/2026","01/2026"]
    result = []
    for m in months:
        base = rng.randint(80000, 180000)
        plus_a = round(base * (0.85 + rng.random() * 0.3), 1)
        plus_r = round(plus_a * (0.62 + rng.random() * 0.22), 1)
        t1 = round(plus_a * 0.25, 1)
        t2 = round(plus_a * 0.35, 1)
        t3 = round(plus_a - t1 - t2, 1)
        result.append({
            "period": m, "source": "view.ami",
            "plusA": plus_a, "minusA": round(rng.random() * 100, 1),
            "plusR": plus_r, "minusR": round(rng.random() * 200, 1),
            "t1": t1, "t2": t2, "t3": t3, "t4": 0,
            "anomaly": rng.random() < 0.05,
            "predicted": False, "missing": False,
        })
    return result
