import { useEffect, useRef } from 'react';
import type { Device, DeviceStatus } from '@/types';
import { STATUS_META, formatDuration, stripDistrict } from '@/lib/utils';

export interface AlarmNotification {
  id: string;
  deviceId: string;
  deviceName: string;
  district: string;
  status: DeviceStatus;
  responsibleName: string;
  responsiblePhone: string;
  timestamp: number;
}

const AUTO_DISMISS_MS = 60_000;

// Bitta bildirishnoma kartasi
function ToastItem({
  n, onDismiss, onShow,
}: { n: AlarmNotification; onDismiss:(id:string)=>void; onShow:(id:string)=>void; }) {
  const meta = STATUS_META[n.status];
  const tel  = n.responsiblePhone.replace(/\s/g, '');
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const elapsed   = Date.now() - n.timestamp;
    const remaining = Math.max(0, AUTO_DISMISS_MS - elapsed);
    bar.style.transition = 'none';
    bar.style.width = `${(remaining / AUTO_DISMISS_MS) * 100}%`;
    requestAnimationFrame(() => {
      bar.style.transition = `width ${remaining / 1000}s linear`;
      bar.style.width = '0%';
    });
    const t = setTimeout(() => onDismiss(n.id), remaining);
    return () => clearTimeout(t);
  }, [n.id, n.timestamp, onDismiss]);

  const isCrit = n.status === 'offline';

  return (
    <div className={`toast-item ${isCrit ? 'tc-crit' : 'tc-fault'}`}>
      <div className="toast-hd">
        <span className="toast-badge" style={{ color: meta.color }}>
          <span className="toast-pulse" style={{ background: meta.color }}/>
          {isCrit ? "ALOQA YO'Q — KRITIK" : 'NOSOZLIK ANIQLANDI'}
        </span>
        <button className="toast-x" onClick={() => onDismiss(n.id)}>&#x2715;</button>
      </div>
      <div className="toast-bd">
        <div className="toast-dev">
          <span className="toast-devid">{n.deviceId}</span>
          <span className="toast-devnm">{n.deviceName}</span>
        </div>
        <div className="toast-loc">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {stripDistrict(n.district)}
          <span className="toast-dur" style={{ color: meta.color }}>
            · {formatDuration(n.timestamp)}
          </span>
        </div>
        <div className="toast-resp">
          <div className="toast-rn">{n.responsibleName}</div>
          <a href={`tel:${tel}`} className="toast-ph">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {n.responsiblePhone}
          </a>
          <a href={`tel:${tel}`} className="toast-call-btn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Qo'ng'iroq
          </a>
        </div>
      </div>
      <button className="toast-show" onClick={() => { onShow(n.deviceId); onDismiss(n.id); }}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Xaritada ko'rsatish
      </button>
      <div className="toast-bar-wrap">
        <div ref={barRef} className="toast-bar" style={{ background: meta.color }}/>
      </div>
    </div>
  );
}

/** Bildirishnomalar konteyneri (ekranning o'ng pastida). */
export function AlarmToastContainer({ notifications, onDismiss, onShow }: {
  notifications: AlarmNotification[];
  onDismiss: (id:string) => void;
  onShow: (deviceId:string) => void;
}) {
  if (notifications.length === 0) return null;
  return (
    <div className="toast-container">
      {notifications.slice(0, 6).map(n => (
        <ToastItem key={n.id} n={n} onDismiss={onDismiss} onShow={onShow}/>
      ))}
    </div>
  );
}

// Toast ma'lumotini Device dan yaratish uchun yordamchi
export function deviceToNotification(d: Device): AlarmNotification {
  return {
    id: `${d.id}:${d.faultSince}`,
    deviceId: d.id,
    deviceName: d.name,
    district: d.district,
    status: d.status,
    responsibleName: d.responsibleName,
    responsiblePhone: d.responsiblePhone,
    timestamp: d.faultSince ?? Date.now(),
  };
}
