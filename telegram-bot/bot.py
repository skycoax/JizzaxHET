#!/usr/bin/env python3
"""
Jizzax HET — Telegram Bildirishnoma Boti
=========================================
Dashboard dan alarm qabul qiladi va mas'ul
shaxslarga Telegram orqali yuboradi.

O'rnatish:
    pip install -r requirements.txt

Ishga tushirish:
    python bot.py

Sozlash:
    config.json faylini tahrirlang yoki
    dashboard Admin panelidan o'zgartiring.
"""

import json
import os
import sys
import signal
import logging
import threading
import time
from datetime import datetime
from typing import Optional
try:
    import requests
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("\n❌  Kerakli kutubxonalar o'rnatilmagan!")
    print("    Iltimos: pip install -r requirements.txt\n")
    sys.exit(1)

# ─── Logging ───────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    datefmt='%H:%M:%S',
)
log = logging.getLogger('jhet-bot')

# ─── Config ────────────────────────────────────────────────
CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'config.json')
PERSONS_FILE = os.path.join(os.path.dirname(__file__), 'persons.json')

DEFAULT_CONFIG = {
    'bot_token': '',
    'port': 8080,
    'host': '0.0.0.0',
}

def load_config() -> dict:
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, encoding='utf-8') as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    # Yangi config yaratamiz
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_CONFIG, f, indent=2, ensure_ascii=False)
    return DEFAULT_CONFIG

def load_persons() -> list:
    """Dashboard dan eksport qilingan yoki qo'lda kiritilgan shaxslar."""
    if os.path.exists(PERSONS_FILE):
        with open(PERSONS_FILE, encoding='utf-8') as f:
            return json.load(f)
    return []

cfg = load_config()
BOT_TOKEN: str = cfg.get('bot_token', '')
PORT: int = int(cfg.get('port', 8080))
HOST: str = cfg.get('host', '0.0.0.0')

# ─── Telegram API ──────────────────────────────────────────
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

def tg_send(chat_id: str, text: str, reply_markup: Optional[dict] = None) -> bool:
    """Telegram orqali xabar yuborish."""
    if not BOT_TOKEN:
        log.warning("Bot token sozlanmagan! config.json ni tekshiring.")
        return False
    try:
        payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
        if reply_markup:
            payload['reply_markup'] = json.dumps(reply_markup)
        r = requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        resp = r.json()
        if not resp.get('ok'):
            log.error(f"Telegram xato: {resp.get('description')}")
            return False
        return True
    except requests.exceptions.Timeout:
        log.error("Telegram API vaqt tugadi (timeout)")
        return False
    except Exception as e:
        log.error(f"Telegram ulanish xatosi: {e}")
        return False

def format_alarm(alarm: dict) -> str:
    """Alarm xabarini Telegram format (HTML) ga o'tkazish."""
    status = alarm.get('status', 'offline')
    emojis = {'offline': '🔴', 'fault': '🟠', 'theft': '🟣', 'overload': '🟡', 'warning': '🟡'}
    labels = {'offline': "ALOQA YO'Q", 'fault': 'NOSOZLIK', 'theft': "O'G'IRLIK", 'overload': 'YUKLANISH OSHDI', 'warning': 'OGOHLANTIRISH'}
    emoji = emojis.get(status, '⚠️')
    label = labels.get(status, status.upper())

    ts = alarm.get('timestamp', int(time.time() * 1000))
    dt = datetime.fromtimestamp(ts / 1000)
    time_str = dt.strftime('%H:%M:%S  %d.%m.%Y')

    return (
        f"{emoji} <b>YANGI AVARIYA — JIZZAX HET</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🏭 <b>{alarm.get('deviceId', '?')}</b>  ·  {alarm.get('deviceName', '?')}\n"
        f"📍 {alarm.get('district', '?')}\n"
        f"🔴 Holat: <b>{label}</b>\n"
        f"⏱ Vaqt: {time_str}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 Mas'ul: {alarm.get('responsibleName', '?')}\n"
        f"📞 {alarm.get('responsiblePhone', '?')}\n\n"
        f"⚡ Iltimos, darhol tekshiring va harakatlaringizni bildiring!"
    )

def alarm_keyboard(device_id: str) -> dict:
    """Inline tugmalar (tasdiqlash va yo'lda)."""
    return {
        'inline_keyboard': [[
            {'text': '✅ Tasdiqlash',  'callback_data': f'ack:{device_id}'},
            {'text': '🚗 Yo\'lda',     'callback_data': f'onway:{device_id}'},
        ], [
            {'text': '📋 Batafsil',   'callback_data': f'detail:{device_id}'},
        ]]
    }

# ─── Flask HTTP server ──────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.route('/alarm', methods=['POST', 'OPTIONS'])
def receive_alarm():
    """Dashboard dan alarm qabul qilish va tegishli shaxslarga yuborish."""
    if request.method == 'OPTIONS':
        return '', 204

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'ok': False, 'error': 'JSON kerak'}), 400

    device_id = data.get('deviceId', '?')
    district  = data.get('district', '')
    status    = data.get('status', 'offline')
    log.info(f"📨  Alarm: {device_id} ({district}) — {status}")

    persons = load_persons()
    notified = []
    skipped  = []

    for person in persons:
        if not person.get('active', True):
            continue
        if district not in person.get('assignedTetk', []):
            continue
        if status not in person.get('notifyTypes', ['offline', 'fault']):
            continue

        tg_id = person.get('telegramId')
        if not tg_id:
            skipped.append(person.get('name', '?'))
            continue

        msg = format_alarm(data)
        ok  = tg_send(tg_id, msg, alarm_keyboard(device_id))
        if ok:
            log.info(f"  ✅  {person['name']} ga yuborildi")
            notified.append(person['name'])
        else:
            log.warning(f"  ❌  {person['name']} ga yuborib bo'lmadi")

    if not notified and not skipped:
        log.info(f"  ℹ️   {district} uchun biriktirilgan faol mas'ul topilmadi")

    return jsonify({'ok': True, 'notified': notified, 'skipped': skipped})


@app.route('/test', methods=['POST', 'OPTIONS'])
def send_test():
    """Test xabar yuborish."""
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json(silent=True) or {}
    tg_id = data.get('telegramId') or data.get('telegramId')
    name  = data.get('name', 'Foydalanuvchi')
    if not tg_id:
        return jsonify({'ok': False, 'error': 'telegramId kerak'}), 400

    msg = (
        "🧪 <b>Test xabar — Jizzax HET Monitoring</b>\n\n"
        "✅ Bot muvaffaqiyatli sozlangan!\n"
        f"👤 Salom, <b>{name}</b>!\n\n"
        "Hududingizdagi avariyalar haqida\n"
        "shu bot orqali xabar olasiz."
    )
    ok = tg_send(tg_id, msg)
    return jsonify({'ok': ok})


@app.route('/status', methods=['GET'])
def get_status():
    """Bot va server holati."""
    persons = load_persons()
    active  = [p for p in persons if p.get('active') and p.get('telegramId')]
    return jsonify({
        'ok': True,
        'bot_token_set': bool(BOT_TOKEN),
        'persons_total': len(persons),
        'persons_active': len(active),
        'server_time': datetime.now().isoformat(),
    })


@app.route('/persons', methods=['POST', 'OPTIONS'])
def update_persons():
    """Dashboard dan shaxslar ro'yxatini qabul qilish."""
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json(silent=True)
    if not isinstance(data, list):
        return jsonify({'ok': False, 'error': 'list kerak'}), 400
    with open(PERSONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    log.info(f"📝  Shaxslar yangilandi: {len(data)} ta")
    return jsonify({'ok': True, 'count': len(data)})


# ─── Telegram Polling (response handler) ───────────────────
def poll_updates():
    """Foydalanuvchi javoblarini qabul qilish (polling)."""
    if not BOT_TOKEN:
        return
    offset = 0
    log.info("🔄  Telegram polling boshlandi...")
    while True:
        try:
            r = requests.get(
                f"{TG_API}/getUpdates",
                params={'offset': offset, 'timeout': 30},
                timeout=35,
            )
            updates = r.json().get('result', [])
            for upd in updates:
                offset = upd['update_id'] + 1
                handle_update(upd)
        except requests.exceptions.ReadTimeout:
            pass
        except Exception as e:
            log.error(f"Polling xato: {e}")
            time.sleep(5)

def handle_update(upd: dict):
    """Foydalanuvchi javobini qayta ishlash."""
    # Oddiy xabar
    msg = upd.get('message')
    if msg:
        text    = msg.get('text', '')
        chat_id = str(msg['chat']['id'])
        f_name  = msg.get('from', {}).get('first_name', '')
        if text.startswith('/start'):
            tg_send(chat_id,
                f"👋 Salom, <b>{f_name}</b>!\n\n"
                "Siz Jizzax HET Monitoring botiga ulandingiz.\n\n"
                f"📋 Sizning Telegram ID: <code>{chat_id}</code>\n\n"
                "Bu ID ni Admin panelga kiriting — "
                "hududingizdagi avariyalar haqida xabar olasiz."
            )
            log.info(f"👤  /start: {f_name} (ID: {chat_id})")
        return

    # Inline tugma bosish
    cb = upd.get('callback_query')
    if cb:
        data    = cb.get('data', '')
        f_name  = cb.get('from', {}).get('first_name', '')
        chat_id = str(cb['from']['id'])
        msg_id  = cb['message']['message_id']

        if data.startswith('ack:'):
            device = data.split(':', 1)[1]
            log.info(f"✅  {f_name} tasdikladi: {device}")
            # Tugmani yangilaymiz
            try:
                requests.post(f"{TG_API}/editMessageReplyMarkup", json={
                    'chat_id': chat_id, 'message_id': msg_id, 'reply_markup': json.dumps({'inline_keyboard': []})
                }, timeout=5)
                requests.post(f"{TG_API}/answerCallbackQuery", json={
                    'callback_query_id': cb['id'], 'text': '✅ Tasdiqlandi!'
                }, timeout=5)
            except Exception:
                pass
            tg_send(chat_id, f"✅ <b>{device}</b> uchun avariya tasdiqlandi.\nBrigada yo'lda!")

        elif data.startswith('onway:'):
            device = data.split(':', 1)[1]
            log.info(f"🚗  {f_name} yo'lda: {device}")
            try:
                requests.post(f"{TG_API}/answerCallbackQuery", json={
                    'callback_query_id': cb['id'], 'text': "🚗 Yo'lda deb belgilandi!"
                }, timeout=5)
            except Exception:
                pass


# ─── Main ──────────────────────────────────────────────────
if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════╗
║   JIZZAX HET — Telegram Bildirishnoma Boti    ║
╠═══════════════════════════════════════════════╣
║   HTTP server:  http://localhost:{PORT:<13}  ║
║   Telegram:     Polling rejimi                ║
╚═══════════════════════════════════════════════╝
""")
    if not BOT_TOKEN:
        print("⚠️   DIQQAT: Bot token sozlanmagan!")
        print("    config.json faylida 'bot_token' ni to'ldiring")
        print("    Token olish: https://t.me/botfather → /newbot\n")

    # Polling alohida threadda
    t = threading.Thread(target=poll_updates, daemon=True)
    t.start()

    # Flask server
    log.info(f"🚀  HTTP server port {PORT} da ishga tushdi")
    try:
        app.run(host=HOST, port=PORT, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\n👋  Bot to'xtatildi.")
