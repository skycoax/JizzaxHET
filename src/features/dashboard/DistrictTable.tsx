import { STATUS_META, stripDistrict } from '@/lib/utils';
import { t } from '@/i18n';
import type { DistrictSummary } from '@/types';

function availColor(a: number): string {
  if (a >= 98) return 'var(--ok)';
  if (a >= 92) return 'var(--warn)';
  return 'var(--crit)';
}

export function DistrictTable({ districts }: { districts: DistrictSummary[] }) {
  const rows = [...districts].sort((a, b) => b.alarms - a.alarms || a.availability - b.availability);
  return (
    <div className="dtab">
      <div className="h">
        <div>{t('table.district')}</div>
        <div style={{ textAlign: 'center' }}>{t('table.tp')}</div>
        <div style={{ textAlign: 'center' }}>{t('table.alarms')}</div>
        <div style={{ textAlign: 'right' }}>{t('table.availability')}</div>
      </div>
      {rows.map((g) => (
        <div className="r" key={g.name}>
          <div className="name">
            <span className="d" style={{ background: STATUS_META[g.worstStatus].color }} />
            {stripDistrict(g.name)}
          </div>
          <div className="num">{g.deviceCount}</div>
          <div className="al" style={{ color: g.alarms > 0 ? 'var(--crit)' : 'var(--faint)' }}>
            {g.alarms > 0 ? g.alarms : '—'}
          </div>
          <div className="av">
            <div className="pct">{g.availability}%</div>
            <div className="b">
              <i style={{ width: `${g.availability}%`, background: availColor(g.availability) }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
