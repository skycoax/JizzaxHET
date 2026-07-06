import { useMemo, useState } from 'react';
import type { Device, DeviceStatus, DeviceType } from '@/types';
import { STATUS_META, TYPE_META, formatDuration, formatNumber, stripDistrict,
  TETK_MAP, getTetkCode } from '@/lib/utils';
import { analyzeFault } from '@/features/alarms/faultAnalysis';
import { StatusDot } from '@/components/ui/primitives';

type SortKey = 'id'|'name'|'district'|'status'|'metersOnline'|'voltage'|'responsibleName'|'lastUpdate';
type SortDir = 'asc'|'desc';

const SEV: Record<DeviceStatus,number> = { offline:0, fault:1, warning:2, online:3 };

function sorted(list: Device[], sk: SortKey, sd: SortDir): Device[] {
  return [...list].sort((a,b)=>{
    let c=0;
    if (sk==='status') c=SEV[a.status]-SEV[b.status];
    else if (sk==='metersOnline') c=a.metersOnline/a.metersTotal-b.metersOnline/b.metersTotal;
    else if (sk==='voltage') c=(parseFloat(a.voltage)||0)-(parseFloat(b.voltage)||0);
    else if (sk==='lastUpdate') c=a.lastUpdate-b.lastUpdate;
    else {
      const av=String((a as unknown as Record<string,unknown>)[sk]??'').toLowerCase();
      const bv=String((b as unknown as Record<string,unknown>)[sk]??'').toLowerCase();
      c=av<bv?-1:av>bv?1:0;
    }
    return sd==='asc'?c:-c;
  });
}

export function DeviceRegistry({ devices, onShowOnMap }: {
  devices: Device[]; onShowOnMap:(id:string)=>void;
}) {
  const [search,   setSearch  ] = useState('');
  const [typeF,    setTypeF   ] = useState<'all'|DeviceType>('all');
  const [selId,    setSelId   ] = useState<string|null>(null);
  const [sk,       setSk      ] = useState<SortKey>('status');
  const [sd,       setSd      ] = useState<SortDir>('asc');
  const [openTetk, setOpenTetk] = useState<Set<string>>(new Set(Object.keys(TETK_MAP)));

  // TETK bo'yicha guruhlanish
  const tetkGroups = useMemo(() => {
    const groups = new Map<string, Device[]>();
    for (const d of devices) {
      if (typeF !== 'all' && d.type !== typeF) continue;
      if (search) {
        const q = search.toLowerCase();
        if (!d.id.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q) && !d.responsibleName.toLowerCase().includes(q)) continue;
      }
      const arr = groups.get(d.district) ?? [];
      arr.push(d);
      groups.set(d.district, arr);
    }
    // sort bo'yicha
    groups.forEach((arr, key) => groups.set(key, sorted(arr, sk, sd)));
    // TETK kodi bo'yicha saralash
    return [...groups.entries()].sort((a,b) => {
      const ca = getTetkCode(a[0]), cb = getTetkCode(b[0]);
      return ca.localeCompare(cb);
    });
  }, [devices, typeF, search, sk, sd]);

  const totalFiltered = tetkGroups.reduce((s,[,arr])=>s+arr.length,0);
  const sel = selId ? devices.find(d=>d.id===selId)??null : null;

  const resort = (key: SortKey) => {
    if (sk===key) setSd(d=>d==='asc'?'desc':'asc');
    else { setSk(key); setSd('asc'); }
  };
  const ch = (key: SortKey) => sk===key?(sd==='asc'?' ↑':' ↓'):'';

  const toggleTetk = (district: string) =>
    setOpenTetk(prev => {
      const n = new Set(prev);
      n.has(district) ? n.delete(district) : n.add(district);
      return n;
    });

  const cnt = useMemo(()=>({
    tp:   devices.filter(d=>d.type==='concentrator').length,
    biz:  devices.filter(d=>d.type==='business').length,
    house:devices.filter(d=>d.type==='household').length,
  }),[devices]);

  return (
    <div className="registry">
      {/* Toolbar */}
      <div className="reg-toolbar">
        <div className="reg-top-row">
          <div className="reg-search-wrap">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input className="reg-search" placeholder="ID, nom yoki mas'ul..." value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button className="reg-clear" onClick={()=>setSearch('')}>&#x2715;</button>}
          </div>
          <div className="reg-count mono">{totalFiltered} / {devices.length} ta qurilma</div>
        </div>
        <div className="reg-filters">
          <div className="reg-fgroup">
            {(['all','concentrator','business','household'] as const).map(ty=>(
              <button key={ty} className={`rfilt${typeF===ty?' on':''}`} onClick={()=>setTypeF(ty)}>
                {ty==='all'?'Barcha tur':TYPE_META[ty].short}
                {ty!=='all'&&<b>{ty==='concentrator'?cnt.tp:ty==='business'?cnt.biz:cnt.house}</b>}
              </button>
            ))}
          </div>
          {/* Barchasini yoy/yig */}
          <button className="rfilt" style={{marginLeft:'auto'}} onClick={()=>setOpenTetk(new Set(tetkGroups.map(([d])=>d)))}>
            Barchasini yoy
          </button>
          <button className="rfilt" onClick={()=>setOpenTetk(new Set())}>
            Yig'
          </button>
        </div>
      </div>

      <div className="reg-body">
        {/* TETK daraxti + jadval */}
        <div className="reg-table-wrap">
          {/* Sarlavha */}
          <table className="reg-table">
            <thead>
              <tr>
                <th className="sc"><button onClick={()=>resort('status')}>Holat{ch('status')}</button></th>
                <th className="rid"><button onClick={()=>resort('id')}>ID{ch('id')}</button></th>
                <th><button onClick={()=>resort('name')}>Nomi{ch('name')}</button></th>
                <th>Turi</th>
                <th><button onClick={()=>resort('metersOnline')}>Hisoblagich{ch('metersOnline')}</button></th>
                <th><button onClick={()=>resort('voltage')}>Kuchlanish{ch('voltage')}</button></th>
                <th><button onClick={()=>resort('responsibleName')}>Mas'ul{ch('responsibleName')}</button></th>
              </tr>
            </thead>
            <tbody>
              {tetkGroups.map(([district, devs])=>{
                const code = getTetkCode(district);
                const tetkEntry = TETK_MAP[district];
                const alarms = devs.filter(d=>d.status==='offline'||d.status==='fault').length;
                const worst: DeviceStatus = devs.some(d=>d.status==='offline')?'offline':
                  devs.some(d=>d.status==='fault')?'fault':
                  devs.some(d=>d.status==='warning')?'warning':'online';
                const isOpen = openTetk.has(district);
                return [
                  // TETK sarlavhasi
                  <tr key={`hdr-${district}`} className="tetk-hdr" onClick={()=>toggleTetk(district)}>
                    <td colSpan={7}>
                      <div className="tetk-row">
                        <span className="tetk-arrow">{isOpen?'▾':'▸'}</span>
                        <span className="tetk-code mono">{code}</span>
                        <span className="tetk-name">{tetkEntry?.tetk ?? district}</span>
                        <span className="tetk-counts">
                          <StatusDot status={worst} size={8}/>
                          <span className="mono">{devs.filter(d=>d.status==='online').length}/{devs.length}</span>
                          {alarms>0 && <span className="tetk-alarm">{alarms} avariya</span>}
                        </span>
                      </div>
                    </td>
                  </tr>,
                  // Qurilmalar
                  ...(isOpen ? devs.map(d=>(
                    <tr key={d.id} className={`rrow${selId===d.id?' active':''}${d.status!=='online'?' is-alarm':''}`}
                      onClick={()=>setSelId(s=>s===d.id?null:d.id)}>
                      <td className="sc"><StatusDot status={d.status} size={9}/></td>
                      <td className="rid mono">{d.id}</td>
                      <td className="rname">{d.name}</td>
                      <td><span className={`type-tag tt-${d.type}`}>{TYPE_META[d.type].short}</span></td>
                      <td className="mono">{formatNumber(d.metersOnline)} / {formatNumber(d.metersTotal)}</td>
                      <td className="mono" style={{color:d.status!=='online'?STATUS_META[d.status].color:undefined}}>{d.voltage}</td>
                      <td className="rresp">{d.responsibleName}</td>
                    </tr>
                  )) : []),
                ];
              })}
            </tbody>
          </table>
          {totalFiltered===0 && (
            <div className="reg-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Topilmadi
            </div>
          )}
        </div>

        {sel && <DetailPanel device={sel} onClose={()=>setSelId(null)} onShowOnMap={()=>onShowOnMap(sel.id)}/>}
      </div>
    </div>
  );
}

function DetailPanel({ device, onClose, onShowOnMap }: {
  device:Device; onClose:()=>void; onShowOnMap:()=>void;
}) {
  const meta = STATUS_META[device.status];
  const tel  = device.responsiblePhone.replace(/\s/g,'');
  const analysis = device.status!=='online' ? analyzeFault(device) : null;
  const affected = Math.max(0, device.metersTotal-device.metersOnline);
  const code = getTetkCode(device.district);

  return (
    <div className="reg-detail">
      <div className="rd-head">
        <div className="rd-id">
          <span className="tetk-code mono" style={{fontSize:10}}>{code}</span> · {device.id}
        </div>
        <h3>{device.name}</h3>
        <div className="rd-meta">
          <span className="type-tag" style={{background:`color-mix(in srgb,${meta.color} 12%,transparent)`,color:meta.color}}>{meta.label}</span>
          {TYPE_META[device.type].label} · {TETK_MAP[device.district]?.tetk ?? device.district}
        </div>
        <button className="rd-close" onClick={onClose}>&#x2715;</button>
      </div>
      <div className="rd-body">
        <div className="rd-row"><span className="k">Hisoblagichlar</span><span className="v mono">{formatNumber(device.metersOnline)} / {formatNumber(device.metersTotal)}</span></div>
        <div className="rd-row"><span className="k">Kuchlanish</span><span className="v mono" style={{color:device.status!=='online'?meta.color:undefined}}>{device.voltage}</span></div>
        {typeof device.loadPercent==='number'&&device.status!=='offline'&&(
          <div className="rd-row"><span className="k">Yuklanish</span><span className="v mono" style={{color:device.loadPercent>=90?'var(--fault)':undefined}}>{device.loadPercent}%</span></div>
        )}
        {device.faultSince!==null&&(
          <div className="rd-row"><span className="k">Davomiyligi</span><span className="v" style={{color:meta.color}}>{formatDuration(device.faultSince)}</span></div>
        )}
        {affected>0&&(
          <div className="rd-row"><span className="k">Ta'sirlangan</span><span className="v mono" style={{color:'var(--fault)'}}>{formatNumber(affected)} iste'molchi</span></div>
        )}
        {analysis&&(
          <div className="rd-analysis">
            <div className="rd-analysis-head">Chuqur tahlil</div>
            <div className="rd-analysis-body">
              <div className="arow"><span className="k">Jiddiylik</span><span className="v" style={{color:meta.color}}>{analysis.levelLabel}</span></div>
              <div className="rd-block"><div className="bl">Ehtimoliy sabab</div><div className="bt">{analysis.cause}</div></div>
              <div className="rd-block action"><div className="bl">Tavsiya etilgan chora</div><div className="bt">{analysis.action}</div></div>
            </div>
          </div>
        )}
        <div className="rd-resp">
          <div className="rl">Mas'ul shaxs</div>
          <div className="rn">{device.responsibleName}</div>
          <a href={`tel:${tel}`}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {device.responsiblePhone}
          </a>
        </div>
      </div>
      <div className="rd-foot">
        <button className="btn-map" onClick={onShowOnMap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          Xaritada ko'rsatish
        </button>
      </div>
    </div>
  );
}
