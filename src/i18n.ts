// ============================================================
// Soddalashtirilgan i18n. Hozir faqat o'zbekcha.
// Keyinroq ruscha qo'shilsa, shu yerga ikkinchi lug'at qo'shiladi.
// ============================================================

const uz: Record<string, string> = {
  "app.title": "JIZZAX HUDUDIY ELEKTR TARMOQLARI",
  "app.subtitle": "Situatsion dispetcherlik markazi",

  "panel.kpis": "Operatsion ko'rsatkichlar",
  "panel.byDistrict": "Tumanlar kesimida",
  "panel.alarms": "Favqulodda xabarlar",

  "kpi.availability": "Tarmoq mavjudligi (availability)",
  "kpi.nodesOnline": "tugun onlayn",
  "kpi.totalNodes": "Jami tugun",
  "kpi.online": "Onlayn",
  "kpi.activeAlarms": "Faol avariya",
  "kpi.affected": "Ta'sirlangan iste'molchi",
  "kpi.connected": "Jami ulangan (maishiy + tadbirkorlik)",

  "topbar.fullscreen": "To'liq ekran",
  "topbar.exitFullscreen": "Oynaga qaytish",
  "topbar.soundOn": "Ovoz yoniq",
  "topbar.soundOff": "Ovoz o'chiq",
  "topbar.live": "Jonli",
  "topbar.systemStatus": "Tizim holati",

  "table.district": "Tuman",
  "table.tp": "TP",
  "table.alarms": "Avr.",
  "table.availability": "Mavjudlik",

  "feed.offline": "Aloqa yo'q",
  "feed.fault": "Nosozlik",
  "feed.warning": "Ogohlantirish",

  "loading": "Yuklanmoqda…",

  "soon.tag": "Keyingi bosqich",
  "soon.mapTitle": "Interaktiv xarita moduli",
  "soon.mapText": "Tumanlar bo'yicha klasterlash, drill-down va xarita rejimlari shu bo'limda ulanadi.",
  "soon.alarmsTitle": "Xabarlar tasmasi va chuqur tahlil",
  "soon.alarmsText": "Avariyalar ro'yxati, tasdiqlash va har bir nosozlik bo'yicha chuqur tahlil keyingi bosqichda ulanadi.",

  "filter.all": "Hammasi",
  "alarm.empty": "Faol avariyalar yo'q",
  "alarm.emptySub": "Tarmoq barqaror ishlamoqda.",
  "alarm.ack": "Tasdiqlash",
  "alarm.acked": "Tasdiqlangan",
  "alarm.ackAll": "Barchasini tasdiqlash",
  "alarm.details": "Tafsilot",
  "alarm.severity": "Jiddiylik",
  "alarm.duration": "Davomiyligi",
  "alarm.affected": "Ta'sirlangan",
  "alarm.voltage": "Kuchlanish",
  "alarm.meters": "Hisoblagich",
  "alarm.cause": "Ehtimoliy sabab",
  "alarm.action": "Tavsiya etilgan chora",
  "alarm.responsible": "Mas'ul shaxs",
  "alarm.onMap": "Xaritada ko'rsatish",

  "nav.monitor": "Monitoring markazi",
  "nav.registry": "Qurilmalar reyestri",

  "sit.title": "Situatsion kuzatuv",
  "sit.battery": "Batareya quvvatidagi TP",
  "sit.lines": "Faol liniyalar",
  "sit.overload": "Yuklanish oshgan TP",
  "sit.offline": "O'chgan TPlar",
  "sit.theft": "O'g'irlik aniqlangan TP",
  "sit.locations": "joylashuvlar",
};

export function t(key: string): string {
  return uz[key] ?? key;
}
