import type { Device } from '@/types';

export type FaultLevel = 'critical' | 'high' | 'medium' | 'low';

export interface FaultAnalysis {
  level: FaultLevel;
  levelLabel: string;
  cause: string;
  action: string;
}

const LEVEL_LABEL: Record<FaultLevel, string> = {
  critical: 'Yuqori (kritik)',
  high: "O'rta-yuqori",
  medium: "O'rta",
  low: 'Past',
};

/**
 * Qurilma holatiga qarab nosozlikning ehtimoliy sababi va tavsiya etilgan
 * chorasini hisoblaydi. (Demo evristikasi — keyinroq haqiqiy tahlil bilan
 * almashtirilishi mumkin.)
 */
export function analyzeFault(d: Device): FaultAnalysis {
  const v = parseInt(d.voltage, 10); // "—" bo'lsa NaN

  if (d.status === 'offline') {
    let cause: string;
    if (d.type === 'business') {
      cause = "Obyekt bilan aloqa to'liq uzilgan — elektr ta'minoti yo'qolgan yoki hisoblagich/aloqa moduli ishlamayapti.";
    } else if (d.type === 'household') {
      cause = "Abonent (fuqaro) hisoblagichi bilan aloqa yo'q — uyga elektr ta'minoti uzilgan yoki hisoblagich nosoz bo'lishi mumkin.";
    } else {
      cause = "Konsentrator bilan aloqa yo'q — elektr ta'minoti uzilgan yoki GSM/aloqa moduli nosoz bo'lishi mumkin.";
    }
    const action =
      d.type === 'concentrator'
        ? "Hududiy avariya brigadasini darhol yo'naltiring. Transformator va aloqa modulini tekshiring; zarur bo'lsa zaxira sxemaga o'tkazing."
        : "Mas'ul xodimni xabardor qiling; abonent manziliga tashrif buyurib hisoblagich va liniyani tekshiring.";
    return { level: 'critical', levelLabel: LEVEL_LABEL.critical, cause, action };
  }

  if (d.status === 'fault') {
    if (!Number.isNaN(v) && v >= 240) {
      return {
        level: 'high',
        levelLabel: LEVEL_LABEL.high,
        cause: `Kuchlanish me'yordan yuqori (${d.voltage}) — ortiq kuchlanish; faza nosimmetriyasi yoki regulyator nosozligi ehtimoli.`,
        action:
          "Kuchlanish regulyatorini tekshiring, yukni qayta taqsimlang, ortiq kuchlanishdan himoyani ko'rib chiqing.",
      };
    }
    return {
      level: 'high',
      levelLabel: LEVEL_LABEL.high,
      cause:
        "Qurilmada nosozlik aniqlandi — bir qism hisoblagichlar bilan aloqa yo'q yoki o'lchov ko'rsatkichlari anomal.",
      action: "Hisoblagichlar ulanishi va liniya holatini tekshiring; texnik mutaxassisni yuboring.",
    };
  }

  // warning
  if (!Number.isNaN(v) && v <= 215) {
    return {
      level: 'medium',
      levelLabel: LEVEL_LABEL.medium,
      cause: `Kuchlanish me'yordan past (${d.voltage}) — ortiqcha yuk yoki uzun liniyadagi yo'qotish ehtimoli.`,
      action:
        "Yukni kuzating; transformator quvvati va ulanishlarni tekshiring; kerak bo'lsa yukni qayta taqsimlang.",
    };
  }
  return {
    level: 'low',
    levelLabel: LEVEL_LABEL.low,
    cause: "Kichik chetlanish aniqlandi — kuzatuvni talab qiladi.",
    action: "Holatni kuzatib boring; chetlanish takrorlansa rejali texnik tekshiruv tayinlang.",
  };
}
