import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts smoothly from the previous value to `value`. */
export default function AnimatedNumber({ value, decimals = 0, className, format }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();
  const fmt = format || ((v) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value == null || Number.isNaN(value)) {
      el.textContent = '—';
      return;
    }
    if (reduce) {
      el.textContent = fmt(value);
      prev.current = value;
      return;
    }
    const ctrl = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = fmt(v)),
    });
    prev.current = value;
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, reduce]);

  return <span ref={ref} className={className} />;
}
