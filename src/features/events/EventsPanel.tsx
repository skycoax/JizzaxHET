import { useMemo, useState } from 'react';
import type { DeviceEvent, EventPriority, EventType } from '@/types';
import { stripDistrict } from '@/lib/utils';

const EVENT_COLORS: Record<EventType, string> = {
  offline: 'var(--crit)',
  fault:   'var(--fault)',
  theft:   '#b06bff',
  overload:'var(--warn)',
  restore: 'var(--ok)',
  warning: 'var(--warn)',
  info:    'var(--accent)',
};
const EVENT_LABELS: Record<EventType, string> = {
  offline: "Aloqa yo'q", fault: 'Nosozlik', theft: "O'g'irlik",
  overload: 'Yuklanish', restore: 'Tiklangan', warning: 'Ogohlantirish', info: 'Ma\'lumot',
};
const PRIO_LABELS: Record<EventPriority, string> = {
  critical: 'Kritik', high: 'Yuqori', medium: "O'rta", low: 'Past',
};

function formatTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function EventsPanel({
  events,
  onSelectDevice,
}: {
  events: DeviceEvent[];
  onSelectDevice: (id: string) => void;
}) {
  const [typeF,   setTypeF]   = useState<'all' | EventType>('all');
  const [prioF,   setPrioF]   = useState<'all' | EventPriority>('all');
  const [ackF,    setAckF]    = useState<'all'|'unack'|'ack'>('all');
  const [search,  setSearch]  = useState('');
  const [localAck, setLocalAck] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = events;
    if (typeF !== 'all') list = list.filter(e => e.eventType === typeF);
    if (prioF !== 'all') list = list.filter(e => e.priority === prioF);
    if (ackF === 'unack') list = list.filter(e => !e.acknowledged && !localAck.has(e.id));
    if (ackF === 'ack')   list = list.filter(e => e.acknowledged || localAck.has(e.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.deviceId.toLowerCase().includes(q) ||
        e.deviceName.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [events, typeF, prioF, ackF, search, localAck]);

  const unackCount = events.filter(e => !e.acknowledged && !localAck.has(e.id)).length;

  const ackAll = () => {
    const ids = new Set(filtered.filter(e => !e.acknowledged).map(e => e.id));
    setLocalAck(prev => new Set([...prev, ...ids]));
  };

  return (
    <div className="evts-wrap">
      {/* Toolbar */}
      <div className="evts-toolbar">
        <div className="evts-top-row">
          <div className="evts-title">
            Hodisalar jurnali
            {unackCount > 0 && <span className="evts-badge">{unackCount}</span>}
          </div>
          <div className="evts-search-wrap">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="evts-search" placeholder="Qurilma, xabar..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="evts-ackall" onClick={ackAll} disabled={unackCount === 0}>
            Barchasini tasdiqlash ({unackCount})
          </button>
          <div className="evts-count mono">{filtered.length} ta hodisa</div>
        </div>
        <div className="evts-filters">
          <div className="reg-fgroup">
            {(['all','offline','fault','theft','overload','restore','warning','info'] as const).map(t => (
              <button key={t} className={`rfilt${typeF===t?' on':''}`} style={t!=='all'?{'--c':EVENT_COLORS[t]} as React.CSSProperties:undefined} onClick={() => setTypeF(t)}>
                {t==='all'?'Barcha tur':EVENT_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="reg-fgroup">
            {(['all','unack','ack'] as const).map(a => (
              <button key={a} className={`rfilt${ackF===a?' on':''}`} onClick={() => setAckF(a)}>
                {a==='all'?'Hammasi':a==='unack'?"Tasdiqlanmagan":'Tasdiqlangan'}
              </button>
            ))}
          </div>
          <div className="reg-fgroup">
            {(['all','critical','high','medium','low'] as const).map(p => (
              <button key={p} className={`rfilt${prioF===p?' on':''}`} onClick={() => setPrioF(p)}>
                {p==='all'?'Barcha':PRIO_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jadval */}
      <div className="evts-body">
        <table className="evts-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Vaqt</th>
              <th>ID</th>
              <th>Nomi</th>
              <th>Tuman</th>
              <th>Tur</th>
              <th>Xabar</th>
              <th>Jiddiylik</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev, i) => {
              const isAck = ev.acknowledged || localAck.has(ev.id);
              return (
                <tr key={ev.id} className={`erow${isAck?' acked':''}${ev.priority==='critical'?' ep-crit':ev.priority==='high'?' ep-high':''}`}>
                  <td className="mono">{i + 1}</td>
                  <td className="mono ets">{formatTs(ev.timestamp)}</td>
                  <td>
                    <button className="edev-btn" onClick={() => onSelectDevice(ev.deviceId)}>
                      {ev.deviceId}
                    </button>
                  </td>
                  <td className="ename">{ev.deviceName}</td>
                  <td className="edist">{stripDistrict(ev.district)}</td>
                  <td>
                    <span className="etype-badge" style={{background:`color-mix(in srgb,${EVENT_COLORS[ev.eventType]} 14%,transparent)`, color:EVENT_COLORS[ev.eventType]}}>
                      {EVENT_LABELS[ev.eventType]}
                    </span>
                  </td>
                  <td className="emsg">{ev.message}</td>
                  <td>
                    <span className={`eprio p-${ev.priority}`}>{PRIO_LABELS[ev.priority]}</span>
                  </td>
                  <td>
                    {isAck ? (
                      <span className="eack on">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Tasdiqlangan
                      </span>
                    ) : (
                      <button className="eack-btn" onClick={() => setLocalAck(p => new Set([...p, ev.id]))}>
                        Tasdiqlash
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="evts-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Hodisa topilmadi
          </div>
        )}
      </div>
    </div>
  );
}
