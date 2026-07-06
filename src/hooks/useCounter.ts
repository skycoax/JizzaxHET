import { useEffect, useRef, useState } from 'react';

/**
 * Raqam o'zgarganda smooth count-up animatsiyasi.
 * target o'zgarsa — avvalgi qiymatdan yangi gacha sanaydi.
 */
export function useCounter(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  const rafRef  = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      setVal(Math.round(from + (target - from) * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return val;
}
