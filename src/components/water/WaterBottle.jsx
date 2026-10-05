import { useId } from 'react';
import { motion } from 'framer-motion';

// Bottle outline in a 100 × 160 viewBox
const BODY = 'M38,10 H62 V22 C62,29 88,30 88,46 V148 Q88,157 79,157 H21 Q12,157 12,148 V46 C12,30 38,29 38,22 Z';
const TOP = 26; // fill level at 100%
const BOTTOM = 157; // fill level at 0%
const WAVE_A = 'M0,6 Q25,-2 50,6 T100,6 T150,6 T200,6 V200 H0 Z';
const WAVE_B = 'M0,8 Q25,15 50,8 T100,8 T150,8 T200,8 V200 H0 Z';

/** Animated water bottle — fills with a waving surface as you drink. */
export default function WaterBottle({ pct = 0, size = 150 }) {
  const id = useId().replace(/:/g, '');
  const v = Math.max(0, Math.min(100, pct));
  const level = BOTTOM - (BOTTOM - TOP) * (v / 100) - 6;
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 100 160" role="img" aria-label={`Water bottle ${Math.round(v)} percent full`}>
      <defs>
        <clipPath id={`clip${id}`}>
          <path d={BODY} />
        </clipPath>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--c-water)" />
          <stop offset="100%" stopColor="var(--c-secondary)" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#clip${id})`}>
        <rect width="100" height="160" fill="var(--c-water)" opacity="0.08" />
        <motion.g initial={{ y: BOTTOM }} animate={{ y: level }} transition={{ type: 'spring', stiffness: 50, damping: 13 }}>
          <motion.path d={WAVE_B} fill="var(--c-water)" opacity={0.4} animate={{ x: [-100, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }} />
          <motion.path d={WAVE_A} fill={`url(#g${id})`} animate={{ x: [0, -100] }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }} />
          {[25, 50, 72].map((x, i) => (
            <motion.circle key={x} cx={x} r={1.5 + i * 0.6} fill="white" initial={{ cy: 120, opacity: 0 }} animate={{ cy: [120, 10], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 2.6 + i, delay: i * 0.7 }} />
          ))}
        </motion.g>
        {/* glossy highlight */}
        <rect x="18" y="50" width="6" height="90" rx="3" fill="white" opacity="0.18" />
      </g>
      <path d={BODY} fill="none" stroke="var(--c-water)" strokeOpacity="0.55" strokeWidth="2" />
      <rect x="35" y="2" width="30" height="10" rx="3" fill="var(--c-water)" />
    </svg>
  );
}
