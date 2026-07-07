import { useEffect, useState } from 'react';
import { useDataService } from '@/context/DataServiceContext';
import type { DashboardSnapshot } from '@/types';

// Oxirgi snapshot keshi — backend uzilganda "oxirgi holat" ko'rsatiladi.
const CACHE_KEY = 'jhet-last-snapshot';
const SAVE_EVERY_MS = 30_000;

function readCache(): DashboardSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as DashboardSnapshot;
    if (!snap || !Array.isArray(snap.devices) || !Array.isArray(snap.districts)) return null;
    return snap;
  } catch {
    return null;
  }
}

function writeCache(snap: DashboardSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    // Joy yetmasa — eng og'ir qism (readings) siz saqlaymiz
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...snap, readings: {} })); } catch { /* ignore */ }
  }
}

export interface DashboardData {
  snapshot: DashboardSnapshot | null;
  /** true — jonli oqim hali kelmagan, kesh ko'rsatilyapti (OFLAYN). */
  fromCache: boolean;
}

export function useDashboardData(): DashboardData {
  const dataService = useDataService();
  const [state, setState] = useState<DashboardData>(() => {
    const cached = readCache();
    return { snapshot: cached, fromCache: cached !== null };
  });

  useEffect(() => {
    let lastSave = 0;
    return dataService.subscribe((snap) => {
      setState({ snapshot: snap, fromCache: false });
      const now = Date.now();
      if (now - lastSave >= SAVE_EVERY_MS) {
        lastSave = now;
        writeCache(snap);
      }
    });
  }, [dataService]);

  return state;
}
