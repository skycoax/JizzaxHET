import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { DashboardKpis, Device, DistrictSummary } from '@/types';
import { STATUS_META, TYPE_META, formatDuration, formatNumber, stripDistrict } from '@/lib/utils';
import { getStyle, type MapStyleKey } from './mapStyles';
import { addDistrictLayers, tuneDistrictForStyle, updateDistrictColors } from './districtLayers';
import { addDeviceLayers, applyDeviceFocus, devicesToFC, DEV_SRC, registerDeviceImages, tuneLabelsForStyle } from './deviceLayers';
import { DistrictOverlayManager } from './districtOverlays';
import { playAlarmBeep } from '@/lib/sound';
import { useCounter } from '@/hooks/useCounter';
import { t } from '@/i18n';

const REGION_CENTER: [number, number] = [67.9, 40.2];
const REGION_ZOOM = 8;
const HOUSEHOLD_ZOOM = 10;
const PITCH_3D = 55;
const BEARING = -14;

export type SitFocus = null | 'battery' | 'overload' | 'offline' | 'theft';
const DEV_LAYERS = ['dev-tp', 'dev-biz', 'dev-house'] as const;

export function MapPanel({
  devices, districts, kpis, soundOn,
  selectedId, onSelect, active = true,
  showDistrictStats,
  onNewAlarm,
}: {
  devices: Device[]; districts: DistrictSummary[];
  kpis: DashboardKpis; soundOn: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  active?: boolean;
  showDistrictStats: boolean;
  onNewAlarm?: (device: Device) => void;
}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const rafRef        = useRef<number>(0);
  const overlayMgrRef = useRef<DistrictOverlayManager | null>(null);
  const selectRef     = useRef<(id: string | null) => void>(() => {});
  const devicesRef    = useRef<Device[]>(devices);
  const districtsRef  = useRef<DistrictSummary[]>(districts);
  const styleKeyRef   = useRef<MapStyleKey>('cyber');
  const is3DRef       = useRef(true);
  const focusRef      = useRef<SitFocus>(null);
  const selIdRef      = useRef<string | null>(null);
  const prevOffRef    = useRef<Set<string> | null>(null);
  const showStatsRef  = useRef(showDistrictStats);
  const onNewAlarmRef = useRef(onNewAlarm);

  const [styleKey, setStyleKey] = useState<MapStyleKey>('cyber');
  const [is3D,     setIs3D    ] = useState(true);
  const [focus,    setFocus   ] = useState<SitFocus>(null);

  selectRef.current    = onSelect;
  devicesRef.current   = devices;
  districtsRef.current = districts;
  styleKeyRef.current  = styleKey;
  is3DRef.current      = is3D;
  focusRef.current     = focus;
  selIdRef.current     = selectedId;
  showStatsRef.current = showDistrictStats;
  onNewAlarmRef.current= onNewAlarm;

  /* ================================================================
     Xaritani bir marta yaratish
     ================================================================ */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getStyle('cyber'),
      center: REGION_CENTER, zoom: REGION_ZOOM,
      pitch: PITCH_3D, bearing: BEARING,
      minZoom: 6, maxZoom: 19,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('style.load', () => {
      registerDeviceImages(map);
      addDistrictLayers(map, styleKeyRef.current, districtsRef.current);
      addDeviceLayers(map, devicesRef.current, HOUSEHOLD_ZOOM);
      (map.getSource(DEV_SRC) as maplibregl.GeoJSONSource | undefined)
        ?.setData(devicesToFC(devicesRef.current) as never);
      updateDistrictColors(map, districtsRef.current);
      tuneLabelsForStyle(map, styleKeyRef.current === 'light');
      tuneDistrictForStyle(map, styleKeyRef.current);
      if (map.getLayer('dev-selected'))
        map.setFilter('dev-selected', ['==', ['get', 'id'], selIdRef.current ?? '___']);
      applyDeviceFocus(map, focusRef.current);
      // Overlay menejerini qayta yaratish (style reset bo'lganda)
      if (!overlayMgrRef.current) {
        overlayMgrRef.current = new DistrictOverlayManager(map);
      }
      overlayMgrRef.current.update(districtsRef.current, showStatsRef.current);
    });

    map.on('click', (e) => {
      const dF = map.queryRenderedFeatures(e.point, { layers: DEV_LAYERS as unknown as string[] });
      if (dF.length > 0) {
        const id = dF[0].properties?.id as string | undefined;
        if (id) { selectRef.current(id); return; }
      }
      selectRef.current(null);
      if (map.getZoom() < HOUSEHOLD_ZOOM) {
        const rF = map.queryRenderedFeatures(e.point, { layers: ['district-fill'] });
        if (rF.length > 0) {
          const app = rF[0].properties?.app as string | undefined;
          if (app) {
            const g = districtsRef.current.find(d => d.name === app);
            if (g) map.flyTo({ center: [g.lng, g.lat], zoom: 10.8, duration: 800 });
          }
        }
      }
    });

    map.on('mousemove', (e) => {
      const f = map.queryRenderedFeatures(e.point, {
        layers: [...(DEV_LAYERS as unknown as string[]), 'district-fill'],
      });
      map.getCanvas().style.cursor = f.length > 0 ? 'pointer' : '';
    });

    map.on('zoom', () => {
      overlayMgrRef.current?.onZoom(showStatsRef.current);
    });

    const loop = (ts: number) => {
      if (map.isStyleLoaded() && map.getLayer('dev-pulse'))
        map.setPaintProperty('dev-pulse', 'circle-radius', 14 + 8 * Math.abs(Math.sin(ts / 600)));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      overlayMgrRef.current?.destroy();
      overlayMgrRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(getStyle(styleKey), { diff: false });
    // style.load da overlay menejer yo'q bo'lishi mumkin — qayta yaratiladi u yerda
  }, [styleKey]);

  useEffect(() => { mapRef.current?.easeTo({ pitch: is3D ? PITCH_3D : 0, duration: 600 }); }, [is3D]);
  useEffect(() => { if (active) requestAnimationFrame(() => mapRef.current?.resize()); }, [active]);

  /* -- Jonli ma'lumotlar yangilanishi -- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    (map.getSource(DEV_SRC) as maplibregl.GeoJSONSource | undefined)
      ?.setData(devicesToFC(devices) as never);
    updateDistrictColors(map, districts);

    // Yangi avariyalar
    const offNow = new Set(
      devices.filter(d => d.type === 'concentrator' && (d.status === 'offline' || d.status === 'fault'))
             .map(d => `${d.id}:${d.faultSince}`)
    );
    if (prevOffRef.current) {
      offNow.forEach(key => {
        if (!prevOffRef.current!.has(key)) {
          if (soundOn) playAlarmBeep();
          const deviceId = key.split(':')[0];
          const dev = devices.find(d => d.id === deviceId);
          if (dev) onNewAlarmRef.current?.(dev);
        }
      });
    }
    prevOffRef.current = offNow;

    // Overlay yangilanishi
    overlayMgrRef.current?.update(districts, showDistrictStats);
  }, [devices, districts, soundOn, showDistrictStats]);

  /* -- District overlay toggle -- */
  useEffect(() => {
    overlayMgrRef.current?.update(districtsRef.current, showDistrictStats);
  }, [showDistrictStats]);

  /* -- Tanlov halqasi + uchish -- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('dev-selected'))
      map.setFilter('dev-selected', ['==', ['get', 'id'], selectedId ?? '___']);
    if (!selectedId) return;
    const d = devicesRef.current.find(x => x.id === selectedId);
    if (d) map.flyTo({ center: [d.lng, d.lat], zoom: Math.max(map.getZoom(), 14), pitch: is3DRef.current ? PITCH_3D : map.getPitch(), duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    applyDeviceFocus(map, focus);
  }, [focus]);

  useEffect(() => {
    const fn = () => mapRef.current?.resize();
    document.addEventListener('fullscreenchange', fn);
    return () => document.removeEventListener('fullscreenchange', fn);
  }, []);

  const toggleFocus = (f: SitFocus) => {
    const next = focus === f ? null : f;
    setFocus(next);
    const map = mapRef.current;
    if (!map) return;
    if (next === 'offline') {
      const off = devicesRef.current.filter(d => d.type === 'concentrator' && d.status === 'offline');
      if (off.length > 0) {
        const b = new maplibregl.LngLatBounds();
        off.forEach(d => b.extend([d.lng, d.lat]));
        map.fitBounds(b, { padding: 140, maxZoom: 11, duration: 900 });
      }
    } else if (next !== null) {
      map.flyTo({ center: REGION_CENTER, zoom: REGION_ZOOM, duration: 700 });
    }
  };

  const fitRegion = () =>
    mapRef.current?.flyTo({ center: REGION_CENTER, zoom: REGION_ZOOM, pitch: is3D ? PITCH_3D : 0, bearing: BEARING, duration: 900 });

  const selected      = selectedId ? (devices.find(d => d.id === selectedId) ?? null) : null;
  const offlineTpList = devices.filter(d => d.type === 'concentrator' && d.status === 'offline');

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map-root" />
      <SituationHud kpis={kpis} focus={focus} onToggle={toggleFocus} offlineList={offlineTpList} onPick={onSelect}/>
      <div className="map-ctrl tr">
        <div className="map-seg">
          <button className={styleKey==='cyber' ?'on':''} onClick={() => setStyleKey('cyber')}>Cyber 3D</button>
          <button className={styleKey==='sat'   ?'on':''} onClick={() => setStyleKey('sat')}>Sun'iy yo'ldosh</button>
          <button className={styleKey==='light' ?'on':''} onClick={() => setStyleKey('light')}>Yorug'</button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className={`map-btn ${is3D?'on':''}`} onClick={() => setIs3D(v => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            3D
          </button>
          <button className="map-btn" onClick={fitRegion}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
            Viloyat
          </button>
        </div>
      </div>
      <div className="map-legend">
        <div className="lt">Holatlar</div>
        <div className="li"><i style={{background:'var(--ok)'}}/> Ishlayapti</div>
        <div className="li"><i style={{background:'var(--warn)'}}/> Ogohlantirish</div>
        <div className="li"><i style={{background:'var(--fault)'}}/> Nosozlik</div>
        <div className="li"><i style={{background:'var(--crit)'}}/> Aloqa yo'q</div>
        <div className="lt" style={{marginTop:10}}>Qurilma turi</div>
        <div className="li"><span className="lg-tp"/> TP konsentrator</div>
        <div className="li"><span className="lg-biz"/> Tadbirkorlik</div>
        <div className="li"><span className="lg-house"/> Maishiy (fuqaro)</div>
        <div className="lt" style={{marginTop:10}}>Belgilar</div>
        <div className="li"><span className="lg-bat"/> Batareya quvvatida</div>
        <div className="li"><span className="lg-theft"/> O'g'irlik aniqlangan</div>
        <div className="li"><span className="lg-ring"/> Yuklanish ≥ 90%</div>
      </div>
      {selected && <DeviceDetailCard device={selected} onClose={() => onSelect(null)}/>}
    </div>
  );
}

/* ======================================================== */
function SituationHud({ kpis, focus, onToggle, offlineList, onPick }: {
  kpis: DashboardKpis; focus: SitFocus; onToggle:(f:SitFocus)=>void;
  offlineList: Device[]; onPick:(id:string)=>void;
}) {
  const batteryCount  = useCounter(kpis.batteryTps);
  const overloadCount = useCounter(kpis.overloadedTps);
  const offlineCount  = useCounter(kpis.offlineTps);
  const theftCount    = useCounter(kpis.theftTps);

  type Card = { f:Exclude<SitFocus,null>; c:string; n:number; sub?:string; label:string; icon:JSX.Element };
  const cards: Card[] = [
    { f:'battery', c:'#22d3ee', n:batteryCount, label:t('sit.battery'),
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="10" x2="22" y2="14"/><line x1="6" y1="10" x2="9" y2="14"/><line x1="9" y1="10" x2="6" y2="14"/></svg> },
    { f:'overload', c:'#ff8c2f', n:overloadCount, label:t('sit.overload'),
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a9 9 0 0 1 9 9"/><path d="M21 12a9 9 0 1 1-9-9" opacity=".35"/><path d="m12 12 4-5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg> },
    { f:'offline', c:'#ff4d57', n:offlineCount, sub:t('sit.locations'), label:t('sit.offline'),
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg> },
    { f:'theft', c:'#b06bff', n:theftCount, label:t('sit.theft'),
      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 3.5 7.5v5c0 4.6 3.6 7.6 8.5 8.5 4.9-.9 8.5-3.9 8.5-8.5v-5L12 3z"/><line x1="8" y1="9" x2="16" y2="15"/></svg> },
  ];
  return (
    <div className="sit-hud">
      <div className="sit-title">{t('sit.title')}</div>
      {cards.map(card => (
        <div key={card.f}>
          <button className={`sit-card ${focus===card.f?'on':''}`} style={{'--c':card.c} as React.CSSProperties} onClick={() => onToggle(card.f)}>
            <span className="ic">{card.icon}</span>
            <span className="nm">
              <span className="n mono"><span key={card.n} className="pop">{card.n}</span>{card.sub && <em>{card.sub}</em>}</span>
              <span className="l">{card.label}</span>
            </span>
          </button>
          {card.f==='offline' && focus==='offline' && offlineList.length>0 && (
            <div className="sit-sub">
              {offlineList.map(d => (
                <div key={d.id} className="row" onClick={() => onPick(d.id)}>
                  <span className="nm2"><i/> {d.id} · {d.name}</span>
                  <span className="ds">{stripDistrict(d.district)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import React from 'react';

function DeviceDetailCard({ device, onClose }: { device:Device; onClose:()=>void }) {
  const meta = STATUS_META[device.status];
  const tel  = device.responsiblePhone.replace(/\s/g,'');
  const load = device.loadPercent;
  return (
    <div className="map-detail">
      <div className="dh">
        <div>
          <div className="id">{device.id}</div>
          <h4>{device.name}</h4>
          <div className="ty">{TYPE_META[device.type].label} · {stripDistrict(device.district)}</div>
        </div>
        <button className="x" onClick={onClose} aria-label="Yopish">&#x2715;</button>
      </div>
      <div className="db">
        <div className="row"><span className="k">Holat</span><span className="v" style={{color:meta.color}}>{meta.label}</span></div>
        {device.type==='concentrator' && (
          <div className="row"><span className="k">Hisoblagichlar</span><span className="v mono">{formatNumber(device.metersOnline)} / {formatNumber(device.metersTotal)}</span></div>
        )}
        {typeof load==='number' && device.status!=='offline' && (
          <div className="row"><span className="k">Yuklanish</span><span className="v mono" style={{color:load>=90?'var(--fault)':undefined}}>{load}%</span></div>
        )}
        <div className="row"><span className="k">Kuchlanish</span><span className="v mono">{device.voltage}</span></div>
        {device.onBattery && device.status!=='offline' && (
          <div className="row"><span className="k">Quvvat manbai</span><span className="v" style={{color:'#22d3ee'}}>Batareya (zaxira)</span></div>
        )}
        {device.theft && (
          <div className="row"><span className="k">O'g'irlik</span><span className="v" style={{color:'#b06bff'}}>Aniqlangan</span></div>
        )}
        {device.faultSince!==null && (
          <div className="row"><span className="k">Davomiyligi</span><span className="v" style={{color:meta.color}}>{formatDuration(device.faultSince)}</span></div>
        )}
        <div className="resp">
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
    </div>
  );
}
