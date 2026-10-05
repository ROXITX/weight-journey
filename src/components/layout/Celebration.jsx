import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#0EA5E9'];

/** Tasteful milestone celebration: small confetti burst + card. Auto-dismisses. */
export default function Celebration() {
  const { celebration, dismissCelebration } = useToast();
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 520,
        y: -Math.random() * 380 - 60,
        r: Math.random() * 540 - 270,
        c: COLORS[i % COLORS.length],
        s: 6 + Math.random() * 6,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebration],
  );

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(dismissCelebration, 4500);
    return () => clearTimeout(t);
  }, [celebration, dismissCelebration]);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismissCelebration} role="alertdialog" aria-label={celebration.title}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="pointer-events-none absolute left-1/2 top-1/2">
            {bits.map((b) => (
              <motion.span
                key={b.id}
                className="absolute rounded-sm"
                style={{ width: b.s, height: b.s * 0.5, background: b.c }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: b.x, y: [0, b.y, b.y + 520], opacity: [1, 1, 0], rotate: b.r }}
                transition={{ duration: 2.4, ease: 'easeOut' }}
              />
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.6, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="card relative w-full max-w-xs p-6 text-center"
          >
            <motion.div className="text-6xl" animate={{ rotate: [0, -12, 12, -6, 0], scale: [1, 1.2, 1] }} transition={{ duration: 1 }}>
              {celebration.icon || '🎉'}
            </motion.div>
            <div className="mt-3 font-display text-xs font-bold tracking-[0.25em] text-primary">AMAZING!</div>
            <div className="mt-1 font-display text-2xl font-bold">{celebration.title}</div>
            <p className="mt-1 text-sm text-muted">{celebration.text || 'Keep going.'}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
