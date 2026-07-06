import type { DeviceStatus, DeviceType } from '@/types';

/** Har bir status uchun nom va rang (CSS o'zgaruvchisi). */
export const STATUS_META: Record<DeviceStatus, { label: string; color: string }> = {
  online: { label: 'Ishlayapti', color: 'var(--ok)' },
  warning: { label: 'Ogohlantirish', color: 'var(--warn)' },
  fault: { label: 'Nosozlik', color: 'var(--fault)' },
  offline: { label: "Aloqa yo'q", color: 'var(--crit)' },
};

/** Qurilma turi uchun nom. */
export const TYPE_META: Record<DeviceType, { label: string; short: string }> = {
  concentrator: { label: 'TP konsentrator', short: 'TP' },
  household: { label: 'Maishiy hisoblagich', short: 'Maishiy' },
  business: { label: 'Tadbirkorlik obyekti', short: 'Biznes' },
};

const WEEK = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const pad = (n: number) => String(n).padStart(2, '0');

export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const formatDateUz = (d: Date) =>
  `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${WEEK[d.getDay()]}`;

export const formatNumber = (n: number) => n.toLocaleString('ru-RU');

/** Nosozlik boshlanganidan beri o'tgan vaqtni o'zbekcha qaytaradi. */
export function formatDuration(since: number): string {
  const mins = Math.floor((Date.now() - since) / 60000);
  if (mins < 1) return '1 daqiqadan kam';
  if (mins < 60) return `${mins} daqiqa`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} soat ${m} daq` : `${h} soat`;
}

/** "Gallaorol tumani" -> "Gallaorol", "Jizzax shahri" -> "Jizzax sh." */
export const stripDistrict = (s: string) => s.replace(' tumani', '').replace(' shahri', ' sh.');

// ============================================================
//  Haqiqiy CAS.NET TETK kodlari (08000-Jizzax HETK ichida)
//  Manba: CAS.NET ichki xarita ko'rinishi (08000-Jizzax HETK)
// ============================================================
export const TETK_MAP: Record<string, { code: string; tetk: string; short: string }> = {
  'Arnasoy tumani':      { code: '08201', tetk: '08201-Arnasoy TETK',      short: 'Arnasoy' },
  'Baxmal tumani':       { code: '08204', tetk: '08204-Baxmal TETK',       short: 'Baxmal' },
  'Gallaorol tumani':    { code: '08209', tetk: "08209-G'allaorol TETK",   short: "G'allaorol" },
  'Sh. Rashidov tumani': { code: '08212', tetk: '08212-Sh.Rashidov TETK',  short: 'Sh.Rashidov' },
  "Do'stlik tumani":     { code: '08215', tetk: "08215-Do'stlik TETK",     short: "Do'stlik" },
  'Zomin tumani':        { code: '08218', tetk: '08218-Zomin TETK',        short: 'Zomin' },
  'Zarbdor tumani':      { code: '08220', tetk: '08220-Zarbdor TETK',      short: 'Zarbdor' },
  "Mirzacho'l tumani":   { code: '08223', tetk: '08223-Mirzacho1 TETK',    short: 'Mirzacho1' },
  'Zafarobod tumani':    { code: '08225', tetk: '08225-Zafarobod TETK',    short: 'Zafarobod' },
  'Paxtakor tumani':     { code: '08228', tetk: '08228-Paxtakor TETK',     short: 'Paxtakor' },
  'Forish tumani':       { code: '08235', tetk: '08235-Forish TETK',       short: 'Forish' },
  'Yangiobod tumani':    { code: '08237', tetk: '08237-Yangiobod TETK',    short: 'Yangiobod' },
  'Jizzax shahri':       { code: '08402', tetk: '08402-Jizzax ShETK',      short: 'Jizzax Sh.' },
};

export const getTetk      = (d: string) => TETK_MAP[d]?.tetk  ?? d;
export const getTetkCode  = (d: string) => TETK_MAP[d]?.code  ?? '?????';
export const getTetkShort = (d: string) => TETK_MAP[d]?.short ?? stripDistrict(d);
