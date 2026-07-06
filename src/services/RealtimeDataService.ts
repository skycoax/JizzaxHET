import type { DashboardSnapshot } from '@/types';
import type { DataService } from './types';

type Listener = (s: DashboardSnapshot) => void;

/**
 * Backend WebSocket orqali jonli ma'lumot olish.
 * Uzilganda avtomatik qayta ulanadi (3s).
 */
export class RealtimeDataService implements DataService {
  private ws:   WebSocket | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();
  private last: DashboardSnapshot | null = null;
  private active = false;

  constructor(
    private readonly base: string,   // http://localhost:8000
    private readonly token: string,
  ) {}

  async getSnapshot(): Promise<DashboardSnapshot> {
    const r = await fetch(`${this.base}/snapshot`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!r.ok) throw new Error(`Snapshot xato: ${r.status}`);
    return r.json();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.last) listener(this.last);
    this.active = true;
    this._connect();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this._disconnect();
    };
  }

  private _connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws?.close();
    const url = this.base
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      + `/ws?token=${this.token}`;
    const ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'snapshot' && msg.data) {
          this.last = msg.data;
          this.listeners.forEach(l => l(msg.data));
        }
      } catch {}
    };
    ws.onclose = () => {
      if (this.active) {
        this.timer = setTimeout(() => this._connect(), 3000);
      }
    };
    ws.onerror = () => ws.close();
    this.ws = ws;
  }

  private _disconnect(): void {
    this.active = false;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }

  /** Avariya tasdiqlash (WebSocket orqali backendga yuborish). */
  ackAlarm(alarmId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ack', alarm_id: alarmId }));
    }
  }
}
