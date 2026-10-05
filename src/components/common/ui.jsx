// Small shared building blocks used across all pages.
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } };

/** Rounded card with entrance animation (works inside a `stagger` parent). */
export const Card = forwardRef(function Card({ className, children, hover, as = 'div', ...rest }, ref) {
  const M = motion[as] || motion.div;
  return (
    <M
      ref={ref}
      variants={fadeUp}
      whileHover={hover ? { y: -3, transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}
      className={cx('card relative overflow-hidden p-4 sm:p-5', className)}
      {...rest}
    >
      {children}
    </M>
  );
});

const BTN = {
  primary:
    'text-white bg-[linear-gradient(135deg,var(--c-primary),var(--c-secondary))] shadow-[0_8px_24px_-8px_var(--c-primary)] hover:brightness-110',
  soft: 'bg-card-2 text-ink hover:bg-line border border-line',
  ghost: 'text-muted hover:text-ink hover:bg-card-2',
  danger: 'bg-danger/12 text-danger hover:bg-danger/20 border border-danger/20',
  water: 'text-white bg-[linear-gradient(135deg,var(--c-water),var(--c-secondary))] shadow-[0_8px_24px_-10px_var(--c-water)]',
};

export function Button({ variant = 'primary', size = 'md', className, loading, children, icon: Icon, ...rest }) {
  const sz = size === 'sm' ? 'h-9 px-3 text-sm rounded-xl' : size === 'lg' ? 'h-14 px-6 text-base rounded-2xl' : 'h-11 px-4 text-sm rounded-2xl';
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 font-semibold transition-[filter,background-color,color] disabled:pointer-events-none disabled:opacity-50',
        sz,
        BTN[variant],
        className,
      )}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
    </motion.button>
  );
}

export function IconButton({ icon: Icon, label, className, size = 20, ...rest }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      aria-label={label}
      title={label}
      className={cx('grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-card-2 hover:text-ink', className)}
      {...rest}
    >
      <Icon size={size} />
    </motion.button>
  );
}

export function SectionTitle({ children, action, className }) {
  return (
    <div className={cx('mb-3 flex flex-wrap items-center justify-between gap-2', className)}>
      <h2 className="font-display text-[15px] font-semibold tracking-wide text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, children, emoji }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </motion.header>
  );
}

export function Pill({ children, tone = 'muted', className }) {
  const t = {
    muted: 'bg-card-2 text-muted',
    good: 'bg-primary/12 text-primary',
    bad: 'bg-danger/12 text-danger',
    warn: 'bg-warning/15 text-warning',
    info: 'bg-secondary/12 text-secondary',
    water: 'bg-water/12 text-water',
  }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', t, className)}>{children}</span>;
}

/** Segmented control with a sliding highlight. */
export function Segmented({ options, value, onChange, layoutId, className, size = 'md' }) {
  return (
    <div role="tablist" className={cx('no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-card-2 p-1', className)}>
      {options.map((o) => {
        const id = o.id ?? o;
        const active = id === value;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cx(
              'relative shrink-0 rounded-xl font-semibold transition-colors',
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
              active ? 'text-white' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-secondary))] shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{o.label ?? id}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line')}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-1' : 'left-1')}
      />
    </button>
  );
}

/** − value + stepper with large touch targets. */
export function Stepper({ value, onChange, min = 0, max = 99, step = 1, suffix }) {
  return (
    <div className="flex items-center gap-2">
      <motion.button whileTap={{ scale: 0.85 }} aria-label="Decrease" onClick={() => onChange(Math.max(min, (value || 0) - step))} className="grid h-10 w-10 place-items-center rounded-xl bg-card-2 text-lg font-bold">
        −
      </motion.button>
      <motion.span key={value} initial={{ scale: 1.3, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="min-w-10 text-center font-display text-xl font-bold">
        {value || 0}
        {suffix}
      </motion.span>
      <motion.button whileTap={{ scale: 0.85 }} aria-label="Increase" onClick={() => onChange(Math.min(max, (value || 0) + step))} className="grid h-10 w-10 place-items-center rounded-xl bg-card-2 text-lg font-bold">
        +
      </motion.button>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton rounded-2xl', className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function EmptyState({ icon = '🌱', title, text, action }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center px-4 py-10 text-center">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="mb-3 text-5xl">
        {icon}
      </motion.div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
