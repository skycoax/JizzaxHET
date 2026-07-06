import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';
import { useClock } from '@/hooks/useClock';
import { useCounter } from '@/hooks/useCounter';
import { formatDateUz, formatTime } from '@/lib/utils';
import type { AppView } from '@/hooks/useHashRoute';
import type { DashboardKpis, SystemStatus } from '@/types';
import type { AuthUser } from '@/hooks/useAuth';
import type { Theme } from '@/hooks/useTheme';

export interface AppSettings {
  showDistrictStats: boolean;
  showNotifications: boolean;
  autoFlyToAlarm: boolean;
}

const SYS: Record<SystemStatus, { label: string; color: string }> = {
  stable:   { label: 'BARQAROR',      color: 'var(--ok)' },
  warning:  { label: 'OGOHLANTIRISH', color: 'var(--warn)' },
  critical: { label: 'DIQQAT',        color: 'var(--crit)' },
};

const COLLAPSE_KEY = 'jhet-sidebar-collapsed';

/* ── Ikonalar ─────────────────────────────────────────────── */
const I = {
  monitor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 2a10 10 0 0 0-10 10" opacity=".35"/>
      <path d="m12 12 4-5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  readings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  load: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  losses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 3.5 7.5v5c0 4.6 3.6 7.6 8.5 8.5 4.9-.9 8.5-3.9 8.5-8.5v-5L12 3z"/>
      <line x1="8" y1="9" x2="16" y2="15"/>
    </svg>
  ),
  registry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

type NavItem = { id: AppView; label: string; icon: JSX.Element; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

interface Props {
  view: AppView;
  onChange: (v: AppView) => void;
  kpis: DashboardKpis;
  soundOn: boolean;
  onToggleSound: () => void;
  settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  user: AuthUser | null;
  demoMode: boolean;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Sidebar({
  view, onChange, kpis,
  soundOn, onToggleSound,
  settings, onSettings,
  user, demoMode, onLogout,
  theme, onToggleTheme,
}: Props) {
  const now        = useClock();
  const alarmCount = useCounter(kpis.activeAlarms);
  const theftCount = useCounter(kpis.theftTps);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [full,  setFull ] = useState(false);
  const [panel, setPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanel(false);
    };
    if (panel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panel]);

  const toggleFull = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }, []);

  const setSetting = (key: keyof AppSettings) =>
    onSettings({ ...settings, [key]: !settings[key] });

  const groups: NavGroup[] = [
    {
      title: t('nav.section.operations'),
      items: [
        { id: 'monitor',  label: t('nav.monitor'),  icon: I.monitor },
        { id: 'events',   label: t('nav.events'),   icon: I.events, badge: alarmCount > 0 ? alarmCount : undefined },
        { id: 'losses',   label: t('nav.losses'),   icon: I.losses, badge: theftCount > 0 ? theftCount : undefined },
      ],
    },
    {
      title: t('nav.section.analytics'),
      items: [
        { id: 'readings', label: t('nav.readings'), icon: I.readings },
        { id: 'load',     label: t('nav.load'),     icon: I.load },
        { id: 'registry', label: t('nav.registry'), icon: I.registry },
      ],
    },
    {
      title: t('nav.section.system'),
      items: [
        { id: 'admin',    label: t('nav.admin'),    icon: I.admin },
      ],
    },
  ];

  const sys = SYS[kpis.systemStatus];
  const userInitial = (user?.full_name?.[0] ?? (demoMode ? 'D' : '?')).toUpperCase();
  const roleLabel = user
    ? (user.role === 'admin' ? 'Administrator' : user.role === 'dispatcher' ? 'Dispetcher' : 'TETK')
    : 'Demo';

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Brend */}
      <div className="s-brand">
        <div className="s-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div className="s-brand-text">
          <h1>JIZZAX HET</h1>
          <p>Situatsion markaz</p>
        </div>
        <button
          className="s-collapse"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? t('side.expand') : t('side.collapse')}
          aria-label={collapsed ? t('side.expand') : t('side.collapse')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points={collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}/>
          </svg>
        </button>
      </div>

      {/* Navigatsiya */}
      <nav className="s-nav">
        {groups.map(group => (
          <div className="s-group" key={group.title}>
            <div className="s-group-title">{group.title}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`s-item${view === item.id ? ' on' : ''}`}
                onClick={() => onChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="s-ico">{item.icon}</span>
                <span className="s-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span key={item.badge} className="s-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="s-spacer"/>

      {/* Tizim holati + soat */}
      <div className="s-status" title={`${t('topbar.systemStatus')}: ${sys.label}`}>
        <span className="s-status-pill" style={{ background: sys.color }}/>
        <div className="s-status-body">
          <div className="s-status-lbl">{t('topbar.systemStatus')}</div>
          <div className="s-status-val" style={{ color: sys.color }}>{sys.label}</div>
        </div>
        <span className={`s-livetag${demoMode ? ' demo' : ''}`}>
          <span className="s-livedot"/>{demoMode ? 'DEMO' : t('topbar.live')}
        </span>
      </div>
      <div className="s-clock">
        <span className="s-clock-t mono">{formatTime(now)}</span>
        <span className="s-clock-d">{formatDateUz(now)}</span>
      </div>

      {/* Boshqaruv tugmalari */}
      <div className="s-controls">
        <button
          className="s-ctrl"
          onClick={onToggleTheme}
          title={theme === 'dark' ? t('side.themeLight') : t('side.themeDark')}
          aria-label={theme === 'dark' ? t('side.themeLight') : t('side.themeDark')}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          <span className="s-ctrl-label">{theme === 'dark' ? t('side.themeLight') : t('side.themeDark')}</span>
        </button>

        <button
          className={`s-ctrl${soundOn ? ' on' : ''}`}
          onClick={onToggleSound}
          title={soundOn ? t('topbar.soundOn') : t('topbar.soundOff')}
          aria-label={soundOn ? t('topbar.soundOn') : t('topbar.soundOff')}
        >
          {soundOn ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
          <span className="s-ctrl-label">{soundOn ? t('topbar.soundOn') : t('topbar.soundOff')}</span>
        </button>

        <button
          className={`s-ctrl${full ? ' on' : ''}`}
          onClick={toggleFull}
          title={full ? t('topbar.exitFullscreen') : t('topbar.fullscreen')}
          aria-label={full ? t('topbar.exitFullscreen') : t('topbar.fullscreen')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          <span className="s-ctrl-label">{full ? t('topbar.exitFullscreen') : t('topbar.fullscreen')}</span>
        </button>

        <div className="s-ctrl-pop" ref={panelRef}>
          <button
            className={`s-ctrl${panel ? ' on' : ''}`}
            onClick={() => setPanel(v => !v)}
            title={t('side.settings')}
            aria-label={t('side.settings')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span className="s-ctrl-label">{t('side.settings')}</span>
          </button>
          {panel && (
            <div className="settings-panel">
              <div className="sp-title">Xarita sozlamalari</div>
              {([
                { key: 'showDistrictStats', label: 'Tuman statistikasi',       desc: 'Har tuman ustida TP va mavjudlik' },
                { key: 'showNotifications', label: 'Avariya bildirimlari',      desc: 'Yangi nosozlik — darhol ogohlantirish' },
                { key: 'autoFlyToAlarm',    label: "Xaritada avtomatik ko'rsatish", desc: 'Yangi avariyaga uchadi (faqat monitoringda)' },
              ] as { key: keyof AppSettings; label: string; desc: string }[]).map(item => (
                <label key={item.key} className="sp-row" onClick={() => setSetting(item.key)}>
                  <div className="sp-info">
                    <div className="sp-label">{item.label}</div>
                    <div className="sp-desc">{item.desc}</div>
                  </div>
                  <div className={`sp-toggle ${settings[item.key] ? 'on' : ''}`}><i/></div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Foydalanuvchi */}
      <div className="s-user">
        <span className={`s-ava${demoMode ? ' demo' : ''}`}>{userInitial}</span>
        <div className="s-user-body">
          <div className="s-user-name">{demoMode ? 'Demo rejim' : (user?.full_name ?? '—')}</div>
          <div className="s-user-role">{roleLabel}</div>
        </div>
        <button className="s-logout" onClick={onLogout} title="Chiqish" aria-label="Chiqish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
