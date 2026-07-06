import { useRef, useEffect, useState } from 'react';
import { t } from '@/i18n';
import type { DashboardKpis } from '@/types';
import { useCounter } from '@/hooks/useCounter';

export type AppView =
  'monitor' | 'readings' | 'events' | 'load' |
  'losses'  | 'registry' | 'admin';

export function NavStrip({ view, onChange, kpis }: {
  view: AppView;
  onChange: (v: AppView) => void;
  kpis: DashboardKpis;
}) {
  const alarmCount  = useCounter(kpis.activeAlarms);
  const theftCount  = useCounter(kpis.theftTps);
  const stripRef    = useRef<HTMLDivElement>(null);
  const [ind, setInd] = useState({ left: 0, width: 0 });

  type Tab = { id: AppView; label: string; badge?: string | number; icon: JSX.Element };

  const tabs: Tab[] = [
    {
      id: 'monitor', label: t('nav.monitor'),
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10" opacity=".35"/>
        <path d="m12 12 4-5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      </svg>,
    },
    {
      id: 'readings', label: t('nav.readings'),
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>,
    },
    {
      id: 'events', label: t('nav.events'),
      badge: alarmCount > 0 ? alarmCount : undefined,
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>,
    },
    {
      id: 'load', label: t('nav.load'),
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>,
    },
    {
      id: 'losses', label: "Yo'qotishlar",
      badge: theftCount > 0 ? theftCount : undefined,
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 3.5 7.5v5c0 4.6 3.6 7.6 8.5 8.5 4.9-.9 8.5-3.9 8.5-8.5v-5L12 3z"/>
        <line x1="8" y1="9" x2="16" y2="15"/>
      </svg>,
    },
    {
      id: 'registry', label: t('nav.registry'),
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>,
    },
    {
      id: 'admin', label: "Ma'muriyat",
      icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>,
    },
  ];

  // Sliding indicator
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const activeBtn = strip.querySelector<HTMLElement>('.nav-btn.on');
    if (!activeBtn) return;
    setInd({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth });
  }, [view]);

  return (
    <nav className="navstrip" ref={stripRef}>
      {/* Sliding indicator */}
      <span
        className="nav-indicator"
        style={{ left: ind.left, width: ind.width }}
      />
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn${view === tab.id ? ' on' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          <span className="nav-label">{tab.label}</span>
          {tab.badge !== undefined && (
            <span key={tab.badge} className="nav-badge">{tab.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
