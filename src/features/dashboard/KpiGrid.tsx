import { StatCard } from '@/components/ui/StatCard';
import { formatNumber } from '@/lib/utils';
import { t } from '@/i18n';
import type { DashboardKpis } from '@/types';

export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="kpis">
      <StatCard value={formatNumber(kpis.totalNodes)} label={t('kpi.totalNodes')} />
      <StatCard value={formatNumber(kpis.online)} label={t('kpi.online')} accent="ok" valueColor="var(--ok)" />
      <StatCard value={formatNumber(kpis.activeAlarms)} label={t('kpi.activeAlarms')} accent="crit" valueColor="var(--crit)" />
      <StatCard value={formatNumber(kpis.affectedConsumers)} label={t('kpi.affected')} accent="fault" valueColor="var(--fault)" />
      <StatCard value={formatNumber(kpis.connectedConsumers)} label={t('kpi.connected')} valueColor="var(--accent)" span />
    </div>
  );
}
