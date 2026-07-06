"""
SQLite ma'lumotlar bazasi
==========================
Foydalanuvchilar, mas'ul shaxslar, avariya jurnali, konfiguratsiya.
"""
import sqlite3
import json
import uuid
import time
import logging
from pathlib import Path
from config import DB_PATH
from auth import hash_password

log = logging.getLogger(__name__)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ── Jadval yaratish ───────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    username     TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name    TEXT NOT NULL,
    role         TEXT NOT NULL,
    tetk_filter  TEXT,
    active       INTEGER DEFAULT 1,
    created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS persons (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    phone             TEXT NOT NULL,
    telegram_id       TEXT,
    telegram_username TEXT,
    assigned_tetk     TEXT NOT NULL,
    notify_types      TEXT NOT NULL,
    active            INTEGER DEFAULT 1,
    created_at        INTEGER NOT NULL,
    last_notified     INTEGER
);

CREATE TABLE IF NOT EXISTS alarm_log (
    id               TEXT PRIMARY KEY,
    device_id        TEXT NOT NULL,
    device_name      TEXT NOT NULL,
    district         TEXT NOT NULL,
    status           TEXT NOT NULL,
    timestamp        INTEGER NOT NULL,
    notified_persons TEXT,
    acknowledged_by  TEXT,
    acknowledged_at  INTEGER
);

CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""

DEFAULT_USERS = [
    {
        "username":      "admin",
        "password":      "Admin@2026",
        "full_name":     "Tizim administratori",
        "role":          "admin",
        "tetk_filter":   None,
    },
    {
        "username":      "dispetcher",
        "password":      "Disp@2026",
        "full_name":     "Navbatchi dispetcher",
        "role":          "dispatcher",
        "tetk_filter":   None,
    },
]

DEFAULT_PERSONS = [
    {"name": "Akmal Karimov",     "phone": "+998 90 123 45 67", "assigned_tetk": ["Jizzax shahri"],        "notify_types": ["offline","fault","theft","overload"]},
    {"name": "Dilshod Rahimov",   "phone": "+998 91 234 56 78", "assigned_tetk": ["Jizzax shahri"],        "notify_types": ["offline","fault"]},
    {"name": "Sanjar Qodirov",    "phone": "+998 91 789 01 23", "assigned_tetk": ["Sh. Rashidov tumani"], "notify_types": ["offline","fault"]},
    {"name": "Aziz Mahmudov",     "phone": "+998 91 111 22 33", "assigned_tetk": ["Gallaorol tumani"],    "notify_types": ["offline","fault","overload"]},
    {"name": "Shavkat Berdiyev",  "phone": "+998 90 444 55 66", "assigned_tetk": ["Zomin tumani"],        "notify_types": ["offline","fault"]},
    {"name": "Nodir Egamberdiyev","phone": "+998 94 777 88 99", "assigned_tetk": ["Do'stlik tumani"],     "notify_types": ["offline","fault"]},
    {"name": "Anvar Xolmatov",    "phone": "+998 94 211 22 33", "assigned_tetk": ["Mirzacho'l tumani"],   "notify_types": ["offline","fault"]},
    {"name": "Murod Yusupov",     "phone": "+998 91 433 44 55", "assigned_tetk": ["Zafarobod tumani"],    "notify_types": ["offline","fault"]},
    {"name": "Jahongir Rajabov",  "phone": "+998 91 999 00 11", "assigned_tetk": ["Paxtakor tumani"],     "notify_types": ["offline","fault"]},
    {"name": "Qahramon Eshonov",  "phone": "+998 93 544 55 66", "assigned_tetk": ["Forish tumani"],       "notify_types": ["offline","fault"]},
    {"name": "Shohrux Bozorov",   "phone": "+998 90 766 77 88", "assigned_tetk": ["Arnasoy tumani"],      "notify_types": ["offline","fault"]},
    {"name": "Sarvar Torayev",    "phone": "+998 91 877 88 99", "assigned_tetk": ["Baxmal tumani"],       "notify_types": ["offline","fault"]},
    {"name": "Asror Komilov",     "phone": "+998 93 988 99 00", "assigned_tetk": ["Zarbdor tumani"],      "notify_types": ["offline","fault"]},
    {"name": "Nodir Xasanov",     "phone": "+998 90 112 34 56", "assigned_tetk": ["Yangiobod tumani"],    "notify_types": ["offline","fault"]},
]

DEFAULT_CONFIG = {
    "tg_token":     "",
    "tg_enabled":   "false",
    "casnet_url":   "http://web.cas.het",
    "casnet_user":  "",
    "casnet_pass":  "",
    "fetch_interval": "30",
}


def init_db() -> None:
    """Ma'lumotlar bazasini yaratish va boshlang'ich ma'lumotlarni qo'shish."""
    log.info(f"SQLite: {DB_PATH}")
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        _seed_users(conn)
        _seed_persons(conn)
        _seed_config(conn)
        conn.commit()
    log.info("DB tayyor.")


def _seed_users(conn: sqlite3.Connection) -> None:
    for u in DEFAULT_USERS:
        exists = conn.execute("SELECT 1 FROM users WHERE username=?", (u["username"],)).fetchone()
        if not exists:
            conn.execute(
                "INSERT INTO users(id,username,password_hash,full_name,role,tetk_filter,created_at) VALUES(?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), u["username"], hash_password(u["password"]),
                 u["full_name"], u["role"], u["tetk_filter"], int(time.time() * 1000))
            )
            log.info(f"Foydalanuvchi yaratildi: {u['username']}")


def _seed_persons(conn: sqlite3.Connection) -> None:
    count = conn.execute("SELECT COUNT(*) FROM persons").fetchone()[0]
    if count == 0:
        for p in DEFAULT_PERSONS:
            conn.execute(
                "INSERT INTO persons(id,name,phone,telegram_id,telegram_username,assigned_tetk,notify_types,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), p["name"], p["phone"], None, None,
                 json.dumps(p["assigned_tetk"], ensure_ascii=False),
                 json.dumps(p["notify_types"]), 1, int(time.time() * 1000))
            )
        log.info(f"{len(DEFAULT_PERSONS)} ta mas'ul shaxs yaratildi.")


def _seed_config(conn: sqlite3.Connection) -> None:
    for k, v in DEFAULT_CONFIG.items():
        exists = conn.execute("SELECT 1 FROM config WHERE key=?", (k,)).fetchone()
        if not exists:
            conn.execute("INSERT INTO config(key,value) VALUES(?,?)", (k, v))


# ── Users ─────────────────────────────────────────────────

def db_get_user_by_username(username: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE username=? AND active=1", (username,)).fetchone()
        return dict(row) if row else None


def db_get_all_users() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT id,username,full_name,role,tetk_filter,active,created_at FROM users").fetchall()
        return [dict(r) for r in rows]


def db_create_user(username: str, password: str, full_name: str, role: str, tetk_filter: str | None) -> dict:
    uid = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users(id,username,password_hash,full_name,role,tetk_filter,active,created_at) VALUES(?,?,?,?,?,?,?,?)",
            (uid, username, hash_password(password), full_name, role, tetk_filter, 1, int(time.time() * 1000))
        )
        conn.commit()
    return {"id": uid, "username": username, "full_name": full_name, "role": role}


# ── Persons ───────────────────────────────────────────────

def db_get_persons() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM persons ORDER BY name").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["assigned_tetk"] = json.loads(d["assigned_tetk"])
            d["notify_types"]  = json.loads(d["notify_types"])
            result.append(d)
        return result


def db_save_person(p: dict) -> dict:
    pid = p.get("id") or str(uuid.uuid4())
    with get_conn() as conn:
        exists = conn.execute("SELECT 1 FROM persons WHERE id=?", (pid,)).fetchone()
        data = (
            p["name"], p["phone"],
            p.get("telegram_id"), p.get("telegram_username"),
            json.dumps(p.get("assigned_tetk", []), ensure_ascii=False),
            json.dumps(p.get("notify_types", []), ensure_ascii=False),
            1 if p.get("active", True) else 0,
        )
        if exists:
            conn.execute(
                "UPDATE persons SET name=?,phone=?,telegram_id=?,telegram_username=?,assigned_tetk=?,notify_types=?,active=? WHERE id=?",
                (*data, pid)
            )
        else:
            conn.execute(
                "INSERT INTO persons(id,name,phone,telegram_id,telegram_username,assigned_tetk,notify_types,active,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                (pid, *data, int(time.time() * 1000))
            )
        conn.commit()
    p["id"] = pid
    return p


def db_delete_person(pid: str) -> bool:
    with get_conn() as conn:
        n = conn.execute("DELETE FROM persons WHERE id=?", (pid,)).rowcount
        conn.commit()
        return n > 0


def db_persons_for_district(district: str, notify_type: str) -> list[dict]:
    """Tuman va alarm turi bo'yicha bildirishnoma oladigan shaxslar."""
    persons = db_get_persons()
    return [
        p for p in persons
        if p["active"]
        and p.get("telegram_id")
        and district in p["assigned_tetk"]
        and notify_type in p["notify_types"]
    ]


# ── Alarm log ─────────────────────────────────────────────

def db_log_alarm(device_id: str, device_name: str, district: str,
                 status: str, notified: list[str]) -> str:
    aid = str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO alarm_log(id,device_id,device_name,district,status,timestamp,notified_persons) VALUES(?,?,?,?,?,?,?)",
            (aid, device_id, device_name, district, status,
             int(time.time() * 1000), json.dumps(notified, ensure_ascii=False))
        )
        conn.commit()
    return aid


def db_acknowledge_alarm(alarm_id: str, by: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE alarm_log SET acknowledged_by=?, acknowledged_at=? WHERE id=?",
            (by, int(time.time() * 1000), alarm_id)
        )
        conn.commit()


def db_get_alarm_log(limit: int = 100) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM alarm_log ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


# ── Config ────────────────────────────────────────────────

def db_get_config() -> dict:
    with get_conn() as conn:
        rows = conn.execute("SELECT key,value FROM config").fetchall()
        return {r["key"]: r["value"] for r in rows}


def db_set_config(key: str, value: str) -> None:
    with get_conn() as conn:
        conn.execute("INSERT OR REPLACE INTO config(key,value) VALUES(?,?)", (key, value))
        conn.commit()
