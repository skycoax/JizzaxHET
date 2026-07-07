"""
Jizzax HET Backend — Asosiy ilova
====================================
Ishga tushirish:
    python main.py
    yoki
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""
import asyncio
import json
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

import config as cfg
from auth import create_token, verify_token, hash_password, verify_password
from database import (
    init_db, db_get_user_by_username, db_get_all_users, db_create_user,
    db_get_persons, db_save_person, db_delete_person,
    db_get_alarm_log, db_acknowledge_alarm,
    db_get_config, db_set_config,
)
from casnet import CasNetClient
from scheduler import DataScheduler
from telegram_bot import TelegramNotifier
from ws_manager import manager as ws_manager

# Windows konsoli (masalan cp1251) UTF-8 belgilarni chop eta olishi uchun —
# aks holda banner/loglardagi maxsus belgilar UnicodeEncodeError beradi.
import sys
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8")
    except Exception:
        pass

logging.basicConfig(
    level=cfg.LOG_LEVEL,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("jhet")

# ── Global ob'yektlar ──────────────────────────────────────
casnet    = CasNetClient()
telegram  = TelegramNotifier()
scheduler = DataScheduler(casnet, ws_manager, telegram)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    log.info("Backend ishga tushdi.")
    task = asyncio.create_task(scheduler.start())
    yield
    scheduler.stop()
    task.cancel()
    await casnet.close()
    await telegram.close()
    log.info("Backend to'xtatildi.")


app = FastAPI(
    title="Jizzax HET Monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Autentifikatsiya yordamchisi ───────────────────────────

async def current_user(token: str = Depends(oauth2)) -> dict:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token noto'g'ri yoki muddati o'tgan")
    return payload


async def admin_only(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Faqat administrator uchun")
    return user


# ══════════════════════════════════════════════════════════
#  AUTH ENDPOINTLAR
# ══════════════════════════════════════════════════════════

@app.post("/auth/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = db_get_user_by_username(form.username)
    if not user or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Login yoki parol noto'g'ri")
    token = create_token({"sub": user["id"], "role": user["role"], "name": user["full_name"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":        user["id"],
            "username":  user["username"],
            "full_name": user["full_name"],
            "role":      user["role"],
        },
    }


@app.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user


# ══════════════════════════════════════════════════════════
#  QURILMALAR VA SNAPSHOT
# ══════════════════════════════════════════════════════════

@app.get("/snapshot")
async def get_snapshot(user: dict = Depends(current_user)):
    """Joriy to'liq holat — dashboard birinchi yuklanishda chaqiradi."""
    snap = scheduler.get_snapshot()
    if not snap:
        devices = await casnet.get_devices()
        events  = await casnet.get_events()
        snap    = scheduler._build_snapshot(devices, events)
    return snap


@app.get("/devices")
async def get_devices(user: dict = Depends(current_user)):
    return await casnet.get_devices()


@app.get("/readings/{device_id}")
async def get_readings(device_id: str, months: int = 6, user: dict = Depends(current_user)):
    return await casnet.get_readings(device_id, months)


# ══════════════════════════════════════════════════════════
#  MAS'UL SHAXSLAR
# ══════════════════════════════════════════════════════════

class PersonBody(BaseModel):
    model_config = {"populate_by_name": True}

    id:               str | None = None
    name:             str
    phone:            str
    telegram_id:      str | None = Field(None, alias="telegramId")
    telegram_username:str | None = Field(None, alias="telegramUsername")
    assigned_tetk:    list[str]  = Field(default_factory=list, alias="assignedTetk")
    notify_types:     list[str]  = Field(default_factory=lambda: ["offline","fault"], alias="notifyTypes")
    active:           bool       = True


def _p2c(p: dict) -> dict:
    """snake_case → camelCase (frontend uchun)."""
    return {
        "id":               p["id"],
        "name":             p["name"],
        "phone":            p["phone"],
        "telegramId":       p.get("telegram_id"),
        "telegramUsername": p.get("telegram_username"),
        "assignedTetk":     p.get("assigned_tetk", []),
        "notifyTypes":      p.get("notify_types", []),
        "active":           bool(p.get("active", 1)),
        "createdAt":        p.get("created_at"),
        "lastNotified":     p.get("last_notified"),
    }

@app.get("/persons")
async def list_persons(user: dict = Depends(current_user)):
    return [_p2c(p) for p in db_get_persons()]


@app.post("/persons")
async def upsert_person(body: PersonBody, user: dict = Depends(admin_only)):
    raw = body.model_dump()
    return _p2c(db_save_person(raw))



@app.post("/persons/bulk")
async def bulk_sync_persons(persons: list[PersonBody], user: dict = Depends(admin_only)):
    """Dashboard dan butun ro'yxatni sinxronlash."""
    saved = []
    for pb in persons:
        try:
            saved.append(db_save_person(pb.model_dump()))
        except Exception as e:
            log.error(f"Bulk save xato [{pb.name}]: {e}")
    return {"ok": True, "saved": len(saved)}


@app.delete("/persons/{pid}")
async def delete_person(pid: str, user: dict = Depends(admin_only)):
    if not db_delete_person(pid):
        raise HTTPException(status_code=404, detail="Topilmadi")
    return {"ok": True}


@app.post("/persons/{pid}/test")
async def test_person(pid: str, user: dict = Depends(admin_only)):
    persons = db_get_persons()
    p = next((x for x in persons if x["id"] == pid), None)
    if not p:
        raise HTTPException(status_code=404, detail="Topilmadi")
    if not p.get("telegram_id"):
        raise HTTPException(status_code=400, detail="Telegram ID kiritilmagan")
    ok = await telegram.send_test(p["telegram_id"], p["name"])
    return {"ok": ok}


# ══════════════════════════════════════════════════════════
#  FOYDALANUVCHILAR (admin only)
# ══════════════════════════════════════════════════════════

class UserBody(BaseModel):
    username:    str
    password:    str
    full_name:   str
    role:        str
    tetk_filter: str | None = None


@app.get("/users")
async def list_users(user: dict = Depends(admin_only)):
    return db_get_all_users()


@app.post("/users")
async def create_user(body: UserBody, user: dict = Depends(admin_only)):
    return db_create_user(body.username, body.password, body.full_name, body.role, body.tetk_filter)


# ══════════════════════════════════════════════════════════
#  KONFIGURATSIYA
# ══════════════════════════════════════════════════════════

@app.get("/config")
async def get_config_api(user: dict = Depends(admin_only)):
    cfg_dict = db_get_config()
    # Parolni frontend ga qaytarmaymiz
    safe = {k: ("****" if "pass" in k else v) for k, v in cfg_dict.items()}
    return safe


class ConfigBody(BaseModel):
    key:   str
    value: str


@app.post("/config")
async def set_config_api(body: ConfigBody, user: dict = Depends(admin_only)):
    db_set_config(body.key, body.value)
    # Telegram token yangilansa — scheduler ni xabardor qilish
    return {"ok": True}


@app.get("/config/bot-status")
async def bot_status(user: dict = Depends(current_user)):
    cfg_dict = db_get_config()
    return {
        "ok":              True,
        "token_set":       bool(cfg_dict.get("tg_token")),
        "enabled":         cfg_dict.get("tg_enabled") == "true",
        "persons_total":   len(db_get_persons()),
        "persons_active":  sum(1 for p in db_get_persons() if p["active"] and p.get("telegram_id")),
    }


# ══════════════════════════════════════════════════════════
#  AVARIYA JURNALI
# ══════════════════════════════════════════════════════════

@app.get("/alarms")
async def list_alarms(limit: int = 100, user: dict = Depends(current_user)):
    return db_get_alarm_log(limit)


class AckBody(BaseModel):
    alarm_id: str


@app.post("/alarms/ack")
async def acknowledge(body: AckBody, user: dict = Depends(current_user)):
    db_acknowledge_alarm(body.alarm_id, user.get("name", "?"))
    return {"ok": True}


# ══════════════════════════════════════════════════════════
#  WEBSOCKET — real-time yangilanish
# ══════════════════════════════════════════════════════════

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str | None = None):
    # Token tekshiruv
    user = verify_token(token or "") if token else None
    if not user:
        await ws.close(code=4001, reason="Token kerak")
        return

    await ws_manager.connect(ws)
    try:
        # Dastlabki snapshot yuborish
        snap = scheduler.get_snapshot()
        if snap:
            await ws_manager.send_to(ws, {"type": "snapshot", "data": snap})

        # Mijozdan xabarlarni kutish (heartbeat / ack)
        while True:
            text = await ws.receive_text()
            try:
                msg = json.loads(text)
                if msg.get("type") == "ack" and msg.get("alarm_id"):
                    db_acknowledge_alarm(msg["alarm_id"], user.get("name", "?"))
                    log.info(f"WS ACK: {msg['alarm_id']} — {user.get('name')}")
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)


# ══════════════════════════════════════════════════════════
#  HEALTH CHECK
# ══════════════════════════════════════════════════════════

@app.get("/")
async def health():
    return {
        "status":   "ok",
        "service":  "Jizzax HET Backend",
        "version":  "1.0.0",
        "ws_clients": ws_manager.count,
        "time":     int(time.time() * 1000),
    }


# ── Ishga tushirish (to'g'ridan-to'g'ri python main.py) ──

if __name__ == "__main__":
    import uvicorn
    print(f"""
╔══════════════════════════════════════════════════╗
║   JIZZAX HET MONITORING — Backend Server         ║
╠══════════════════════════════════════════════════╣
║   API:       http://localhost:{cfg.PORT}              ║
║   Docs:      http://localhost:{cfg.PORT}/docs         ║
║   WebSocket: ws://localhost:{cfg.PORT}/ws             ║
╚══════════════════════════════════════════════════╝
""")
    uvicorn.run(
        "main:app",
        host=cfg.HOST,
        port=cfg.PORT,
        reload=False,
        log_level=cfg.LOG_LEVEL.lower(),
    )
