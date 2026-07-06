import type { DeviceEvent, EventPriority, EventType, LoadPoint, MeterReading, ReadingSource } from '@/types';

// ============================================================
//  Realistik hisoblagich ko'rsatkichlari generatori
//  (CAS.NET "Показания счетчика" formatida)
// ============================================================

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

const MONTHS = [
  '06/2026','05/2026','04/2026','03/2026','02/2026','01/2026',
  '12/2025','11/2025','10/2025','09/2025','08/2025','07/2025',
];

/** TP konsentrator uchun oylik ko'rsatkichlar (metersTotal dan hisoblash). */
export function generateTpReadings(deviceId: string, metersTotal: number): MeterReading[] {
  const r = rng(hashStr(deviceId) ^ 0xdeadbeef);
  const base = metersTotal * (220 + r() * 140); // oyiga bir hisoblagich: 220-360 kWh
  const readings: MeterReading[] = [];

  for (let i = 0; i < MONTHS.length; i++) {
    const season = getSeasonFactor(MONTHS[i]);
    const plusA = Math.round((base * season * (0.85 + r() * 0.3)) * 10) / 10;
    const plusR = Math.round(plusA * (0.62 + r() * 0.22) * 10) / 10;
    const minusA = Math.round(r() * 0.008 * plusA * 10) / 10;
    const minusR = Math.round(r() * 0.015 * plusR * 10) / 10;
    const anomaly = r() < 0.06;
    const missing = r() < 0.03 && i > 2;
    const src: ReadingSource = r() < 0.82 ? 'view.ami' : 'smart';
    // T1/T2/T3 taqsimot (T4=0 — standart 3-tarif)
    const t1 = Math.round(plusA * (0.22 + r() * 0.06) * 10) / 10;
    const t2 = Math.round(plusA * (0.33 + r() * 0.05) * 10) / 10;
    const t3 = Math.round((plusA - t1 - t2) * 10) / 10;
    readings.push({
      period: MONTHS[i],
      source: missing ? 'manual' : src,
      plusA: missing ? 0 : plusA,
      minusA: missing ? 0 : minusA,
      plusR: missing ? 0 : plusR,
      minusR: missing ? 0 : minusR,
      t1: missing ? 0 : t1,
      t2: missing ? 0 : t2,
      t3: missing ? 0 : t3,
      t4: 0,
      anomaly,
      predicted: i === 0 && r() < 0.35,
      missing,
    });
  }
  return readings;
}

/** Tadbirkorlik obyekti uchun oylik ko'rsatkichlar. */
export function generateBizReadings(deviceId: string): MeterReading[] {
  const r = rng(hashStr(deviceId) ^ 0xcafebabe);
  const base = 18000 + r() * 140000; // biznes: 18k-158k kWh/oy
  const readings: MeterReading[] = [];

  for (let i = 0; i < MONTHS.length; i++) {
    const season = getSeasonFactor(MONTHS[i]);
    const plusA = Math.round(base * season * (0.88 + r() * 0.24) * 10) / 10;
    const plusR = Math.round(plusA * (0.55 + r() * 0.3) * 10) / 10;
    const minusA = Math.round(r() * 0.02 * plusA * 10) / 10;
    const minusR = Math.round(r() * 0.02 * plusR * 10) / 10;
    const t1 = Math.round(plusA * (0.18 + r() * 0.08) * 10) / 10;
    const t2 = Math.round(plusA * (0.36 + r() * 0.06) * 10) / 10;
    const t3 = Math.round((plusA - t1 - t2) * 10) / 10;
    readings.push({
      period: MONTHS[i],
      source: r() < 0.75 ? 'view.ami' : 'smart',
      plusA, minusA, plusR, minusR,
      t1, t2, t3, t4: 0,
      anomaly: r() < 0.05,
      predicted: i === 0 && r() < 0.2,
      missing: false,
    });
  }
  return readings;
}

// ---- Yuklanish profili (7 kun × 24 soat, MW) ----
const HOURLY_BASE = [
  0.62,0.55,0.50,0.47,0.46,0.48, // 00-05 (tun)
  0.54,0.72,0.91,0.95,0.97,0.98, // 06-11 (ertalab cho'qqi)
  0.96,0.94,0.93,0.91,0.89,0.90, // 12-17 (kunduzi)
  0.98,1.00,0.99,0.96,0.88,0.74, // 18-23 (kechki cho'qqi)
];
export function generateLoadProfile(): LoadPoint[] {
  const r = rng(Date.now() ^ 0x11223344);
  const pts: LoadPoint[] = [];
  const peak = 42 + r() * 18; // 42-60 MW viloyat cho'qqisi
  for (let day = 0; day < 7; day++) {
    for (let h = 0; h < 24; h++) {
      const kw = Math.round(peak * HOURLY_BASE[h] * (0.93 + r() * 0.14) * 1000);
      pts.push({ hour: h, dayOffset: day, kw });
    }
  }
  return pts;
}

// ---- Hodisalar logi ----
const EVENT_MESSAGES: Record<EventType, string[]> = {
  offline: [
    "Qurilma bilan aloqa uzildi - GSM signali yoq",
    "Elektr taminoti yoq - TP ochgan",
    "Aloqa moduli javob bermaydi",
  ],
  fault: [
    "Kuchlanish menordan yuqori: {v} V",
    "Hisoblagichlar bilan qisman aloqa yoq ({n} ta)",
    "Olchov anomaliyasi aniqlandi",
  ],
  theft: [
    "Ruxsatsiz ulanish aniqlandi",
    "Magnit tasir sensori ishga tushdi",
    "Qopqoq ochilganligi aniqlandi",
  ],
  overload: [
    "Yuklanish menordan oshdi: {p}%",
    "Transformator quvvati chegarasiga yetdi",
    "Choqqiy yuklanish qayd etildi",
  ],
  restore: [
    "Qurilma tarmoqqa qaytdi",
    "Aloqa tiklandi, korsatkichlar normal",
    "Nosozlik bartaraf etildi",
  ],
  warning: [
    "Kuchlanish menordan past: {v} V",
    "Batareya quvvati past - {p}%",
    "Korsatkich ozgarish tezligi yuqori",
  ],
  info: [
    "Kunlik korsatkichlar yigindi",
    "Rejalashtirilgan texnik korik",
    "Yangi hisoblagich royxatga olindi",
  ],
};


const PRIORITY_MAP: Record<EventType, EventPriority> = {
  offline: 'critical', fault: 'high', theft: 'critical',
  overload: 'high', restore: 'low', warning: 'medium', info: 'low',
};

export function generateEvents(
  devices: { id: string; name: string; district: string; type: string }[],
): DeviceEvent[] {
  const r = rng(20260611);
  const tps = devices.filter(d => d.type !== 'household');
  const events: DeviceEvent[] = [];
  const types: EventType[] = ['offline','fault','theft','overload','restore','warning','info'];
  const weights = [0.18, 0.18, 0.05, 0.12, 0.22, 0.12, 0.13];
  const now = Date.now();

  for (let i = 0; i < 120; i++) {
    const dev = tps[Math.floor(r() * tps.length)];
    // kümülatif ağırlık seçimi
    let cum = 0;
    const rv = r();
    let etype: EventType = 'info';
    for (let j = 0; j < types.length; j++) {
      cum += weights[j];
      if (rv < cum) { etype = types[j]; break; }
    }
    const msgs = EVENT_MESSAGES[etype];
    let msg = msgs[Math.floor(r() * msgs.length)];
    msg = msg
      .replace('{v}', String(Math.round(205 + r() * 50)))
      .replace('{n}', String(Math.round(2 + r() * 12)))
      .replace('{p}', String(Math.round(85 + r() * 18)));

    // 0-30 kun ichida
    const ts = now - Math.round(r() * 30 * 86400 * 1000);
    events.push({
      id: `EV-${String(i + 1).padStart(4, '0')}`,
      deviceId: dev.id,
      deviceName: dev.name,
      district: dev.district,
      eventType: etype,
      message: msg,
      timestamp: ts,
      acknowledged: r() < 0.62,
      priority: PRIORITY_MAP[etype],
    });
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ---- Yordamchi funksiyalar ----
function getSeasonFactor(period: string): number {
  const m = parseInt(period.split('/')[0]);
  // Qish = ko'p energiya, yoz = kamroq (O'zbekiston)
  const factors: Record<number, number> = {
    1:1.35, 2:1.28, 3:1.08, 4:0.95, 5:0.88, 6:0.82,
    7:0.85, 8:0.89, 9:0.93, 10:1.05, 11:1.18, 12:1.30,
  };
  return factors[m] ?? 1;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
