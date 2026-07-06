// ============================================================
//  Umumiy tiplar — butun ilova shu modelga tayanadi.
// ============================================================

export type DeviceStatus   = 'online' | 'warning' | 'fault' | 'offline';
export type DeviceType     = 'concentrator' | 'household' | 'business';
export type SystemStatus   = 'stable' | 'warning' | 'critical';
export type EventType      = 'offline' | 'fault' | 'theft' | 'overload' | 'restore' | 'warning' | 'info';
export type EventPriority  = 'critical' | 'high' | 'medium' | 'low';
export type ReadingSource  = 'view.ami' | 'smart' | 'manual';

/** Bir oylik / bir kunlik hisoblagich ko'rsatkichi (CAS.NET formatida). */
export interface MeterReading {
  period: string;           // "04/2026" yoki "2026-04-15"
  source: ReadingSource;
  plusA: number;            // +A (kWh) — faol iste'mol
  minusA: number;           // -A (kWh) — faol generatsiya
  plusR: number;            // +R (kvarh) — reaktiv iste'mol
  minusR: number;           // -R (kvarh) — reaktiv generatsiya
  t1: number;               // T1: 22:00-06:00 kWh
  t2: number;               // T2: 06:00-09:00, 17:00-22:00 kWh
  t3: number;               // T3: 09:00-17:00 kWh
  t4: number;               // T4 kWh
  anomaly: boolean;
  predicted: boolean;
  missing: boolean;
}

/** Bir soatlik yuklanish nuqtasi (график uchun). */
export interface LoadPoint {
  hour: number;             // 0-23
  dayOffset: number;        // 0=bugun, 1=kecha...
  kw: number;               // kW
}

/** Tizim hodisasi / avariya yozig'i. */
export interface DeviceEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  district: string;
  eventType: EventType;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  priority: EventPriority;
}

/** Tarmoqdagi bitta qurilma. */
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  district: string;
  lat: number;
  lng: number;
  status: DeviceStatus;
  metersTotal: number;
  metersOnline: number;
  responsibleName: string;
  responsiblePhone: string;
  voltage: string;
  faultSince: number | null;
  lastUpdate: number;
  onBattery?: boolean;
  loadPercent?: number;
  theft?: boolean;
  /** Energiya yo'qotish % (TP kirgan - hisoblagichlar jami). */
  lossPercent?: number;
  /** Yo'qotish 8-15% (shubhali, hali o'g'irlik emas). */
  lossElevated?: boolean;
}

export interface PowerLine {
  id: string;
  from: string;
  to: string;
  coords: [[number, number], [number, number]];
  district: string;
  trunk: boolean;
  active: boolean;
}

export interface DistrictSummary {
  name: string;
  deviceCount: number;
  online: number;
  alarms: number;
  warnings: number;
  worstStatus: DeviceStatus;
  availability: number;
  lat: number;
  lng: number;
}

export interface DashboardKpis {
  totalNodes: number;
  online: number;
  warnings: number;
  faults: number;
  offline: number;
  activeAlarms: number;
  affectedConsumers: number;
  connectedConsumers: number;
  availability: number;
  systemStatus: SystemStatus;
  batteryTps: number;
  activeLines: number;
  totalLines: number;
  overloadedTps: number;
  offlineTps: number;
  theftTps: number;
}

export interface DashboardSnapshot {
  devices: Device[];
  districts: DistrictSummary[];
  lines: PowerLine[];
  kpis: DashboardKpis;
  events: DeviceEvent[];
  readings: Record<string, MeterReading[]>;  // deviceId -> 12 oy
  loadProfile: LoadPoint[];                  // 7 kun × 24 soat
  generatedAt: number;
}

// ============================================================
//  Mas'ul shaxs (Admin panel uchun)
// ============================================================
export type NotifyType = 'offline' | 'fault' | 'theft' | 'overload' | 'warning';

export interface ResponsiblePerson {
  id: string;
  name: string;
  phone: string;
  telegramId: string | null;       // Telegram chat ID (raqam)
  telegramUsername: string | null;  // @username
  assignedTetk: string[];          // district nomlar ('Zomin tumani' kabi)
  notifyTypes: NotifyType[];       // qaysi turdagi alarm
  active: boolean;
  createdAt: number;
  lastNotified: number | null;     // oxirgi xabar vaqti
}

export interface BotConfig {
  token: string;          // @BotFather dan olingan token
  serverUrl: string;      // bot server URL (masalan: http://localhost:8080)
  enabled: boolean;
}
