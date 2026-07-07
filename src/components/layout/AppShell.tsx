import { useState, useRef, useCallback, useEffect } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHashRoute } from '@/hooks/useHashRoute';
import { useTheme } from '@/hooks/useTheme';
import { Sidebar, type AppSettings } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { MapPanel } from '@/features/map/MapPanel';
import { DeviceRegistry } from '@/features/devices/DeviceRegistry';
import { ReadingsPanel } from '@/features/readings/ReadingsPanel';
import { EventsPanel } from '@/features/events/EventsPanel';
import { LoadPanel } from '@/features/load/LoadPanel';
import { AdminPanel } from '@/features/admin/AdminPanel';
import { LossesPanel } from '@/features/losses/LossesPanel';
import { AlarmToastContainer, deviceToNotification, type AlarmNotification } from '@/features/notifications/AlarmToast';
import { playAlarmBeep } from '@/lib/sound';
import { t } from '@/i18n';
import type { AuthUser } from '@/hooks/useAuth';
import type { BotConfig } from '@/types';
import { loadBotConfig } from '@/features/admin/personStore';
import type { Device } from '@/types';

function LoadingScreen() {
  return (
    <div className="loading">
      <div className="spinner"/>
      <div className="brand-mini">{t('app.title')}</div>
      <div>{t('loading')}</div>
    </div>
  );
}

const DEFAULT_SETTINGS: AppSettings = {
  showDistrictStats: true,
  showNotifications: true,
};

interface Props {
  user:     AuthUser | null;
  demoMode: boolean;
  onLogout: () => void;
}

export function AppShell({ user, demoMode, onLogout }: Props) {
  const { snapshot, fromCache } = useDashboardData();
  const [view, setView] = useHashRoute();
  const { theme, toggleTheme } = useTheme();
  const [soundOn,       setSoundOn      ] = useState(false);
  const [selectedId,    setSelectedId   ] = useState<string | null>(null);
  const [settings,      setSettings     ] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AlarmNotification[]>([]);
  const [paletteOpen,   setPaletteOpen  ] = useState(false);
  const [gotoDistrict,  setGotoDistrict ] = useState<{ name: string; ts: number } | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const showOnMap = useCallback((id: string) => {
    setView('monitor');
    setSelectedId(id);
  }, [setView]);

  const showDistrict = useCallback((name: string) => {
    setView('monitor');
    setGotoDistrict({ name, ts: Date.now() });
  }, [setView]);

  // Ctrl+K — buyruqlar palitrasi
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const sendToBotServer = useCallback(async (alarm: AlarmNotification) => {
    const cfg: BotConfig = loadBotConfig();
    if (!cfg.enabled || !cfg.serverUrl) return;
    try {
      await fetch(`${cfg.serverUrl}/alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alarm),
        signal: AbortSignal.timeout(3000),
      });
    } catch {}
  }, []);

  const handleNewAlarm = useCallback((device: Device) => {
    const key = `${device.id}:${device.faultSince}`;
    if (notifiedRef.current.has(key)) return;
    notifiedRef.current.add(key);
    const notif = deviceToNotification(device);
    if (settings.showNotifications) {
      setNotifications(prev => [notif, ...prev].slice(0, 8));
    }
    // Avariya popup'ini AVTOMATIK ochmaymiz — kartochka faqat foydalanuvchi
    // markerni bossa yoki ro'yxatdan tanlasa ochiladi. Bu yerda faqat tost/ovoz.
    if (soundOn) playAlarmBeep();
    sendToBotServer(notif);
  }, [settings, soundOn, sendToBotServer]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  if (!snapshot) return <LoadingScreen />;

  const { kpis, districts, devices, events, readings, loadProfile } = snapshot;

  return (
    <div className="app">
      <Sidebar
        view={view}
        onChange={setView}
        kpis={kpis}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(s => !s)}
        settings={settings}
        onSettings={setSettings}
        user={user}
        demoMode={demoMode}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        dataTs={snapshot.generatedAt}
        fromCache={fromCache}
      />

      <main className="app-main">
        {/* Monitoring xaritasi — ilova mavzusi bilan birga dark/light bo'ladi */}
        <div className={`vhost ${view === 'monitor' ? '' : 'hidden'}`}>
          <MapPanel
            devices={devices} districts={districts} kpis={kpis}
            events={events}
            soundOn={soundOn} selectedId={selectedId} onSelect={setSelectedId}
            active={view === 'monitor'}
            showDistrictStats={settings.showDistrictStats}
            onNewAlarm={handleNewAlarm}
            theme={theme}
            gotoDistrict={gotoDistrict}
          />
        </div>

        {view === 'readings'  && <div className="vhost"><ReadingsPanel devices={devices} readings={readings}/></div>}
        {view === 'events'    && <div className="vhost"><EventsPanel events={events} onSelectDevice={showOnMap}/></div>}
        {view === 'load'      && <div className="vhost"><LoadPanel loadProfile={loadProfile} kpis={kpis} theme={theme}/></div>}
        {view === 'losses'    && <div className="vhost"><LossesPanel devices={devices}/></div>}
        {view === 'registry'  && <div className="vhost"><DeviceRegistry devices={devices} onShowOnMap={showOnMap}/></div>}
        {view === 'admin'     && <div className="vhost"><AdminPanel/></div>}
      </main>

      {settings.showNotifications && (
        <AlarmToastContainer
          notifications={notifications}
          onDismiss={dismissNotification}
          onShow={showOnMap}
        />
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        devices={devices}
        districts={districts}
        currentView={view}
        onView={v => { setView(v); setPaletteOpen(false); }}
        onDevice={id => { showOnMap(id); setPaletteOpen(false); }}
        onDistrict={name => { showDistrict(name); setPaletteOpen(false); }}
      />
    </div>
  );
}
