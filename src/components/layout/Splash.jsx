import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <motion.img
          src="favicon.svg"
          alt=""
          className="h-16 w-16 rounded-2xl shadow-[0_12px_40px_-8px_var(--c-primary)]"
          animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />
        <span className="font-display text-sm font-semibold tracking-[0.3em] text-muted">WEIGHT JOURNEY</span>
      </motion.div>
    </div>
  );
}
