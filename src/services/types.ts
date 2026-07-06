import type { DashboardSnapshot } from '@/types';

/**
 * Ma'lumot manbai bilan ishlash uchun yagona shartnoma (interfeys).
 * UI faqat shu interfeysga bog'liq — manba demo yoki haqiqiy bo'lishidan
 * qat'i nazar. Haqiqiy backend kelganda faqat shu interfeys amalga oshiriladi.
 */
export interface DataService {
  /** Joriy holatni bir marta olish. */
  getSnapshot(): Promise<DashboardSnapshot>;
  /** Jonli yangilanishlarga obuna. Obunani bekor qiluvchi funksiya qaytaradi. */
  subscribe(listener: (snapshot: DashboardSnapshot) => void): () => void;
}
