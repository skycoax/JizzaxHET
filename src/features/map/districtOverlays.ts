import maplibregl from 'maplibre-gl';
import type { DistrictSummary } from '@/types';
import { getTetkCode, getTetkShort } from '@/lib/utils';

const SC: Record<string, string> = {
  online:'#22c97c', warning:'#f4c430', fault:'#ff8c2f', offline:'#ff4d57',
};
export const HIDE_ZOOM = 10.8; // bu zoomdan yuqorida overlay yashirinadi

/**
 * Tuman statistika kartalari. Endi ular DEFAULT holatda YOPIQ — xarita toza.
 * Foydalanuvchi tumanga bosganda faqat o'sha tuman kartasi ochiladi
 * (bir vaqtda bittasi), qayta bossa yoki bo'sh joyga bossa — yopiladi.
 */
export class DistrictOverlayManager {
  private map: maplibregl.Map;
  private markers  = new Map<string, maplibregl.Marker>();
  private onMap    = new Set<string>();
  private revealed = new Set<string>();   // hozir ochiq turgan tumanlar
  private enabled  = false;

  constructor(map: maplibregl.Map) { this.map = map; }

  /** Ma'lumot yangilanganda — markerlarni yaratish/yangilash (lekin ko'rsatmaslik). */
  update(districts: DistrictSummary[], enabled: boolean): void {
    this.enabled = enabled;
    for (const d of districts) {
      const m = this.markers.get(d.name);
      if (!m) {
        const el = this.makeEl(d);
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([d.lng, d.lat]);
        this.markers.set(d.name, marker);
      } else {
        this.refreshEl(m.getElement(), d);
        m.setLngLat([d.lng, d.lat]);
      }
    }
    if (!enabled) this.revealed.clear();
    this.sync();
  }

  /** Tumanga bosilganda — o'sha kartani ochish/yopish (bir vaqtda bittasi). */
  toggle(name: string): void {
    if (!this.enabled || !this.markers.has(name)) return;
    const wasOnlyOpen = this.revealed.has(name) && this.revealed.size === 1;
    this.revealed.clear();
    if (!wasOnlyOpen) this.revealed.add(name);
    this.sync();
  }

  /** Barcha ochiq kartalarni yopish (bo'sh joyga bosilganda). */
  clear(): void {
    if (this.revealed.size === 0) return;
    this.revealed.clear();
    this.sync();
  }

  onZoom(enabled?: boolean): void {
    if (enabled !== undefined) this.enabled = enabled;
    this.sync();
  }

  /** onMap holatini (enabled + zoom + revealed) bo'yicha tenglashtirish. */
  private sync(): void {
    const zoomOk = this.map.getZoom() <= HIDE_ZOOM;
    this.markers.forEach((m, name) => {
      const show = this.enabled && zoomOk && this.revealed.has(name);
      if (show && !this.onMap.has(name)) { m.addTo(this.map); this.onMap.add(name); }
      else if (!show && this.onMap.has(name)) { m.remove(); this.onMap.delete(name); }
    });
  }

  destroy(): void { this.markers.forEach(m => m.remove()); this.markers.clear(); this.onMap.clear(); this.revealed.clear(); }

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
          <span class="do-tp">${d.online}<em>/${d.deviceCount}</em> TM</span>
          <span class="do-av">${d.availability}%</span>
        </div>
        ${alarm}
      </div>
      <div class="do-arrow" style="border-top-color:${c}"></div>`;
  }
}
