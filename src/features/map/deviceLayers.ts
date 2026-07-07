import type maplibregl from 'maplibre-gl';
import type { Device } from '@/types';
import type { SitFocus } from './MapPanel';

// ============================================================
//  Qurilmalar — WebGL (canvas) qatlamlari.
//  DOM markerlar o'rniga: nuqtalar koordinataga matematik
//  qulflangan, zoom/pitch da hech qachon siljimaydi.
// ============================================================

export const DEV_SRC = 'devices';
const PR = 2; // pixelRatio — retina aniqligi

const STATUS_FILL: Record<string, string> = {
  online: '#22c97c',
  warning: '#f4c430',
  fault: '#ff8c2f',
  offline: '#ff4d57',
};
const DARK = '#070b13';
const WHITE = '#ffffff';

function canvasCtx(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d')!];
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const BOLT = new Path2D('M13 2 4 14h6l-1 8 9-12h-6l1-8z');

function drawTp(status: string): HTMLCanvasElement {
  const S = 27 * PR;
  const [c, ctx] = canvasCtx(S);
  rr(ctx, 0, 0, S, S, 9 * PR); ctx.fillStyle = DARK; ctx.fill();
  rr(ctx, 1.5 * PR, 1.5 * PR, S - 3 * PR, S - 3 * PR, 7.5 * PR); ctx.fillStyle = WHITE; ctx.fill();
  rr(ctx, 3.5 * PR, 3.5 * PR, S - 7 * PR, S - 7 * PR, 6 * PR); ctx.fillStyle = STATUS_FILL[status]; ctx.fill();
  const bs = (S - 7 * PR) / 24 * 0.92;
  ctx.save();
  ctx.translate(S / 2 - 12 * bs, S / 2 - 12 * bs);
  ctx.scale(bs, bs);
  ctx.fillStyle = DARK;
  ctx.fill(BOLT);
  ctx.restore();
  return c;
}

/** BZ-n — tadbirkorlik: romb ichida portfel glifi. */
function drawBiz(status: string): HTMLCanvasElement {
  const S = 23 * PR;
  const [c, ctx] = canvasCtx(S);
  const cx = S / 2, cy = S / 2;
  const dia = (r: number, color: string) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  dia(11.2 * PR, DARK);
  dia(9.6 * PR, WHITE);
  dia(8.0 * PR, STATUS_FILL[status]);
  // Portfel: tutqich + korpus + ochilish chizig'i
  ctx.strokeStyle = DARK; ctx.lineWidth = 1.3 * PR; ctx.lineJoin = 'round';
  ctx.strokeRect(cx - 1.7 * PR, cy - 4.4 * PR, 3.4 * PR, 2.2 * PR);
  ctx.fillStyle = DARK;
  rr(ctx, cx - 3.6 * PR, cy - 2.4 * PR, 7.2 * PR, 5.2 * PR, 1.1 * PR); ctx.fill();
  ctx.fillStyle = STATUS_FILL[status];
  ctx.fillRect(cx - 3.6 * PR, cy - 0.4 * PR, 7.2 * PR, 1.0 * PR);
  return c;
}

/** Uy silueti yo'li (tom + korpus); w — yarim kenglik. */
function housePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - w * 1.15);
  ctx.lineTo(cx + w, cy - w * 0.15);
  ctx.lineTo(cx + w, cy + w * 1.05);
  ctx.lineTo(cx - w, cy + w * 1.05);
  ctx.lineTo(cx - w, cy - w * 0.15);
  ctx.closePath();
}

/** M-n — maishiy: uy (dom) silueti, eshik bilan. */
function drawHouse(status: string): HTMLCanvasElement {
  const S = 18 * PR;
  const [c, ctx] = canvasCtx(S);
  const cx = S / 2, cy = S / 2 + 0.4 * PR;
  housePath(ctx, cx, cy, 7.2 * PR); ctx.fillStyle = DARK;  ctx.fill();
  housePath(ctx, cx, cy, 6.1 * PR); ctx.fillStyle = WHITE; ctx.fill();
  housePath(ctx, cx, cy, 4.9 * PR); ctx.fillStyle = STATUS_FILL[status]; ctx.fill();
  // Eshik
  ctx.fillStyle = DARK;
  ctx.fillRect(cx - 1.2 * PR, cy + 1.75 * PR, 2.4 * PR, 3.4 * PR);
  return c;
}

function drawBat(): HTMLCanvasElement {
  const S = 14 * PR;
  const [c, ctx] = canvasCtx(S);
  rr(ctx, 0, 0, S, S, 4 * PR); ctx.fillStyle = DARK; ctx.fill();
  rr(ctx, 1.2 * PR, 1.2 * PR, S - 2.4 * PR, S - 2.4 * PR, 3 * PR); ctx.fillStyle = '#22d3ee'; ctx.fill();
  ctx.strokeStyle = '#06222b';
  ctx.lineWidth = 1.6 * PR;
  ctx.lineCap = 'round';
  ctx.strokeRect(3.2 * PR, 4.6 * PR, 6.4 * PR, 4.8 * PR);
  ctx.beginPath(); ctx.moveTo(10.6 * PR, 6 * PR); ctx.lineTo(10.6 * PR, 8 * PR); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5 * PR, 5.8 * PR); ctx.lineTo(6.6 * PR, 8.2 * PR); ctx.moveTo(6.6 * PR, 5.8 * PR); ctx.lineTo(5 * PR, 8.2 * PR); ctx.stroke();
  return c;
}

function drawTheft(): HTMLCanvasElement {
  const S = 14 * PR;
  const [c, ctx] = canvasCtx(S);
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); ctx.fillStyle = DARK; ctx.fill();
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 1.2 * PR, 0, Math.PI * 2); ctx.fillStyle = '#b06bff'; ctx.fill();
  ctx.strokeStyle = '#1d0533';
  ctx.lineWidth = 1.7 * PR;
  ctx.lineCap = 'round';
  // qalqon
  ctx.beginPath();
  ctx.moveTo(S / 2, 3 * PR);
  ctx.lineTo(4 * PR, 4.8 * PR);
  ctx.lineTo(4 * PR, 7.4 * PR);
  ctx.quadraticCurveTo(4 * PR, 10 * PR, S / 2, 11 * PR);
  ctx.quadraticCurveTo(10 * PR, 10 * PR, 10 * PR, 7.4 * PR);
  ctx.lineTo(10 * PR, 4.8 * PR);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4.4 * PR, 5 * PR); ctx.lineTo(9.6 * PR, 9.4 * PR); ctx.stroke();
  return c;
}

/** Barcha qurilma tasvirlarini xaritaga ro'yxatdan o'tkazadi. */
export function registerDeviceImages(map: maplibregl.Map): void {
  const add = (name: string, cnv: HTMLCanvasElement) => {
    if (map.hasImage(name)) return;
    const ctx = cnv.getContext('2d')!;
    map.addImage(name, ctx.getImageData(0, 0, cnv.width, cnv.height), { pixelRatio: PR });
  };
  for (const s of ['online', 'warning', 'fault', 'offline']) {
    add(`tp-${s}`, drawTp(s));
    add(`biz-${s}`, drawBiz(s));
    add(`house-${s}`, drawHouse(s));
  }
  add('b-bat', drawBat());
  add('b-theft', drawTheft());
}

/** Qurilmalarni GeoJSON FC ga aylantiradi. */
export function devicesToFC(devices: Device[]) {
  return {
    type: 'FeatureCollection',
    features: devices.map((d) => {
      const over = (d.loadPercent ?? 0) >= 90 && d.status !== 'offline' ? 1 : 0;
      // Ko'rinadigan status: yuklama oshgan TM to'liq to'q sariq (orange) bo'ladi —
      // ikonaning o'zi ham sariq/yashil emas, balki orange. "Aralash status" bo'lmaydi.
      const vstatus = over ? 'fault' : d.status;
      return {
        type: 'Feature',
        properties: {
          id: d.id,
          type: d.type,
          status: d.status,
          vstatus,
          bat: d.onBattery && d.status !== 'offline' ? 1 : 0,
          theft: d.theft ? 1 : 0,
          over,
          alarm: d.status === 'offline' || d.status === 'fault' ? 1 : 0,
          label: d.type === 'business' ? (d.name.length > 20 ? d.name.slice(0, 19) + '…' : d.name) : d.id,
        },
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
      };
    }),
  };
}

const Z = (a: number, b: number) => ['interpolate', ['linear'], ['zoom'], 7, a, 13, b];
const statusColor = ['match', ['get', 'status'], 'online', STATUS_FILL.online, 'warning', STATUS_FILL.warning, 'fault', STATUS_FILL.fault, STATUS_FILL.offline];

/** Qurilma qatlamlarini qo'shadi (style.load da chaqiriladi). */
export function addDeviceLayers(map: maplibregl.Map, devices: Device[], householdZoom: number): void {
  if (map.getSource(DEV_SRC)) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.addSource(DEV_SRC, { type: 'geojson', data: devicesToFC(devices) as any });
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const A = (l: any) => map.addLayer(l);

  // Avariya pulsi (canvas, RAF bilan animatsiyalanadi)
  A({ id: 'dev-pulse', type: 'circle', source: DEV_SRC, filter: ['==', ['get', 'alarm'], 1], paint: { 'circle-color': statusColor as any, 'circle-opacity': 0.4, 'circle-radius': 18, 'circle-pitch-alignment': 'map' } });
  // Yuklanish halqasi — to'yingan orange tashqi doira
  A({ id: 'dev-over', type: 'circle', source: DEV_SRC, filter: ['all', ['==', ['get', 'over'], 1]], paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': STATUS_FILL.fault, 'circle-stroke-width': 2.8, 'circle-stroke-opacity': 1, 'circle-radius': 19, 'circle-pitch-alignment': 'map' } });
  // Fokus halqasi — tanlangan turkumdagi BARCHA TMlar bir xil rangda belgilanadi
  A({ id: 'dev-focus-ring', type: 'circle', source: DEV_SRC, filter: ['==', ['get', 'id'], '___'], paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#ff8c2f', 'circle-stroke-width': 3, 'circle-stroke-opacity': 0.95, 'circle-radius': Z(16, 25) as any, 'circle-pitch-alignment': 'map' } });
  // Tanlangan qurilma halqasi
  A({ id: 'dev-selected', type: 'circle', source: DEV_SRC, filter: ['==', ['get', 'id'], '___'], paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#2f80d8', 'circle-stroke-width': 2.6, 'circle-stroke-opacity': 0.95, 'circle-radius': Z(17, 26) as any } });
  // Maishiy (zoomdan keyin)
  A({ id: 'dev-house', type: 'symbol', source: DEV_SRC, minzoom: householdZoom, filter: ['==', ['get', 'type'], 'household'], layout: { 'icon-image': ['concat', 'house-', ['get', 'vstatus']], 'icon-size': Z(0.85, 1.15) as any, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  // Tadbirkorlik
  A({ id: 'dev-biz', type: 'symbol', source: DEV_SRC, filter: ['==', ['get', 'type'], 'business'], layout: { 'icon-image': ['concat', 'biz-', ['get', 'vstatus']], 'icon-size': Z(0.85, 1.2) as any, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  // TP konsentratorlar — ikona rangi vstatus bo'yicha (yuklama oshgan → orange)
  A({ id: 'dev-tp', type: 'symbol', source: DEV_SRC, filter: ['==', ['get', 'type'], 'concentrator'], layout: { 'icon-image': ['concat', 'tp-', ['get', 'vstatus']], 'icon-size': Z(0.82, 1.22) as any, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  // Badge'lar
  A({ id: 'dev-bat', type: 'symbol', source: DEV_SRC, filter: ['==', ['get', 'bat'], 1], layout: { 'icon-image': 'b-bat', 'icon-size': Z(0.85, 1.1) as any, 'icon-offset': [-13, -13], 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  A({ id: 'dev-theft', type: 'symbol', source: DEV_SRC, filter: ['==', ['get', 'theft'], 1], layout: { 'icon-image': 'b-theft', 'icon-size': Z(0.85, 1.1) as any, 'icon-offset': [13, 13], 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
  // Yorliqlar: TM IDsi — faqat yaqinlashganda ko'rinadi, to'qnashuvda ikonaga yon beradi
  A({ id: 'dev-label-tp', type: 'symbol', source: DEV_SRC, minzoom: 10.2, filter: ['==', ['get', 'type'], 'concentrator'], layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': Z(10, 12) as any, 'text-offset': [0, 1.55], 'text-anchor': 'top', 'text-letter-spacing': 0.04, 'text-optional': true, 'text-padding': 6 }, paint: { 'text-color': '#eaf6ff', 'text-halo-color': '#04141c', 'text-halo-width': 1.9 } });
  A({ id: 'dev-label-biz', type: 'symbol', source: DEV_SRC, minzoom: 11.5, filter: ['==', ['get', 'type'], 'business'], layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-offset': [0, 1.3], 'text-anchor': 'top' }, paint: { 'text-color': '#ffe9b8', 'text-halo-color': '#1a1206', 'text-halo-width': 1.6 } });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/** Yorug' uslubda yorliq ranglarini moslaydi. */
export function tuneLabelsForStyle(map: maplibregl.Map, light: boolean): void {
  if (!map.getLayer('dev-label-tp')) return;
  map.setPaintProperty('dev-label-tp', 'text-color', light ? '#0c2e52' : '#eaf6ff');
  map.setPaintProperty('dev-label-tp', 'text-halo-color', light ? '#ffffff' : '#04141c');
  map.setPaintProperty('dev-label-biz', 'text-color', light ? '#6b4400' : '#ffe9b8');
  map.setPaintProperty('dev-label-biz', 'text-halo-color', light ? '#ffffff' : '#1a1206');
}

/** Fokus rejimi: tegishli bo'lmaganlarni xiralashtirish (canvas opacity). */
export function applyDeviceFocus(map: maplibregl.Map, focus: SitFocus): void {
  if (!map.getLayer('dev-tp')) return;
  type Expr = number | unknown[];
  // Mos kelmaganlar butunlay yo'qoladi (0), faqat tanlangan turkum qoladi.
  const by = (cond: unknown[]): Expr => ['case', cond, 1, 0];
  let tp: Expr = 1, biz: Expr = 1, house: Expr = 1;
  if (focus === 'battery') { tp = by(['==', ['get', 'bat'], 1]); biz = 0; house = 0; }
  else if (focus === 'overload') { tp = by(['==', ['get', 'over'], 1]); biz = 0; house = 0; }
  else if (focus === 'theft') { tp = by(['==', ['get', 'theft'], 1]); biz = 0; house = 0; }
  else if (focus === 'offline') { tp = by(['==', ['get', 'status'], 'offline']); biz = 0; house = 0; }
  else if (focus === 'lines') { tp = 0.95; biz = 0.2; house = 0.05; }
  /* eslint-disable @typescript-eslint/no-explicit-any */
  map.setLayoutProperty('dev-tp', 'icon-allow-overlap', true);
  map.setPaintProperty('dev-tp', 'icon-opacity', tp as any);
  map.setPaintProperty('dev-label-tp', 'text-opacity', tp as any);
  map.setPaintProperty('dev-biz', 'icon-opacity', biz as any);
  map.setPaintProperty('dev-label-biz', 'text-opacity', biz as any);
  map.setPaintProperty('dev-house', 'icon-opacity', house as any);
  map.setPaintProperty('dev-bat', 'icon-opacity', focus === null || focus === 'battery' ? 1 : 0);
  map.setPaintProperty('dev-theft', 'icon-opacity', focus === null || focus === 'theft' ? 1 : 0);
  map.setPaintProperty('dev-over', 'circle-stroke-opacity', focus === null || focus === 'overload' ? 1 : 0);

  // Fokus halqasi — tanlangan turkumning BARCHA TMlarini bir xil rangda belgilaydi
  if (map.getLayer('dev-focus-ring')) {
    const FOCUS_COLOR: Record<string, string> = { battery: '#22d3ee', overload: '#ff8c2f', theft: '#b06bff', offline: '#ff4d57' };
    const preds: Record<string, unknown[]> = {
      battery:  ['==', ['get', 'bat'], 1],
      overload: ['==', ['get', 'over'], 1],
      theft:    ['==', ['get', 'theft'], 1],
      offline:  ['==', ['get', 'status'], 'offline'],
    };
    const active = focus && preds[focus] ? focus : null;
    map.setFilter('dev-focus-ring', (active ? preds[active] : ['==', ['get', 'id'], '___']) as any);
    map.setPaintProperty('dev-focus-ring', 'circle-stroke-color', active ? FOCUS_COLOR[active] : '#ff8c2f');
    map.setPaintProperty('dev-focus-ring', 'circle-stroke-opacity', active ? 0.95 : 0);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
