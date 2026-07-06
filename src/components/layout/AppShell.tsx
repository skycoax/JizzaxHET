import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { TopBar } from '@/components/layout/TopBar';
import { NavStrip, type AppView } from '@/components/layout/NavStrip';
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
import type { AppSettings } from '@/components/layout/TopBar';
import type { BotConfig } from '@/types';
import { loadBotConfig } from '@/features/admin/personStore';
import type { Device } from '@/types';
import { useRef, useCallback } from 'react';

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
  autoFlyToAlarm:    true,
};

interface Props {
  user:     AuthUser | null;
  demoMode: boolean;
  onLogout: () => void;
}

export function AppShell({ user, demoMode, onLogout }: Props) {
  const snapshot = useDashboardData();
  const [view,          setView         ] = useState<AppView>('monitor');
  const [soundOn,       setSoundOn      ] = useState(false);
  const [selectedId,    setSelectedId   ] = useState<string | null>(null);
  const [settings,      setSettings     ] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AlarmNotification[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());

  const showOnMap = useCallback((id: string) => {
    setView('monitor');
    setSelectedId(id);
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
    if (settings.autoFlyToAlarm) { setView('monitor'); setSelectedId(device.id); }
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
      <TopBar
        systemStatus={kpis.systemStatus}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(s => !s)}
        settings={settings}
        onSettings={setSettings}
        user={user}
        demoMode={demoMode}
        onLogout={onLogout}
      />
      <NavStrip view={view} onChange={setView} kpis={kpis}/>

      <div className={`vhost ${view === 'monitor' ? '' : 'hidden'}`}>
        <MapPanel
          devices={devices} districts={districts} kpis={kpis}
          soundOn={soundOn} selectedId={selectedId} onSelect={setSelectedId}
          active={view === 'monitor'}
          showDistrictStats={settings.showDistrictStats}
          onNewAlarm={handleNewAlarm}
        />
      </div>

      {view === 'readings'  && <div className="vhost"><ReadingsPanel devices={devices} readings={readings}/></div>}
      {view === 'events'    && <div className="vhost"><EventsPanel events={events} onSelectDevice={showOnMap}/></div>}
      {view === 'load'      && <div className="vhost"><LoadPanel loadProfile={loadProfile} kpis={kpis}/></div>}
      {view === 'losses'    && <div className="vhost"><LossesPanel devices={devices}/></div>}
      {view === 'registry'  && <div className="vhost"><DeviceRegistry devices={devices} onShowOnMap={showOnMap}/></div>}
      {view === 'admin'     && <div className="vhost"><AdminPanel/></div>}

      {settings.showNotifications && (
        <AlarmToastContainer
          notifications={notifications}
          onDismiss={dismissNotification}
          onShow={showOnMap}
        />
      )}
    </div>
  );
}
