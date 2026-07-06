import { useEffect, useState } from 'react';
import { useDataService } from '@/context/DataServiceContext';
import type { DashboardSnapshot } from '@/types';

export function useDashboardData(): DashboardSnapshot | null {
  const dataService = useDataService();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  useEffect(() => dataService.subscribe(setSnapshot), [dataService]);
  return snapshot;
}
