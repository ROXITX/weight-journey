import { motion } from 'framer-motion';

/** Animated check mark that "draws" itself, with a pop + ripple for haptic-like feedback. */
export default function Check({ checked, color = 'var(--c-primary)', size = 26 }) {
  return (
    <motion.span
      className="relative grid shrink-0 place-items-center rounded-[9px] border-2"
      style={{ width: size, height: size, borderColor: checked ? color : 'var(--c-line)', background: checked ? color : 'transparent' }}
      animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.35 }}
    >
      {checked && (
        <motion.span
          className="absolute inset-0 rounded-[9px]"
          style={{ boxShadow: `0 0 0 0 ${color}` }}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.5 }}
        />
      )}
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="white"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  );
}
