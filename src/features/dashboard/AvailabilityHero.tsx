import { t } from '@/i18n';
import { formatNumber } from '@/lib/utils';
import type { DashboardKpis } from '@/types';

function availColor(a: number): string {
  if (a >= 98) return 'var(--ok)';
  if (a >= 92) return 'var(--warn)';
  return 'var(--crit)';
}

export function AvailabilityHero({ kpis }: { kpis: DashboardKpis }) {
  const a = kpis.availability;
  const color = availColor(a);
  return (
    <div className="hero">
      <div className="lbl">{t('kpi.availability')}</div>
      <div className="big mono" style={{ color }}>{a.toFixed(1)}%</div>
      <div className="sub">
        {formatNumber(kpis.online)} / {formatNumber(kpis.totalNodes)} {t('kpi.nodesOnline')}
      </div>
      <div className="bar">
        <i style={{ width: `${a}%`, background: color }} />
      </div>
    </div>
  );
}
