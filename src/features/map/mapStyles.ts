import type { StyleSpecification } from 'maplibre-gl';

// ============================================================
//  XARITA USLUBLARI — CARTO + ESRI raster tayllar.
//  Vektor tayl kutubxonasiga (PMTiles) bog'liqlik yo'q.
//  Global ishonchli, API kalitsiz, barcha tarmoqlarda ishlaydi.
// ============================================================

export type MapStyleKey = 'cyber' | 'sat' | 'light';

// Harflar (gliflar) — faqat tuman nomlari uchun.
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

// Yorliqsiz (nolabels) bazaviy tayllar — OSM joy nomlari klasteri olib tashlanadi.
// Xaritada faqat o'zimizning tuman/TM yorliqlarimiz qoladi → matn toza va o'qiladi.
const CARTO_DARK  = ['https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', 'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', 'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'];
const CARTO_LIGHT = ['https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', 'https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', 'https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png'];
const ESRI_SAT    = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
const ESRI_HYBRID = ['https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'];

// Oflayn rejim: localStorage'da lokal tayl-server ko'rsatilgan bo'lsa,
// barcha uslublar shu manbadan oladi (izolyatsiyalangan tarmoq uchun).
const TILES_OVERRIDE_KEY = 'jhet-tiles-base';
function overrideTiles(): string[] | null {
  try {
    const v = localStorage.getItem(TILES_OVERRIDE_KEY)?.trim();
    if (!v) return null;
    const tpl = v.includes('{z}') ? v : v.replace(/\/+$/, '') + '/{z}/{x}/{y}.png';
    return [tpl];
  } catch {
    return null;
  }
}

function base(key: MapStyleKey): StyleSpecification {
  const bgColor = key === 'cyber' ? '#05070e' : key === 'light' ? '#eaeef3' : '#151520';

  const ov = overrideTiles();
  const srcBase = ov
    ? { tiles: ov, maxzoom: 19, attribution: 'Lokal tayl-server' }
    : key === 'sat'
    ? { tiles: ESRI_SAT,    maxzoom: 18, attribution: 'Tiles &copy; Esri' }
    : key === 'light'
    ? { tiles: CARTO_LIGHT, maxzoom: 19, attribution: '&copy; OpenStreetMap, &copy; CARTO' }
    : { tiles: CARTO_DARK,  maxzoom: 19, attribution: '&copy; OpenStreetMap, &copy; CARTO' };

  const layers: StyleSpecification['layers'] = [
    { id: 'bg',   type: 'background', paint: { 'background-color': bgColor } } as StyleSpecification['layers'][0],
    { id: 'base', type: 'raster',     source: 'base' }  as StyleSpecification['layers'][0],
  ];

  if (key === 'sat' && !ov) {
    // Sputnik rejimida yo'l/joy nomlari ustiga qo'shimcha o'tkazuvchan qatlam
    layers.push(
      { id: 'hybrid', type: 'raster', source: 'hybrid', paint: { 'raster-opacity': 0.6 } } as StyleSpecification['layers'][0],
    );
  }

  const sources: StyleSpecification['sources'] = {
    base: { type: 'raster', tiles: srcBase.tiles, tileSize: 256, maxzoom: srcBase.maxzoom, attribution: srcBase.attribution },
  } as StyleSpecification['sources'];

  if (key === 'sat' && !ov) {
    (sources as Record<string, unknown>).hybrid = {
      type: 'raster', tiles: ESRI_HYBRID, tileSize: 256, maxzoom: 18, attribution: 'Tiles &copy; Esri',
    };
  }

  return {
    version: 8,
    glyphs: GLYPHS,
    sources,
    layers,
  } as unknown as StyleSpecification;
}

export function getStyle(key: MapStyleKey): StyleSpecification {
  return base(key);
}
