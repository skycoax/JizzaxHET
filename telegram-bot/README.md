# Jizzax HET — Telegram Bildirishnoma Boti

## O'rnatish

```bash
cd telegram-bot
pip install -r requirements.txt
```

## Sozlash

**1. Bot token olish:**
1. Telegram'da [@BotFather](https://t.me/botfather) ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting (masalan: `JizzaxHET_bot`)
4. Token olinadi: `1234567890:AAF...`

**2. config.json ni to'ldirish:**
```json
{
  "bot_token": "1234567890:AAFxxxxxxxx",
  "port": 8080
}
```

**3. Telegram ID olish:**
- Botga `/start` yuboring — ID ko'rinadi
- Yoki [@userinfobot](https://t.me/userinfobot) ga `/start` yuboring

## Ishga tushirish

```bash
python bot.py
```

## Admin panelidan sozlash

1. Dashboard → Admin paneli → Telegram Bot tab
2. Bot token va server manzilini kiriting
3. "Tekshirish" tugmasi bilan ulanishni sinang
4. Mas'ul shaxslar bo'limida har bir shaxsga Telegram ID kiriting
5. Test xabar yuborib sinang

## Arxitektura

```
Dashboard (React)
    ↓  POST /alarm  (alarm aniqlanganda)
Bot Server (Python/Flask)
    ↓  Telegram API
Mas'ul shaxs (Telegram)
    ↓  ✅ Tasdiqlash tugmasi
Bot Server → log
```

## API endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | /alarm | Dashboard dan alarm qabul qilish |
| POST | /test | Test xabar yuborish |
| GET | /status | Bot holati |
| POST | /persons | Shaxslar ro'yxatini yangilash |
