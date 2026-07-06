import { useMemo, useState } from 'react';
import type { Device, MeterReading } from '@/types';
import { TYPE_META, formatNumber, stripDistrict, getTetk } from '@/lib/utils';

type PeriodMode = 'monthly' | 'daily';

function fmtNum(n: number): string {
  if (n === 0) return '0.000';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function RowClass(r: MeterReading): string {
  if (r.missing)   return 'rm-missing';
  if (r.anomaly)   return 'rm-anomaly';
  if (r.predicted) return 'rm-predicted';
  if (r.source === 'smart') return 'rm-smart';
  return '';
}

export function ReadingsPanel({
  devices,
  readings,
}: {
  devices: Device[];
  readings: Record<string, MeterReading[]>;
}) {
  const [search, setSearch]   = useState('');
  const [selId, setSelId]     = useState<string | null>(null);
  const [mode, setMode]       = useState<PeriodMode>('monthly');

  // Faqat TP va biznes qurilmalari (hisoblagichlari bor)
  const listed = useMemo(() =>
    devices
      .filter(d => d.type !== 'household')
      .filter(d => !search || d.id.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.district.localeCompare(b.district) || a.id.localeCompare(b.id)),
  [devices, search]);

  const selDevice = selId ? devices.find(d => d.id === selId) ?? null : null;
  const selReadings: MeterReading[] = selId ? (readings[selId] ?? []) : [];

  // Kunlik uchun oylik ma'lumotni sutkalarga bo'lamiz (demo: haqiqiy tizimda API'dan keladi)
  const rows = mode === 'monthly' ? selReadings : selReadings.slice(0, 1).flatMap(r =>
    Array.from({ length: 30 }, (_, i) => ({
      ...r,
      period: `${String(i+1).padStart(2,'0')}.${r.period.split('/')[0]}.${r.period.split('/')[1]}`,
      plusA:  Math.round(r.plusA / 30 * (0.8 + Math.random() * 0.4) * 10) / 10,
      plusR:  Math.round(r.plusR / 30 * (0.8 + Math.random() * 0.4) * 10) / 10,
      minusA: Math.round(r.minusA / 30 * 10) / 10,
      minusR: Math.round(r.minusR / 30 * 10) / 10,
      t1: Math.round(r.t1/30 * (0.8+Math.random()*0.4)*10)/10,
      t2: Math.round(r.t2/30 * (0.8+Math.random()*0.4)*10)/10,
      t3: Math.round(r.t3/30 * (0.8+Math.random()*0.4)*10)/10,
    }))
  );

  return (
    <div className="read-wrap">
      {/* Chap: qurilma tanlash */}
      <aside className="read-tree">
        <div className="rt-search">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input placeholder="ID yoki nom..." value={search} onChange={e => setSearch(e.target.value)} className="rt-input"/>
        </div>
        <div className="rt-list">
          {listed.map(d => (
            <div
              key={d.id}
              className={`rt-row ${selId === d.id ? 'on' : ''}`}
              onClick={() => setSelId(d.id)}
            >
              <span className={`rt-dot s-${d.status}`}/>
              <span className="rt-id mono">{d.id}</span>
              <span className="rt-name">{d.name}</span>
              <span className="rt-dist">{stripDistrict(d.district)}</span>
            </div>
          ))}
          {listed.length === 0 && <div className="rt-empty">Topilmadi</div>}
        </div>
      </aside>

      {/* O'ng: ko'rsatkichlar */}
      <div className="read-main">
        {!selDevice ? (
          <div className="read-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <div>Qurilmani tanlang</div>
            <div className="sub">Chap ro'yxatdan TP yoki biznes hisoblagichini tanlang</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="read-header">
              <div className="rh-left">
                <div className="rh-id">{selDevice.id}</div>
                <div className="rh-name">{selDevice.name}</div>
                <div className="rh-meta">
                  <span className={`type-tag tt-${selDevice.type}`}>{TYPE_META[selDevice.type].label}</span>
                  <span>{stripDistrict(selDevice.district)}</span>
                  <span>Mas'ul: {selDevice.responsibleName}</span>
                </div>
              </div>
              <div className="rh-right">
                {/* Period filter */}
                <div className="rh-modes">
                  <label className={mode==='monthly'?'on':''} onClick={() => setMode('monthly')}>
                    <input type="radio" checked={mode==='monthly'} readOnly/> Oylik
                  </label>
                  <label className={mode==='daily'?'on':''} onClick={() => setMode('daily')}>
                    <input type="radio" checked={mode==='daily'} readOnly/> Kunlik
                  </label>
                </div>
                {/* Legenda */}
                <div className="rh-legend">
                  <span className="lg-item predicted"><i/>Taxminiy</span>
                  <span className="lg-item anomaly"><i/>Anomal</span>
                  <span className="lg-item missing"><i/>Tushib qolgan</span>
                  <span className="lg-item smart"><i/>SmartApp</span>
                </div>
                <button className="rh-export" onClick={() => exportCSV(selDevice.id, rows)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Eksport
                </button>
              </div>
            </div>

            {/* Jadval */}
            <div className="read-table-wrap">
              <table className="read-table">
                <thead>
                  <tr>
                    <th className="fixed-col c-num">№</th>
                    <th className="fixed-col c-period">Oy / Sana</th>
                    <th className="fixed-col c-src">Manba</th>
                    <th>+A (kWh)<br/><em>00:00-24:00</em></th>
                    <th>-A (kWh)<br/><em>00:00-24:00</em></th>
                    <th>+R (kvarh)<br/><em>00:00-24:00</em></th>
                    <th>-R (kvarh)<br/><em>00:00-24:00</em></th>
                    <th>+A T1 (kWh)<br/><em>22:00-06:00</em></th>
                    <th>+A T2 (kWh)<br/><em>06:00-09:00<br/>17:00-22:00</em></th>
                    <th>+A T3 (kWh)<br/><em>09:00-17:00</em></th>
                    <th>+A T4 (kWh)</th>
                    <th>-A T1 (kWh)<br/><em>22:00-06:00</em></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.period} className={RowClass(row)}>
                      <td className="fixed-col c-num mono">{i + 1}</td>
                      <td className="fixed-col c-period">{row.period}</td>
                      <td className="fixed-col c-src">
                        {row.source === 'smart' ? (
                          <span className="src-smart">⬤ SmartApp</span>
                        ) : row.source === 'manual' ? (
                          <span className="src-manual">— manual</span>
                        ) : 'view.ami'}
                      </td>
                      <td className="mono">{fmtNum(row.plusA)}</td>
                      <td className="mono">{fmtNum(row.minusA)}</td>
                      <td className="mono">{fmtNum(row.plusR)}</td>
                      <td className="mono">{fmtNum(row.minusR)}</td>
                      <td className="mono">{fmtNum(row.t1)}</td>
                      <td className="mono">{fmtNum(row.t2)}</td>
                      <td className="mono">{fmtNum(row.t3)}</td>
                      <td className="mono">{fmtNum(row.t4)}</td>
                      <td className="mono">{fmtNum(row.minusA * 0.22)}</td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Jami</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.plusA,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.minusA,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.plusR,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.minusR,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.t1,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.t2,0))}</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.t3,0))}</td>
                      <td className="mono">0.000</td>
                      <td className="mono">{fmtNum(rows.reduce((s,r)=>s+r.minusA*0.22,0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pastki KPI */}
            <div className="read-footer">
              {[
                { l: 'Jami iste\'mol (+A)', v: formatNumber(Math.round(rows.reduce((s,r)=>s+r.plusA,0))), u:'kWh' },
                { l: 'Reaktiv (+R)', v: formatNumber(Math.round(rows.reduce((s,r)=>s+r.plusR,0))), u:'kvarh' },
                { l: 'Quvvat koeffitsienti', v: (rows.reduce((s,r)=>s+r.plusA,0) / (Math.sqrt(Math.pow(rows.reduce((s,r)=>s+r.plusA,0),2)+Math.pow(rows.reduce((s,r)=>s+r.plusR,0),2))||1)).toFixed(3), u:'' },
                { l: 'Hisoblagichlar', v: formatNumber(selDevice.metersTotal), u: 'ta' },
              ].map(k => (
                <div key={k.l} className="rf-kpi">
                  <div className="rf-v mono">{k.v} <em>{k.u}</em></div>
                  <div className="rf-l">{k.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function exportCSV(id: string, rows: MeterReading[]) {
  const hdr = 'Oy,Manba,+A(kWh),-A(kWh),+R(kvarh),-R(kvarh),T1,T2,T3,T4';
  const body = rows.map(r =>
    [r.period, r.source, r.plusA, r.minusA, r.plusR, r.minusR, r.t1, r.t2, r.t3, r.t4].join(',')
  ).join('\n');
  const blob = new Blob([hdr + '\n' + body], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${id}_readings.csv`;
  a.click();
}
