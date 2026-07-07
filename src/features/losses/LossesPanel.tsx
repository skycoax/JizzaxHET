import { useMemo, useState } from 'react';
import type { Device } from '@/types';
import { TETK_MAP, getTetkCode, formatNumber } from '@/lib/utils';

type Filter = 'all' | 'elevated' | 'suspicious' | 'theft';

function lossLevel(d: Device): 'normal'|'elevated'|'suspicious'|'theft' {
  const p = d.lossPercent ?? 0;
  if (d.theft || p > 25) return 'theft';
  if (p > 15)            return 'suspicious';
  if (p > 8 || d.lossElevated) return 'elevated';
  return 'normal';
}

const LEVEL_META = {
  theft:      { label: "O'g'irlik",    color: '#b06bff', bg: 'rgba(176,107,255,.1)' },
  suspicious: { label: 'Shubhali',    color: '#ff4d57', bg: 'rgba(255,77,87,.1)' },
  elevated:   { label: 'Ko\'tarilgan', color: '#ff8c2f', bg: 'rgba(255,140,47,.1)' },
  normal:     { label: 'Normal',       color: 'var(--ok)', bg: 'rgba(34,201,124,.08)' },
};

export function LossesPanel({ devices }: { devices: Device[] }) {
  const [filter,  setFilter ] = useState<Filter>('all');
  const [selId,   setSelId  ] = useState<string | null>(null);
  const [search,  setSearch ] = useState('');

  const tps = useMemo(() =>
    devices.filter(d => d.type === 'concentrator')
           .map(d => ({ ...d, level: lossLevel(d) }))
           .sort((a, b) => (b.lossPercent ?? 0) - (a.lossPercent ?? 0)),
  [devices]);

  const filtered = useMemo(() => {
    let list = tps;
    if (filter !== 'all')   list = list.filter(d => d.level === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.id.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
    }
    return list;
  }, [tps, filter, search]);

  // Statistika
  const stats = useMemo(() => ({
    theft:      tps.filter(d => d.level === 'theft').length,
    suspicious: tps.filter(d => d.level === 'suspicious').length,
    elevated:   tps.filter(d => d.level === 'elevated').length,
    normal:     tps.filter(d => d.level === 'normal').length,
    totalLoss:  Math.round(tps.reduce((s,d) => s + (d.lossPercent ?? 0), 0) / (tps.length || 1) * 10) / 10,
  }), [tps]);

  // Tuman bo'yicha agregat
  const byDistrict = useMemo(() => {
    const map = new Map<string, typeof tps>();
    for (const d of tps) {
      const arr = map.get(d.district) ?? [];
      arr.push(d);
      map.set(d.district, arr);
    }
    return [...map.entries()].map(([dist, devs]) => ({
      dist, code: getTetkCode(dist),
      total: devs.length,
      theft:      devs.filter(d => d.level === 'theft').length,
      suspicious: devs.filter(d => d.level === 'suspicious').length,
      avgLoss: Math.round(devs.reduce((s,d)=>s+(d.lossPercent??0),0)/devs.length*10)/10,
    })).sort((a,b) => b.avgLoss - a.avgLoss);
  }, [tps]);

  const sel = tps.find(d => d.id === selId) ?? null;

  return (
    <div className="loss-wrap">
      {/* Yuqori KPI */}
      <div className="loss-kpis">
        {[
          { l:"O'g'irlik", n:stats.theft,      c:'#b06bff', f:'theft'      },
          { l:'Shubhali',  n:stats.suspicious,  c:'#ff4d57', f:'suspicious' },
          { l:"Ko'tarilgan",n:stats.elevated,   c:'#ff8c2f', f:'elevated'   },
          { l:'Normal',    n:stats.normal,      c:'var(--ok)',f:'normal'     },
        ].map(k => (
          <button key={k.f}
            className={`lk-card loss-stat-btn${filter===k.f?' active':''}`}
            style={{'--c':k.c} as React.CSSProperties}
            onClick={()=>setFilter(filter===k.f?'all':k.f as Filter)}>
            <div className="lk-v mono" style={{color:k.c}}>{k.n}</div>
            <div className="lk-l">{k.l}</div>
          </button>
        ))}
        <div className="lk-card" style={{borderLeft:'3px solid var(--accent)'}}>
          <div className="lk-v mono" style={{color:'var(--accent)'}}>{stats.totalLoss}%</div>
          <div className="lk-l">O'rtacha yo'qotish</div>
        </div>
      </div>

      <div className="loss-body">
        {/* Chap: Tuman agregat */}
        <aside className="loss-dist">
          <div className="loss-dist-title">Tuman bo'yicha</div>
          {byDistrict.map(row => (
            <div key={row.dist} className="ld-row">
              <div className="ld-info">
                <span className="ld-code mono">{row.code}</span>
                <span className="ld-name">{row.dist.replace(' tumani','').replace(' shahri','')}</span>
              </div>
              <div className="ld-right">
                <span className="ld-avg mono" style={{
                  color: row.avgLoss>15?'#b06bff':row.avgLoss>8?'#ff8c2f':'var(--ok)'
                }}>{row.avgLoss}%</span>
                {row.theft>0 && <span className="ld-theft">{row.theft}</span>}
              </div>
            </div>
          ))}
        </aside>

        {/* O'ng: TP jadvali */}
        <div className="loss-main">
          <div className="loss-toolbar">
            <div className="lt-search">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="TM ID yoki nom..." className="lt-inp"/>
            </div>
            <span className="loss-count mono">{filtered.length} / {tps.length} ta TM</span>
          </div>

          <div className="loss-table-wrap">
            <table className="loss-table">
              <thead>
                <tr>
                  <th>TM ID</th>
                  <th>Nomi</th>
                  <th>Tuman</th>
                  <th>Hisoblagich</th>
                  <th>Yo'qotish %</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const meta = LEVEL_META[d.level];
                  const loss = d.lossPercent ?? 0;
                  return (
                    <tr key={d.id}
                      className={`loss-row${selId===d.id?' sel':''}`}
                      onClick={()=>setSelId(s=>s===d.id?null:d.id)}>
                      <td className="mono">{d.id}</td>
                      <td className="loss-name">{d.name}</td>
                      <td className="loss-dist-cell">{getTetkCode(d.district)}</td>
                      <td className="mono">{formatNumber(d.metersOnline)}/{formatNumber(d.metersTotal)}</td>
                      <td>
                        <div className="loss-bar-wrap">
                          <div className="loss-bar-bg">
                            <div className="loss-bar-fill" style={{
                              width: `${Math.min(loss, 40) / 40 * 100}%`,
                              background: meta.color,
                            }}/>
                          </div>
                          <span className="mono" style={{color:meta.color}}>{loss.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="loss-badge" style={{background:meta.bg, color:meta.color}}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tanlangan TP tafsiloti */}
          {sel && (
            <div className="loss-detail">
              <div className="ldet-head">
                <span className="ldet-id mono">{sel.id}</span>
                <span className="ldet-name">{sel.name}</span>
                <button onClick={()=>setSelId(null)}>&#x2715;</button>
              </div>
              <div className="ldet-body">
                <div className="ldet-row">
                  <span>Yo'qotish</span>
                  <b style={{color:LEVEL_META[sel.level].color}}>{(sel.lossPercent??0).toFixed(2)}%</b>
                </div>
                <div className="ldet-row">
                  <span>Hisoblagichlar</span>
                  <b>{formatNumber(sel.metersOnline)} / {formatNumber(sel.metersTotal)}</b>
                </div>
                <div className="ldet-row">
                  <span>Tuman</span>
                  <b>{TETK_MAP[sel.district]?.tetk ?? sel.district}</b>
                </div>
                <div className="ldet-row">
                  <span>Mas'ul</span>
                  <b>{sel.responsibleName}</b>
                </div>
                <div className="ldet-row">
                  <span>Telefon</span>
                  <a href={`tel:${sel.responsiblePhone.replace(/\s/g,'')}`}>{sel.responsiblePhone}</a>
                </div>
                {sel.level === 'theft' && (
                  <div className="ldet-alert">
                    Energiya yo'qotishi kritik darajada yuqori. IIB bilan
                    koordinatsiya tavsiya etiladi.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
