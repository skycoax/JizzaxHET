import type { DataService } from './types';
import type {
  DashboardKpis,
  DashboardSnapshot,
  Device,
  DeviceEvent,
  DeviceStatus,
  DistrictSummary,
  LoadPoint,
  MeterReading,
  PowerLine,
  SystemStatus,
} from '@/types';
import { createInitialDevices } from './mockData';
import {
  generateBizReadings, generateEvents,
  generateLoadProfile, generateTpReadings,
} from './mockReadings';

type Listener = (snapshot: DashboardSnapshot) => void;

const TICK_MS = 7000;
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const distSq = (a: Device, b: Device) => (a.lat - b.lat) ** 2 + (a.lng - b.lng) ** 2;

/** Statik liniya topologiyasi (active har snapshotda qayta hisoblanadi). */
interface LineTopo {
  id: string;
  from: string;
  to: string;
  coords: [[number, number], [number, number]];
  district: string;
  trunk: boolean;
}

/**
 * Demo ma'lumot manbai. DataService interfeysini amalga oshiradi.
 * Holatni xotirada saqlaydi, har TICK_MS da realistik o'zgartiradi
 * va obunachilarni xabardor qiladi. Haqiqiy backend kelganda shu sinf
 * o'rniga WebSocket/REST versiyasi qo'yiladi — UI o'zgarmaydi.
 */
class MockDataService implements DataService {
  private devices: Device[] = createInitialDevices();
  private readings: Record<string, MeterReading[]> = {};
  private events: DeviceEvent[] = [];
  private loadProfile: LoadPoint[] = generateLoadProfile();
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;

  async getSnapshot(): Promise<DashboardSnapshot> {
    return this.buildSnapshot();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (Object.keys(this.readings).length === 0) this.initReadings();
    if (this.events.length === 0) this.initEvents();
    listener(this.buildSnapshot());
    this.ensureTimer();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }

  private ensureTimer(): void {
    if (this.timer === null) {
      this.timer = setInterval(() => {
        this.tick();
        this.emit();
      }, TICK_MS);
    }
  }

  private emit(): void {
    const snapshot = this.buildSnapshot();
    this.listeners.forEach((l) => l(snapshot));
  }

  /** Realistik simulyatsiya: status, yuklanish drift, batareya, kam-kam o'g'irlik. */
  private tick(): void {
    const changes = Math.random() < 0.25 ? 2 : 1;
    for (let i = 0; i < changes; i++) {
      const d = this.devices[randInt(0, this.devices.length - 1)];
      const r = Math.random();
      if (d.status !== 'online') {
        if (r < 0.55) this.setStatus(d, 'online');
        else if (r < 0.62) this.setStatus(d, d.status === 'warning' ? 'fault' : 'warning');
      } else {
        if (r < 0.022) this.setStatus(d, 'offline');
        else if (r < 0.05) this.setStatus(d, 'fault');
        else if (r < 0.09) this.setStatus(d, 'warning');
      }
    }

    // Yuklanish drifti (TP/biznes)
    for (const d of this.devices) {
      if (d.type !== 'household' && d.status !== 'offline' && typeof d.loadPercent === 'number') {
        d.loadPercent = clamp(Math.round(d.loadPercent + (Math.random() * 6 - 3)), 22, 104);
      }
    }

    // Batareya rejimi vaqti-vaqti bilan almashadi
    if (Math.random() < 0.06) {
      const tps = this.devices.filter((d) => d.type === 'concentrator' && d.status !== 'offline');
      const t = tps[randInt(0, tps.length - 1)];
      t.onBattery = !t.onBattery;
      t.lastUpdate = Date.now();
    }

    // Yangi hodisa yozilishi
    if (Math.random() < 0.15 && this.events.length > 0) {
      this.addLiveEvent();
    }

    // Yangi o'g'irlik juda kam aniqlanadi
    if (Math.random() < 0.006) {
      const tps = this.devices.filter((d) => d.type === 'concentrator' && !d.theft);
      if (tps.length > 0) {
        const t = tps[randInt(0, tps.length - 1)];
        t.theft = true;
        t.lastUpdate = Date.now();
      }
    }
  }

  private setStatus(d: Device, status: DeviceStatus): void {
    if (d.status === status) return;
    d.status = status;
    d.lastUpdate = Date.now();
    const isTp = d.type === 'concentrator';

    if (status === 'offline') {
      d.metersOnline = 0;
      d.voltage = '—';
      if (d.type !== 'household') d.loadPercent = 0;
      if (isTp) d.onBattery = false;
      if (d.faultSince === null) d.faultSince = Date.now();
    } else if (status === 'online') {
      d.metersOnline = isTp ? Math.max(0, d.metersTotal - randInt(0, 1)) : d.metersTotal;
      d.voltage = `${randInt(226, 232)} V`;
      if (d.type !== 'household' && (d.loadPercent ?? 0) < 20) d.loadPercent = randInt(40, 75);
      d.faultSince = null;
    } else if (status === 'fault') {
      d.metersOnline = isTp ? Math.max(0, d.metersTotal - randInt(2, 7)) : d.metersTotal;
      d.voltage = `${randInt(241, 252)} V`;
      if (d.faultSince === null) d.faultSince = Date.now();
    } else {
      d.metersOnline = isTp ? Math.max(0, d.metersTotal - randInt(0, 4)) : d.metersTotal;
      d.voltage = `${randInt(205, 215)} V`;
      if (d.faultSince === null) d.faultSince = Date.now();
    }
  }

  private buildSnapshot(): DashboardSnapshot {
    const lines: PowerLine[] = [];
    return {
      devices: this.devices.map((d) => ({ ...d })),
      districts: this.buildDistricts(),
      lines,
      kpis: this.buildKpis(lines),
      events: [...this.events],
      readings: { ...this.readings },
      loadProfile: [...this.loadProfile],
      generatedAt: Date.now(),
    };
  }

  private initReadings(): void {
    for (const d of this.devices) {
      if (d.type === 'concentrator') {
        this.readings[d.id] = generateTpReadings(d.id, d.metersTotal);
      } else if (d.type === 'business') {
        this.readings[d.id] = generateBizReadings(d.id);
      }
    }
  }

  private initEvents(): void {
    this.events = generateEvents(
      this.devices.map(d => ({ id: d.id, name: d.name, district: d.district, type: d.type }))
    );
  }

  private addLiveEvent(): void {
    const tps = this.devices.filter(d => d.type !== 'household');
    const d = tps[Math.floor(Math.random() * tps.length)];
    const types = ['restore', 'warning', 'info', 'fault', 'offline'] as const;
    const w = [0.35, 0.25, 0.2, 0.12, 0.08];
    let cum = 0; const rv = Math.random();
    let etype: typeof types[number] = 'info';
    for (let j = 0; j < types.length; j++) { cum += w[j]; if (rv < cum) { etype = types[j]; break; } }
    this.events.unshift({
      id: `EV-LV-${Date.now()}`,
      deviceId: d.id, deviceName: d.name, district: d.district,
      eventType: etype,
      message: etype === 'restore' ? 'Qurilma tarmoqqa qaytdi' :
               etype === 'fault'   ? `Anomaliya aniqlandi (${Math.round(220+Math.random()*30)} V)` :
               etype === 'offline' ? 'Aloqa uzildi' :
               etype === 'warning' ? `Yuklanish oshdi: ${Math.round(85+Math.random()*14)}%` :
                                     "Kunlik korsatkichlar yigindi",
      timestamp: Date.now(),
      acknowledged: false,
      priority: etype === 'offline' ? 'critical' : etype === 'fault' ? 'high' :
                etype === 'warning' ? 'medium' : 'low',
    });
    if (this.events.length > 150) this.events.pop();
  }

    private buildDistricts(): DistrictSummary[] {
    const groups = new Map<string, Device[]>();
    for (const d of this.devices) {
      const arr = groups.get(d.district);
      if (arr) arr.push(d);
      else groups.set(d.district, [d]);
    }
    const result: DistrictSummary[] = [];
    groups.forEach((devs, name) => {
      const count = devs.length;
      const online = devs.filter((d) => d.status === 'online').length;
      const alarms = devs.filter((d) => d.status === 'offline' || d.status === 'fault').length;
      const warnings = devs.filter((d) => d.status === 'warning').length;
      let worst: DeviceStatus = 'online';
      if (devs.some((d) => d.status === 'offline')) worst = 'offline';
      else if (devs.some((d) => d.status === 'fault')) worst = 'fault';
      else if (devs.some((d) => d.status === 'warning')) worst = 'warning';
      result.push({
        name,
        deviceCount: count,
        online,
        alarms,
        warnings,
        worstStatus: worst,
        availability: Math.round((online / count) * 100),
        lat: devs.reduce((s, d) => s + d.lat, 0) / count,
        lng: devs.reduce((s, d) => s + d.lng, 0) / count,
      });
    });
    return result;
  }

  private buildKpis(_lines: PowerLine[]): DashboardKpis {
    let online = 0, warnings = 0, faults = 0, offline = 0, affected = 0, connected = 0;
    let batteryTps = 0, overloadedTps = 0, offlineTps = 0, theftTps = 0;
    for (const d of this.devices) {
      if (d.status === 'online') online++;
      else if (d.status === 'warning') warnings++;
      else if (d.status === 'fault') faults++;
      else offline++;
      if (d.status !== 'online') affected += Math.max(0, d.metersTotal - d.metersOnline);
      connected += d.metersTotal;
      if (d.type === 'concentrator') {
        if (d.onBattery && d.status !== 'offline') batteryTps++;
        if ((d.loadPercent ?? 0) >= 90 && d.status !== 'offline') overloadedTps++;
        if (d.status === 'offline') offlineTps++;
        if (d.theft) theftTps++;
      }
    }
    const totalNodes = this.devices.length;
    const activeAlarms = faults + offline;
    let systemStatus: SystemStatus = 'stable';
    if (activeAlarms >= 3) systemStatus = 'critical';
    else if (activeAlarms > 0 || warnings > 0) systemStatus = 'warning';

    return {
      totalNodes,
      online,
      warnings,
      faults,
      offline,
      activeAlarms,
      affectedConsumers: affected,
      connectedConsumers: connected,
      availability: (online / totalNodes) * 100,
      systemStatus,
      batteryTps,
      activeLines: 0,
      totalLines: 0,
      overloadedTps,
      offlineTps,
      theftTps,
    };
  }
}

export const mockDataService = new MockDataService();
