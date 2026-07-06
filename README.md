# Jizzax HET — Situatsion markaz (Dashboard)

Jizzax hududiy elektr tarmoqlari korxonasi situatsion (dispetcherlik) markazi uchun real vaqtli monitoring tizimi.

> Hozir barcha ma'lumotlar **demo (test)** ko'rinishida. Lekin interfeys va arxitektura haqiqiy loyiha uchun mo'ljallangan (production-grade).

## Texnologiyalar
- React 18 + TypeScript
- Vite
- Leaflet (xarita moduli — keyingi bosqichda)

## Ishga tushirish
```bash
npm install
npm run dev
```
Brauzerda oching: http://localhost:5173

Production build:
```bash
npm run build
npm run preview
```

## Arxitektura — eng muhim jihat
Interfeys ma'lumot bilan **to'g'ridan-to'g'ri ishlamaydi**. Barcha ma'lumot `src/services` dagi `DataService` interfeysi orqali keladi:

- `src/services/types.ts` — `DataService` interfeysi (shartnoma)
- `src/services/mockDataService.ts` — demo ma'lumot + jonli simulyatsiya
- `src/services/index.ts` — **faol servis shu yerda tanlanadi**

Haqiqiy backendga ulanish uchun: `DataService` ni amalga oshiruvchi yangi sinf yozing (masalan, WebSocket yoki REST bilan) va uni `src/services/index.ts` da tayinlang.
**Interfeysga (UI) bitta qator ham tegmaydi** — demo va haqiqiy tizim bir xil kodda ishlaydi.

## Papka tuzilmasi
```
src/
  components/ui        dizayn tizimi (Card, Badge, StatCard, Button...)
  components/layout    TopBar, AppShell
  features/dashboard   KPI, mavjudlik, tumanlar jadvali
  features/map         xarita moduli (keyingi bosqich)
  features/alarms      avariyalar (keyingi bosqich)
  services             ma'lumot qatlami (mock + real almashtirish nuqtasi)
  hooks                useDashboardData, useClock
  lib                  formatlash, status meta
  styles               tokens.css (dizayn tokenlari) + app.css
  i18n.ts              tarjimalar (uz)
  types.ts             umumiy tiplar
```

## Bosqichlar
- [x] 1-bosqich — Loyiha skeleti, dizayn tizimi, ma'lumot qatlami, asosiy panel (KPI + tumanlar)
- [x] 2-bosqich — Xarita moduli (MapLibre GL: Cyber 3D, sun'iy yo'ldosh, drill-down)
- [x] 3-bosqich — Avariyalar tasmasi va chuqur tahlil (ack, ovoz, sabab/chora)
- [x] 4-bosqich — Qurilmalar reyestri (qidiruv, filtr, saralash, batafsil) + Tumanlarning haqiqiy chegaralari (GeoJSON)
- [ ] 5-bosqich — Hisobotlar va analitika
- [ ] 6-bosqich — Ma'muriyat / rollar / sozlamalar
- [ ] 7-bosqich — Real ma'lumotga ulanish, autentifikatsiya, deploy
