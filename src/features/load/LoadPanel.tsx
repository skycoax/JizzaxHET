import { useMemo, useState } from 'react';
import type { DashboardKpis, LoadPoint } from '@/types';
import { formatNumber } from '@/lib/utils';

// Tarif zonalari rangi (T1-T3 + T4)
const T_COLORS = {
  T1: { bg: '#0d2a4a', border: '#1a5fa0', label: 'T1  22:00-06:00' },
  T2: { bg: '#3a1a00', border: '#c47a00', label: 'T2  06:00-09:00, 17:00-22:00' },
  T3: { bg: '#0a2d1a', border: '#226640', label: 'T3  09:00-17:00' },
};

function tarif(h: number): 'T1' | 'T2' | 'T3' {
  if (h >= 22 || h < 6) return 'T1';
  if ((h >= 6 && h < 9) || (h >= 17 && h < 22)) return 'T2';
  return 'T3';
}

const W = 900, H = 280, PAD_L = 62, PAD_R = 16, PAD_T = 24, PAD_B = 36;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

export function LoadPanel({ loadProfile, kpis }: { loadProfile: LoadPoint[]; kpis: DashboardKpis }) {
  const [selDay, setSelDay] = useState(0); // 0=bugun

  const dayData = useMemo(() =>
    loadProfile.filter(p => p.dayOffset === selDay).sort((a, b) => a.hour - b.hour),
  [loadProfile, selDay]);

  const maxKw = useMemo(() => Math.max(...dayData.map(p => p.kw), 1), [dayData]);
  const minKw = useMemo(() => Math.min(...dayData.map(p => p.kw)), [dayData]);

  const x  = (h: number) => PAD_L + (h / 23) * CHART_W;
  const y  = (kw: number) => PAD_T + CHART_H - ((kw - minKw * 0.9) / (maxKw * 1.1 - minKw * 0.9)) * CHART_H;
  const pts= dayData.map(p => `${x(p.hour).toFixed(1)},${y(p.kw).toFixed(1)}`).join(' ');

  const days = ['Bugun', 'Kecha', '2 kun avval', '3 kun avval', '4 kun avval', '5 kun avval', '6 kun avval'];

  const peakPt  = dayData.reduce((a, b) => a.kw > b.kw ? a : b, dayData[0] || { kw: 0, hour: 0 });
  const troughPt= dayData.reduce((a, b) => a.kw < b.kw ? a : b, dayData[0] || { kw: 0, hour: 0 });
  const avgKw   = dayData.length ? Math.round(dayData.reduce((s,p) => s+p.kw, 0) / dayData.length) : 0;
  const dailyKwh= Math.round(avgKw * 24 / 1000);

  return (
    <div className="load-wrap">
      {/* KPI yuqori */}
      <div className="load-kpis">
        {[
          { l: "Tarmoq mavjudligi", v: kpis.availability.toFixed(1) + '%', c: kpis.availability >= 95 ? 'var(--ok)' : 'var(--warn)' },
          { l: "Cho'qqi yuklanish", v: formatNumber(Math.round(maxKw / 1000)) + ' MW', c: 'var(--fault)' },
          { l: "Minimal yuklanish", v: formatNumber(Math.round(minKw / 1000)) + ' MW', c: 'var(--accent)' },
          { l: "O'rtacha yuklanish", v: formatNumber(Math.round(avgKw / 1000)) + ' MW', c: 'var(--text)' },
          { l: "Kunlik iste'mol", v: formatNumber(dailyKwh) + ' MWh', c: 'var(--ok)' },
        ].map(k => (
          <div key={k.l} className="lk-card">
            <div className="lk-v mono" style={{ color: k.c }}>{k.v}</div>
            <div className="lk-l">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Kun tanlash */}
      <div className="load-daytabs">
        {days.map((d, i) => (
          <button key={i} className={`ldtab${selDay===i?' on':''}`} onClick={() => setSelDay(i)}>
            {d}
          </button>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="load-chart-wrap">
        <div className="load-chart-title">Yuklanish profili — {days[selDay].toLowerCase()}</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="load-svg" preserveAspectRatio="xMidYMid meet">
          {/* Tarif zona shriftlari */}
          {[...Array(24)].map((_, h) => {
            const t = tarif(h);
            const x0 = x(h);
            const x1 = h < 23 ? x(h + 1) : x(h) + CHART_W / 23;
            const col = T_COLORS[t];
            return (
              <rect key={h} x={x0} y={PAD_T} width={x1 - x0} height={CHART_H}
                fill={col.bg} opacity="0.55"/>
            );
          })}
          {/* Tarif chegaralari */}
          {[6, 9, 17, 22].map(h => (
            <line key={h} x1={x(h)} y1={PAD_T} x2={x(h)} y2={PAD_T + CHART_H}
              stroke="#334466" strokeWidth="1" strokeDasharray="3 3"/>
          ))}
          {/* Grid (yGorizontal) */}
          {[0, 25, 50, 75, 100].map(pct => {
            const kw = minKw * 0.9 + (maxKw * 1.1 - minKw * 0.9) * pct / 100;
            const yy = y(kw);
            return (
              <g key={pct}>
                <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="#1a2a44" strokeWidth="1"/>
                <text x={PAD_L - 6} y={yy + 4} textAnchor="end" fill="#64728c" fontSize="10">
                  {Math.round(kw / 1000)}
                </text>
              </g>
            );
          })}
          {/* Area fill */}
          {dayData.length > 1 && (
            <polygon
              points={`${x(dayData[0].hour)},${PAD_T + CHART_H} ${pts} ${x(dayData[dayData.length-1].hour)},${PAD_T + CHART_H}`}
              fill="url(#areaGrad)" opacity="0.45"/>
          )}
          {/* Gradient */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3da9fc" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#3da9fc" stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          {/* Line */}
          {dayData.length > 1 && (
            <polyline points={pts} fill="none" stroke="#3da9fc" strokeWidth="2" strokeLinejoin="round"/>
          )}
          {/* Cho'qqi markeri */}
          {peakPt && peakPt.kw > 0 && (
            <g>
              <circle cx={x(peakPt.hour)} cy={y(peakPt.kw)} r="5" fill="var(--fault)" stroke="#fff" strokeWidth="1.5"/>
              <text x={x(peakPt.hour)} y={y(peakPt.kw) - 10} textAnchor="middle" fill="var(--fault)" fontSize="10" fontWeight="bold">
                {(peakPt.kw / 1000).toFixed(1)} MW
              </text>
            </g>
          )}
          {/* X o'qi soatlari */}
          {[0,3,6,9,12,15,17,18,20,22,23].map(h => (
            <text key={h} x={x(h)} y={H - 6} textAnchor="middle" fill="#64728c" fontSize="10">
              {String(h).padStart(2,'0')}
            </text>
          ))}
          {/* Y o'qi nomi */}
          <text x={12} y={PAD_T + CHART_H/2} textAnchor="middle" fill="#64728c" fontSize="10"
            transform={`rotate(-90, 12, ${PAD_T + CHART_H/2})`}>
            MW
          </text>
        </svg>

        {/* Tarif legenda */}
        <div className="load-tarif-legend">
          {Object.entries(T_COLORS).map(([k, v]) => (
            <span key={k} className="tl-item" style={{ borderColor: v.border }}>
              <i style={{ background: v.border }}/>
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tarif jadval */}
      <div className="load-tarif-table">
        <div className="ltt-title">Tarif zonalari bo'yicha iste'mol</div>
        <table className="ltt">
          <thead>
            <tr><th>Tarif</th><th>Vaqt</th><th>Shart (kWh)</th><th>Ulush</th><th>Holat</th></tr>
          </thead>
          <tbody>
            {(['T1','T2','T3'] as const).map(t => {
              const hrs = dayData.filter(p => tarif(p.hour) === t);
              const kwh = Math.round(hrs.reduce((s, p) => s + p.kw, 0) / 1000);
              const pct = dayData.length ? Math.round(kwh / dailyKwh * 100) : 0;
              return (
                <tr key={t}>
                  <td><span className="tarif-badge" style={{ borderColor: T_COLORS[t].border }}>{t}</span></td>
                  <td>{T_COLORS[t].label.replace(t + '  ', '')}</td>
                  <td className="mono">{formatNumber(kwh)}</td>
                  <td>
                    <div className="pct-bar">
                      <i style={{ width: pct + '%', background: T_COLORS[t].border }}/>
                      <span className="mono">{pct}%</span>
                    </div>
                  </td>
                  <td><span className="tarif-st ok">Normal</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
