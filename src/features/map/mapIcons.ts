import type { Device, DeviceStatus } from '@/types';

/** Vektor qatlamlar uchun hex ranglar. */
export const STATUS_HEX: Record<DeviceStatus, string> = {
  online: '#22c97c',
  warning: '#f4c430',
  fault: '#ff8c2f',
  offline: '#ff4d57',
};

const BOLT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>';
const BAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="10" x2="22" y2="14"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/></svg>';
const THEFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 3 3 8v5c0 5 4 8 9 9 5-1 9-4 9-9V8l-9-5z"/><line x1="8" y1="9" x2="16" y2="15"/></svg>';

/** Ichki .mk klassi — tur shakli + holat rangi + kategoriya bayroqlari. */
export function deviceMkClass(d: Device): string {
  const alarm = d.status === 'offline' || d.status === 'fault';
  const shape = d.type === 'concentrator' ? 'mk-tp' : d.type === 'business' ? 'mk-biz' : 'mk-house';
  let f = '';
  if (d.type === 'concentrator') {
    if (d.onBattery && d.status !== 'offline') f += ' f-battery';
    if ((d.loadPercent ?? 0) >= 90 && d.status !== 'offline') f += ' f-over';
    if (d.theft) f += ' f-theft';
  }
  return `mk ${shape} s-${d.status}${alarm ? ' pulse' : ''}${f}`;
}

/** Marker ichki tarkibi (shakl + badge'lar + yuklanish halqasi + yorliq). */
export function deviceMarkerInner(d: Device): string {
  const isTp = d.type === 'concentrator';
  const isBiz = d.type === 'business';
  const over = isTp && (d.loadPercent ?? 0) >= 90 && d.status !== 'offline';
  let html = `<div class="${deviceMkClass(d)}">${isTp ? BOLT : ''}${over ? '<i class="mk-ring"></i>' : ''}</div>`;
  if (isTp && d.onBattery && d.status !== 'offline') html += `<span class="mkb b-bat">${BAT}</span>`;
  if (isTp && d.theft) html += `<span class="mkb b-theft">${THEFT}</span>`;
  if (isTp) html += `<span class="mk-label">${d.id}</span>`;
  else if (isBiz) {
    const nm = d.name.length > 18 ? d.name.slice(0, 17) + '…' : d.name;
    html += `<span class="mk-label lb-biz">${nm}</span>`;
  }
  return html;
}

/** Qurilma markeri uchun DOM element (MapLibre Marker). */
export function deviceMarkerEl(d: Device): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'mk-wrap';
  wrap.innerHTML = deviceMarkerInner(d);
  return wrap;
}
