import { useCallback, useEffect, useRef, useState } from 'react';
import { useClock } from '@/hooks/useClock';
import { formatDateUz, formatTime } from '@/lib/utils';
import { t } from '@/i18n';
import type { SystemStatus } from '@/types';
import type { AuthUser } from '@/hooks/useAuth';

const SYS: Record<SystemStatus, { label: string; color: string }> = {
  stable:   { label: 'BARQAROR',       color: 'var(--ok)' },
  warning:  { label: 'OGOHLANTIRISH',  color: 'var(--warn)' },
  critical: { label: 'DIQQAT',         color: 'var(--crit)' },
};

export interface AppSettings {
  showDistrictStats: boolean;
  showNotifications: boolean;
  autoFlyToAlarm: boolean;
}

export function TopBar({
  systemStatus, soundOn, onToggleSound,
  settings, onSettings,
  user, demoMode, onLogout,
}: {
  systemStatus: SystemStatus;
  soundOn: boolean;
  onToggleSound: () => void;
  settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  user: AuthUser | null;
  demoMode: boolean;
  onLogout: () => void;
}) {
  const now  = useClock();
  const [full,  setFull   ] = useState(false);
  const [panel, setPanel  ] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const set = (key: keyof AppSettings) =>
    onSettings({ ...settings, [key]: !settings[key] });

  const sys = SYS[systemStatus];

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
      </div>

      <div className="spacer"/>

      {/* To'liq ekran */}
      <button className={`tb-btn ${full?'on':''}`} onClick={toggleFull} title={full?t('topbar.exitFullscreen'):t('topbar.fullscreen')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
        <span>{full ? t('topbar.exitFullscreen') : t('topbar.fullscreen')}</span>
      </button>

      {/* Ovoz */}
      <button className={`tb-btn ${soundOn?'on':''}`} onClick={onToggleSound}>
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
        <span>{soundOn ? t('topbar.soundOn') : t('topbar.soundOff')}</span>
      </button>

      {/* Sozlamalar */}
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button className={`tb-btn ${panel?'on':''}`} onClick={() => setPanel(v => !v)} title="Sozlamalar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Sozlamalar</span>
        </button>
        {panel && (
          <div className="settings-panel">
            <div className="sp-title">Xarita sozlamalari</div>
            {([
              { key:'showDistrictStats',  label:"Tuman statistikasi (overlay)",  desc:"Har tuman ustida TP va mavjudlik" },
              { key:'showNotifications',  label:'Avariya bildirimlari',           desc:"Yangi nosozlik — darhol ogohlantirish" },
              { key:'autoFlyToAlarm',     label:'Xaritada avtomatik ko\'rsatish', desc:"Yangi avariyaga uchadi" },
            ] as { key: keyof AppSettings; label: string; desc: string }[]).map(item => (
              <label key={item.key} className="sp-row" onClick={() => set(item.key)}>
                <div className="sp-info">
                  <div className="sp-label">{item.label}</div>
                  <div className="sp-desc">{item.desc}</div>
                </div>
                <div className={`sp-toggle ${settings[item.key] ? 'on' : ''}`}>
                  <i/>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={`live ${demoMode ? 'demo' : ''}`}>
        <span className="dot"/>
        {demoMode ? 'DEMO' : t('topbar.live')}
      </div>

      <div className="sysstat">
        <span className="pill" style={{ background: sys.color }}/>
        <div>
          <div className="lbl">{t('topbar.systemStatus')}</div>
          <div className="val" style={{ color: sys.color }}>{sys.label}</div>
        </div>
      </div>

      {/* Foydalanuvchi + chiqish */}
      <div className="tb-user">
        {demoMode ? (
          <span className="tb-demo-badge">DEMO</span>
        ) : user ? (
          <>
            <span className="tb-uname">{user.full_name}</span>
            <span className="tb-urole">{user.role === 'admin' ? 'Admin' : user.role === 'dispatcher' ? 'Dispetcher' : 'TETK'}</span>
          </>
        ) : null}
        <button className="tb-logout" onClick={onLogout} title="Chiqish">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="clock">
        <div className="t mono">{formatTime(now)}</div>
        <div className="d">{formatDateUz(now)}</div>
      </div>
    </header>
  );
}
