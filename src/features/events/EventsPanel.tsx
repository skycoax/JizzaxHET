import { useEffect, useMemo, useRef, useState } from 'react';
import type { DeviceEvent, EventPriority, EventType } from '@/types';
import { stripDistrict } from '@/lib/utils';

type Opt = { value: string; label: string; color?: string };

/** Ixcham filtr menyusi — bir tugma ostiga yig'ilgan tanlov ro'yxati. */
function FilterMenu({ label, value, options, onChange }: {
  label: string; value: string; options: Opt[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const current = options.find(o => o.value === value) ?? options[0];
  const active = value !== 'all';
  return (
    <div className="evf" ref={ref}>
      <button className={`evf-btn${active ? ' active' : ''}${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
        <span className="evf-lbl">{label}</span>
        <span className="evf-val">{active && current.color && <i style={{ background: current.color }}/>}{current.label}</span>
        <svg className="evf-chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div className="evf-menu">
          {options.map(o => (
            <button key={o.value} className={`evf-opt${o.value === value ? ' on' : ''}`} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="evf-opt-l">{o.color && <i style={{ background: o.color }}/>}{o.label}</span>
              {o.value === value && (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  offline: "Aloqa yo'q", fault: 'Nosozlik', theft: "O‘g‘irlik",
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

/* ── Filtrlar URL'da: #/events?tur=theft&holat=unack&daraja=critical&q=... ── */
function readHashParams(): URLSearchParams {
  const h = window.location.hash;
  const qi = h.indexOf('?');
  return new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : '');
}

function writeHashParams(patch: Record<string, string | null>): void {
  const h = window.location.hash;
  const qi = h.indexOf('?');
  const base = qi >= 0 ? h.slice(0, qi) : h;
  const sp = new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : '');
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === '' || v === 'all') sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', base + (qs ? '?' + qs : ''));
}

const EVENT_TYPES: EventType[] = ['offline', 'fault', 'theft', 'overload', 'restore', 'warning', 'info'];
const PRIOS: EventPriority[] = ['critical', 'high', 'medium', 'low'];

function initTypeF(): 'all' | EventType {
  const v = readHashParams().get('tur');
  return v && (EVENT_TYPES as string[]).includes(v) ? (v as EventType) : 'all';
}
function initPrioF(): 'all' | EventPriority {
  const v = readHashParams().get('daraja');
  return v && (PRIOS as string[]).includes(v) ? (v as EventPriority) : 'all';
}
function initAckF(): 'all' | 'unack' | 'ack' {
  const v = readHashParams().get('holat');
  return v === 'unack' || v === 'ack' ? v : 'all';
}

export function EventsPanel({
  events,
  onSelectDevice,
}: {
  events: DeviceEvent[];
  onSelectDevice: (id: string) => void;
}) {
  const [typeF,   setTypeF]   = useState<'all' | EventType>(initTypeF);
  const [prioF,   setPrioF]   = useState<'all' | EventPriority>(initPrioF);
  const [ackF,    setAckF]    = useState<'all'|'unack'|'ack'>(initAckF);
  const [search,  setSearch]  = useState(() => readHashParams().get('q') ?? '');
  const [localAck, setLocalAck] = useState<Set<string>>(new Set());

  // Filtrlar URL bilan sinxron — havolani ulashish mumkin
  useEffect(() => {
    writeHashParams({ tur: typeF, holat: ackF, daraja: prioF, q: search || null });
  }, [typeF, ackF, prioF, search]);

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

  // Filtrlangan jurnalni CSV (Excel ochadi) qilib yuklab olish
  const exportCsv = () => {
    const rows: string[][] = [['№', 'Vaqt', 'ID', 'Nomi', 'Tuman', 'Tur', 'Xabar', 'Jiddiylik', 'Holat']];
    filtered.forEach((e, i) => rows.push([
      String(i + 1),
      formatTs(e.timestamp),
      e.deviceId,
      e.deviceName,
      stripDistrict(e.district),
      EVENT_LABELS[e.eventType],
      e.message,
      PRIO_LABELS[e.priority],
      (e.acknowledged || localAck.has(e.id)) ? 'Tasdiqlangan' : 'Tasdiqlanmagan',
    ]));
    // BOM + ";" — Excel (ru/uz lokal) to'g'ri ochishi uchun
    const csv = '\uFEFF' + rows
      .map(r => r.map(c => '"' + c.replace(/"/g, '""') + '"').join(';'))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = `hodisalar_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const PRIO_COLORS: Record<EventPriority, string> = { critical: 'var(--crit)', high: 'var(--fault)', medium: 'var(--warn)', low: 'var(--accent)' };
  const typeOpts: Opt[] = [
    { value: 'all', label: 'Barcha tur' },
    ...(['offline','fault','theft','overload','restore','warning','info'] as EventType[]).map(ty => ({ value: ty, label: EVENT_LABELS[ty], color: EVENT_COLORS[ty] })),
  ];
  const ackOpts: Opt[] = [
    { value: 'all', label: 'Barcha holat' },
    { value: 'unack', label: 'Tasdiqlanmagan' },
    { value: 'ack', label: 'Tasdiqlangan' },
  ];
  const prioOpts: Opt[] = [
    { value: 'all', label: 'Barcha daraja' },
    ...(['critical','high','medium','low'] as EventPriority[]).map(p => ({ value: p, label: PRIO_LABELS[p], color: PRIO_COLORS[p] })),
  ];

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
          <button className="evts-ackall" onClick={exportCsv} disabled={filtered.length === 0} title="Filtrlangan jurnalni Excel (CSV) ko'rinishida yuklab olish">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel
          </button>
          <button className="evts-ackall" onClick={ackAll} disabled={unackCount === 0}>
            Barchasini tasdiqlash ({unackCount})
          </button>
          <div className="evts-count mono">{filtered.length} ta hodisa</div>
        </div>
        <div className="evts-filters">
          <FilterMenu label="Tur" value={typeF} options={typeOpts} onChange={v => setTypeF(v as 'all' | EventType)}/>
          <FilterMenu label="Holat" value={ackF} options={ackOpts} onChange={v => setAckF(v as 'all' | 'unack' | 'ack')}/>
          <FilterMenu label="Jiddiylik" value={prioF} options={prioOpts} onChange={v => setPrioF(v as 'all' | EventPriority)}/>
          {(typeF !== 'all' || ackF !== 'all' || prioF !== 'all') && (
            <button className="evf-reset" onClick={() => { setTypeF('all'); setAckF('all'); setPrioF('all'); }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Tozalash
            </button>
          )}
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
