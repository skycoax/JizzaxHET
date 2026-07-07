import { useEffect, useMemo, useRef, useState } from 'react';
import type { Device, DistrictSummary } from '@/types';
import type { AppView } from '@/hooks/useHashRoute';
import { STATUS_META, stripDistrict, TYPE_META } from '@/lib/utils';
import { t } from '@/i18n';

// ============================================================
//  Ctrl+K buyruqlar palitrasi: sahifa / tuman / qurilma qidiruvi.
//  Diqqat: barcha o'tishlar klaviaturadan (↑↓ Enter Esc) ishlaydi.
// ============================================================

type Item =
  | { kind: 'view'; view: AppView; label: string }
  | { kind: 'district'; name: string; label: string; sub: string }
  | { kind: 'device'; id: string; label: string; sub: string; status: string };

const VIEWS: { view: AppView; key: string }[] = [
  { view: 'monitor',  key: 'nav.monitor' },
  { view: 'events',   key: 'nav.events' },
  { view: 'losses',   key: 'nav.losses' },
  { view: 'readings', key: 'nav.readings' },
  { view: 'load',     key: 'nav.load' },
  { view: 'registry', key: 'nav.registry' },
  { view: 'admin',    key: 'nav.admin' },
];

const KIND_LABEL: Record<Item['kind'], string> = {
  view: 'Sahifa',
  district: 'Tuman',
  device: 'Qurilma',
};

export function CommandPalette({ open, onClose, devices, districts, currentView, onView, onDevice, onDistrict }: {
  open: boolean;
  onClose: () => void;
  devices: Device[];
  districts: DistrictSummary[];
  currentView: AppView;
  onView: (v: AppView) => void;
  onDevice: (id: string) => void;
  onDistrict: (name: string) => void;
}) {
  const [q, setQ]     = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const s = q.trim().toLowerCase();
    const views: Item[] = VIEWS
      .filter(v => v.view !== currentView)
      .map(v => ({ kind: 'view' as const, view: v.view, label: t(v.key) }))
      .filter(v => !s || v.label.toLowerCase().includes(s));
    const dists: Item[] = !s ? [] : districts
      .filter(d => d.name.toLowerCase().includes(s))
      .slice(0, 5)
      .map(d => ({
        kind: 'district' as const,
        name: d.name,
        label: stripDistrict(d.name),
        sub: `${d.online}/${d.deviceCount} TM · ${d.availability}%`,
      }));
    const devs: Item[] = s.length < 2 ? [] : devices
      .filter(d => d.id.toLowerCase().includes(s) || d.name.toLowerCase().includes(s))
      .slice(0, 8)
      .map(d => ({
        kind: 'device' as const,
        id: d.id,
        label: `${d.id} · ${d.name}`,
        sub: `${TYPE_META[d.type].short} · ${stripDistrict(d.district)} · ${STATUS_META[d.status].label}`,
        status: d.status,
      }));
    // Qidiruvsiz — faqat sahifalar; qidiruvda qurilmalar birinchi
    return s ? [...devs, ...dists, ...views] : views;
  }, [q, devices, districts, currentView]);

  useEffect(() => { setIdx(0); }, [q]);

  // Faol qator ko'rinib turishi uchun scroll
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  if (!open) return null;

  const pick = (it: Item | undefined) => {
    if (!it) return;
    if (it.kind === 'view') onView(it.view);
    else if (it.kind === 'district') onDistrict(it.name);
    else onDevice(it.id);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(items[idx]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div className="cp-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-panel" role="dialog" aria-label="Buyruqlar palitrasi">
        <div className="cp-head">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="TM, tuman yoki sahifa qidirish…"
            aria-label="Qidirish"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cp-list" ref={listRef}>
          {items.length === 0 && <div className="cp-empty">Hech narsa topilmadi</div>}
          {items.map((it, i) => (
            <button
              key={it.kind + (it.kind === 'view' ? it.view : it.kind === 'district' ? it.name : it.id)}
              data-i={i}
              className={`cp-item${i === idx ? ' on' : ''}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => pick(it)}
            >
              <span className={`cp-kind k-${it.kind}`}>{KIND_LABEL[it.kind]}</span>
              <span className="cp-label">
                {it.label}
                {'sub' in it && <em>{it.sub}</em>}
              </span>
              {it.kind === 'device' && <i className="cp-dot" style={{ background: STATUS_META[it.status as keyof typeof STATUS_META]?.color }}/>}
            </button>
          ))}
        </div>
        <div className="cp-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> tanlash</span>
          <span><kbd>Enter</kbd> o'tish</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> ochish/yopish</span>
        </div>
      </div>
    </div>
  );
}
