import type maplibregl from 'maplibre-gl';
import type { DistrictSummary } from '@/types';
import { STATUS_HEX } from './mapIcons';
import { DISTRICT_APP_PROP, DISTRICT_SHORT_PROP, JIZZAX_DISTRICTS } from './jizzaxDistricts';
import type { MapStyleKey } from './mapStyles';

const SRC = 'jz-districts';
const NEUTRAL = '#3a4a68';

/** Tuman rangi rejimi: holat / yo'qotish / mavjudlik. */
export type DistrictColorMode = 'status' | 'loss' | 'avail';

function lossColor(pct: number): string {
  if (pct < 10) return STATUS_HEX.online;
  if (pct < 15) return STATUS_HEX.warning;
  if (pct < 20) return STATUS_HEX.fault;
  return STATUS_HEX.offline;
}

function availColor(pct: number): string {
  if (pct >= 98) return STATUS_HEX.online;
  if (pct >= 95) return STATUS_HEX.warning;
  if (pct >= 90) return STATUS_HEX.fault;
  return STATUS_HEX.offline;
}

function fillExpr(
  districts: DistrictSummary[],
  mode: DistrictColorMode = 'status',
  lossBy?: Record<string, number>,
): unknown {
  const expr: unknown[] = ['match', ['get', DISTRICT_APP_PROP]];
  districts.forEach((d) => {
    const color =
      mode === 'loss'  ? (lossBy && d.name in lossBy ? lossColor(lossBy[d.name]) : NEUTRAL) :
      mode === 'avail' ? availColor(d.availability) :
      STATUS_HEX[d.worstStatus];
    expr.push(d.name, color);
  });
  expr.push(NEUTRAL);
  return expr;
}

/**
 * Tumanlar chegaralarini qo'shadi (fill + kontur + nom).
 * Raster base tayl ustiga qo'shiladi — vektor tayl kerak emas.
 */
export function addDistrictLayers(
  map: maplibregl.Map,
  style: MapStyleKey,
  districts: DistrictSummary[],
): void {
  if (map.getSource(SRC)) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.addSource(SRC, { type: 'geojson', data: JIZZAX_DISTRICTS as any });

  const isLight = style === 'light';
  const lineColor = isLight ? '#2255bb' : style === 'sat' ? '#ffe066' : '#27d3ee';
  const labelColor = isLight ? '#1a2c55' : style === 'sat' ? '#fffbe0' : '#bfeeff';
  const haloColor  = isLight ? '#ffffff' : '#04141c';

  // Fill — tuman holati rangi
  map.addLayer({
    id: 'district-fill',
    type: 'fill',
    source: SRC,
    paint: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'fill-color': fillExpr(districts) as any,
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.28, 10, 0.14, 13, 0.06],
    },
  });

  // Yaltiroq chegaralar (glow)
  map.addLayer({
    id: 'district-line-glow',
    type: 'line',
    source: SRC,
    paint: {
      'line-color': lineColor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 6, 3.5, 12, 7],
      'line-blur': 5,
      'line-opacity': isLight ? 0.2 : 0.45,
    },
  });

  // Aniq chiziq
  map.addLayer({
    id: 'district-line',
    type: 'line',
    source: SRC,
    paint: {
      'line-color': lineColor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.2, 12, 2.2],
      'line-opacity': 0.92,
    },
  });

  // Tuman nomlari — poligon markazlarida, uzoq/o'rta zoomda ko'rinadi
  const labelFC = {
    type: 'FeatureCollection',
    features: JIZZAX_DISTRICTS.features.map((f) => {
      const [minX, minY, maxX, maxY] = bboxOf(f);
      return {
        type: 'Feature',
        properties: { short: f.properties[DISTRICT_SHORT_PROP as 'short'] ?? f.properties.app },
        geometry: { type: 'Point', coordinates: [(minX + maxX) / 2, (minY + maxY) / 2] },
      };
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.addSource(`${SRC}-pts`, { type: 'geojson', data: labelFC as any });
  map.addLayer({
    id: 'district-label',
    type: 'symbol',
    source: `${SRC}-pts`,
    maxzoom: 12,
    layout: {
      'text-field': ['get', 'short'],
      'text-font': ['Noto Sans Bold'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10.5, 10, 13.5] as any,
      'text-letter-spacing': 0.08,
      'text-transform': 'uppercase',
      'text-padding': 4,
    },
    paint: {
      'text-color': labelColor,
      'text-halo-color': haloColor,
      'text-halo-width': 1.7,
      'text-opacity': 0.9,
    },
  });
}

/** Jonli yangilanish: tuman ranglarini rejimga qarab o'zgartiradi. */
export function updateDistrictColors(
  map: maplibregl.Map,
  districts: DistrictSummary[],
  mode: DistrictColorMode = 'status',
  lossBy?: Record<string, number>,
): void {
  if (!map.getLayer('district-fill')) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.setPaintProperty('district-fill', 'fill-color', fillExpr(districts, mode, lossBy) as any);
}

/** Yorug' uslubda label ranglarini moslaydi. */
export function tuneDistrictForStyle(map: maplibregl.Map, style: MapStyleKey): void {
  if (!map.getLayer('district-line')) return;
  const isLight = style === 'light';
  const isSat   = style === 'sat';
  const lineColor  = isLight ? '#2255bb' : isSat ? '#ffe066' : '#27d3ee';
  const labelColor = isLight ? '#1a2c55' : isSat ? '#fffbe0' : '#bfeeff';
  const haloColor  = isLight ? '#ffffff' : '#04141c';
  map.setPaintProperty('district-line-glow', 'line-color', lineColor);
  map.setPaintProperty('district-line', 'line-color', lineColor);
  if (map.getLayer('district-label')) {
    map.setPaintProperty('district-label', 'text-color', labelColor);
    map.setPaintProperty('district-label', 'text-halo-color', haloColor);
  }
}

/** Poligon bbox: [minLng, minLat, maxLng, maxLat]. */
function bboxOf(f: (typeof JIZZAX_DISTRICTS)['features'][number]): [number, number, number, number] {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  const walk = (c: unknown): void => {
    if (Array.isArray(c)) {
      if (typeof c[0] === 'number' && typeof c[1] === 'number') {
        const [x, y] = c as [number, number];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      } else { c.forEach(walk); }
    }
  };
  walk(f.geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

/** Tuman markazini qaytaradi (uchish uchun). */
export function districtCentroid(appName: string): [number, number] | null {
  const f = JIZZAX_DISTRICTS.features.find((x) => x.properties.app === appName);
  if (!f) return null;
  const [minX, minY, maxX, maxY] = bboxOf(f);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

/** Tuman chegara qutisi — fitBounds uchun. */
export function districtBounds(appName: string): [[number, number], [number, number]] | null {
  const f = JIZZAX_DISTRICTS.features.find((x) => x.properties.app === appName);
  if (!f) return null;
  const [minX, minY, maxX, maxY] = bboxOf(f);
  return [[minX, minY], [maxX, maxY]];
}
