"""
Jizzax HET Backend — Sozlamalar
================================
.env faylidan o'qiladi, yo'q bo'lsa default ishlatiladi.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent

# ── Server ────────────────────────────────────────────────
HOST          = os.getenv("HOST", "0.0.0.0")
PORT          = int(os.getenv("PORT", "8000"))
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

# ── JWT ──────────────────────────────────────────────────
SECRET_KEY    = os.getenv("SECRET_KEY", "jizzax-het-secret-change-in-production-2026")
ALGORITHM     = "HS256"
TOKEN_EXPIRE  = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))   # 8 soat

# ── SQLite ───────────────────────────────────────────────
DB_PATH       = BASE_DIR / "jhet.db"

# ── CAS.NET ──────────────────────────────────────────────
# 0-BOSQICH: Bu manzilni CAS.NET tadqiqotidan to'ldiring
CASNET_URL    = os.getenv("CASNET_URL",  "http://web.cas.het")
CASNET_USER   = os.getenv("CASNET_USER", "")
CASNET_PASS   = os.getenv("CASNET_PASS", "")
FETCH_INTERVAL = int(os.getenv("FETCH_INTERVAL", "30"))  # soniya

# ── Telegram ─────────────────────────────────────────────
TG_TOKEN      = os.getenv("TG_TOKEN", "")

# ── Logging ──────────────────────────────────────────────
LOG_LEVEL     = os.getenv("LOG_LEVEL", "INFO")
