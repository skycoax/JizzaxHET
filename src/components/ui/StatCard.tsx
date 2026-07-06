import type { ReactNode } from 'react';

type Accent = 'accent' | 'ok' | 'crit' | 'fault';

/** Yagona KPI kartasi. */
export function StatCard({
  value,
  label,
  accent = 'accent',
  valueColor,
  span,
}: {
  value: ReactNode;
  label: string;
  accent?: Accent;
  valueColor?: string;
  span?: boolean;
}) {
  const cls =
    accent === 'ok' ? 'kpi c-ok' : accent === 'crit' ? 'kpi c-crit' : accent === 'fault' ? 'kpi c-fault' : 'kpi';
  return (
    <div className={cls} style={span ? { gridColumn: 'span 2' } : undefined}>
      <div className="n mono" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      <div className="k">{label}</div>
    </div>
  );
}
