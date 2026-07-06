import { useCallback, useEffect, useState } from 'react';

/** Ilovadagi barcha ko'rinishlar (bir sahifali sayt, lekin har biri o'z URL'iga ega). */
export type AppView =
  'monitor' | 'readings' | 'events' | 'load' |
  'losses'  | 'registry' | 'admin';

/** Ko'rinish → URL bo'lagi. URL'lar toza va o'qiladigan bo'lsin. */
const VIEW_TO_SLUG: Record<AppView, string> = {
  monitor:  'monitoring',
  readings: 'readings',
  events:   'events',
  load:     'load',
  losses:   'losses',
  registry: 'devices',
  admin:    'admin',
};

const SLUG_TO_VIEW: Record<string, AppView> = Object.fromEntries(
  Object.entries(VIEW_TO_SLUG).map(([v, s]) => [s, v as AppView]),
) as Record<string, AppView>;

const DEFAULT_VIEW: AppView = 'monitor';

function currentSlug(): string {
  // "#/monitoring" → "monitoring"
  return window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0].toLowerCase();
}

function slugToView(slug: string): AppView | null {
  return SLUG_TO_VIEW[slug] ?? null;
}

function hashFor(view: AppView): string {
  return `#/${VIEW_TO_SLUG[view]}`;
}

/**
 * Hash asosidagi yengil router. Har bir ko'rinish o'z URL'iga ega bo'ladi
 * (masalan `#/losses`), brauzer orqaga/oldinga tugmalari ishlaydi va sahifa
 * yangilanганda ham o'sha ko'rinish ochiladi — barchasi bitta HTML sahifada.
 */
export function useHashRoute(): [AppView, (v: AppView) => void] {
  const [view, setViewState] = useState<AppView>(() => slugToView(currentSlug()) ?? DEFAULT_VIEW);

  useEffect(() => {
    // Boshlang'ich URL noto'g'ri/bo'sh bo'lsa — joriy ko'rinishga moslaymiz
    // (orqaga tuzoq bo'lmasin uchun replaceState).
    if (!slugToView(currentSlug())) {
      window.history.replaceState(null, '', hashFor(view));
    }
    const onHashChange = () => {
      const v = slugToView(currentSlug());
      if (v) setViewState(v);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setView = useCallback((v: AppView) => {
    setViewState(v);
    if (currentSlug() !== VIEW_TO_SLUG[v]) {
      window.location.hash = hashFor(v);
    }
  }, []);

  return [view, setView];
}
