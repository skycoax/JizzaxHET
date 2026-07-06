import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/features/auth/LoginPage';
import { DataServiceCtx } from '@/context/DataServiceContext';
import { RealtimeDataService } from '@/services/RealtimeDataService';
import { mockDataService } from '@/services/mockDataService';
import { useAuth } from '@/hooks/useAuth';

export default function App() {
  const { token, user, backendUrl, demoMode, login, enterDemo, logout } = useAuth();

  // DataService: token bo'lsa → real backend, yo'q bo'lsa → mock
  const dataService = useMemo(() => {
    if (token && backendUrl) {
      return new RealtimeDataService(backendUrl, token);
    }
    return mockDataService;
  }, [token, backendUrl]);

  // Login yo'q va demo rejim ham emas → Login sahifa
  if (!token && !demoMode) {
    return (
      <LoginPage
        defaultUrl={backendUrl}
        onLogin={login}
        onDemo={enterDemo}
      />
    );
  }

  return (
    <DataServiceCtx.Provider value={dataService}>
      <AppShell
        user={user}
        demoMode={demoMode}
        onLogout={logout}
      />
    </DataServiceCtx.Provider>
  );
}
