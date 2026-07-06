import maplibregl from 'maplibre-gl';
import type { DistrictSummary } from '@/types';
import { getTetkCode, getTetkShort } from '@/lib/utils';

const SC: Record<string, string> = {
  online:'#22c97c', warning:'#f4c430', fault:'#ff8c2f', offline:'#ff4d57',
};
const HIDE_ZOOM = 10.8; // bu zoomdan yuqorida overlay yashirinadi

export class DistrictOverlayManager {
  private map: maplibregl.Map;
  private markers = new Map<string, maplibregl.Marker>();
  private onMap   = new Set<string>();

  constructor(map: maplibregl.Map) { this.map = map; }

  update(districts: DistrictSummary[], enabled: boolean): void {
    const show = enabled && this.map.getZoom() <= HIDE_ZOOM;
    for (const d of districts) {
      const m = this.markers.get(d.name);
      if (!m) {
        const el = this.makeEl(d);
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([d.lng, d.lat]);
        this.markers.set(d.name, marker);
        if (show) { marker.addTo(this.map); this.onMap.add(d.name); }
      } else {
        this.refreshEl(m.getElement(), d);
        if (show && !this.onMap.has(d.name)) { m.addTo(this.map); this.onMap.add(d.name); }
        else if (!show && this.onMap.has(d.name)) { m.remove(); this.onMap.delete(d.name); }
      }
    }
  }

  onZoom(enabled: boolean): void {
    const show = enabled && this.map.getZoom() <= HIDE_ZOOM;
    this.markers.forEach((m, name) => {
      if (show && !this.onMap.has(name)) { m.addTo(this.map); this.onMap.add(name); }
      else if (!show && this.onMap.has(name)) { m.remove(); this.onMap.delete(name); }
    });
  }

  destroy(): void { this.markers.forEach(m => m.remove()); this.markers.clear(); this.onMap.clear(); }

  private makeEl(d: DistrictSummary): HTMLElement {
    const div = document.createElement('div');
    div.className = 'do-wrap';
    this.refreshEl(div, d);
    return div;
  }

  private refreshEl(el: HTMLElement, d: DistrictSummary): void {
    const c = SC[d.worstStatus] || '#22c97c';
    const code = getTetkCode(d.name);
    const short = getTetkShort(d.name);
    const alarm = d.alarms > 0
      ? `<div class="do-alarm">&#9889; ${d.alarms} avariya</div>` : '';
    el.innerHTML = `
      <div class="do-card" style="--c:${c}">
        <div class="do-code">${code}</div>
        <div class="do-name">${short}</div>
        <div class="do-row">
          <i class="do-dot" style="background:${c}"></i>
          <span class="do-tp">${d.online}<em>/${d.deviceCount}</em> TP</span>
          <span class="do-av">${d.availability}%</span>
        </div>
        ${alarm}
      </div>
      <div class="do-arrow" style="border-top-color:${c}"></div>`;
  }
}
