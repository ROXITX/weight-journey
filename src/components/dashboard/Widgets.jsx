import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import Sparkline from '../common/Sparkline';
import { ProgressBar } from '../common/ProgressRing';
import { Card, SectionTitle, cx } from '../common/ui';
import { fmtKg } from '../../utils/format';

/** KPI card: value, target, %, trend, optional sparkline. */
export function KpiCard({ icon, label, value, decimals = 0, unit, target, pct, color = 'var(--c-primary)', spark, trend, trendGoodWhenDown, to, format }) {
  const body = (
    <Card hover className="h-full !p-4">
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
          {icon}
        </span>
        {trend != null && trend !== 0 && (
          <span className={cx('flex items-center gap-0.5 text-[11px] font-bold', (trendGoodWhenDown ? trend < 0 : trend > 0) ? 'text-primary' : 'text-danger')}>
            {trend < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
            {Math.abs(trend).toFixed(Math.abs(trend) < 10 ? 1 : 0)}
          </span>
        )}
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <AnimatedNumber value={value} decimals={decimals} format={format} className="font-display text-2xl font-bold tracking-tight" />
        {unit && <span className="text-xs font-semibold text-muted">{unit}</span>}
      </div>
      {target != null && <div className="text-[11px] text-muted">of {target}</div>}
      {pct != null && (
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar value={pct} className="h-1.5" color={color} />
          <span className="text-[11px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      )}
      {spark && <div className="mt-2 -mx-1"><Sparkline data={spark} color={color} height={30} /></div>}
    </Card>
  );
  return to ? <Link to={to} className="block h-full rounded-3xl">{body}</Link> : body;
}

export function GoalList({ items, title, emptyText, tone, max = 6 }) {
  const good = tone === 'good';
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, max);
  return (
    <div>
      <div className={cx('mb-2 text-xs font-bold uppercase tracking-wider', good ? 'text-primary' : 'text-danger')}>{title}</div>
      {!items.length ? (
        <p className="rounded-2xl bg-card-2 px-3 py-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {shown.map((i, idx) => (
            <motion.li
              key={i.habit.id}
              initial={{ opacity: 0, x: good ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.4) }}
              className={cx('flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm', good ? 'bg-primary/8' : 'bg-danger/8')}
            >
              <span className={good ? 'text-primary' : 'text-danger'}>{good ? '✓' : '✗'}</span>
              <span className="mr-auto">{i.habit.icon} {good ? i.habit.label : i.miss}</span>
            </motion.li>
          ))}
          {items.length > max && (
            <li>
              <button onClick={() => setAll((a) => !a)} className="w-full rounded-xl py-1.5 text-xs font-semibold text-muted hover:bg-card-2">
                {all ? 'Show less' : `+ ${items.length - max} more`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Today's summary: completed vs missed (missed is always visible). */
export function TodaySummary({ day, extraMissed = [] }) {
  return (
    <Card>
      <SectionTitle action={<Link to="/today" className="flex items-center gap-1 text-xs font-semibold text-primary">Update <ArrowRight size={14} /></Link>}>
        Today · {day.done} / {day.total} goals · {day.pct}%
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:order-2">
          <GoalList
            title="❌ Today's missed goals"
            tone="bad"
            items={[...extraMissed, ...day.missed]}
            emptyText="Nothing missed — perfect day! 🎉"
          />
        </div>
        <div className="md:order-1">
          <GoalList title="✓ Completed" tone="good" items={day.completed} emptyText="Nothing ticked yet. Let's start!" />
        </div>
      </div>
    </Card>
  );
}

/** START → milestones → TARGET visual journey. */
export function WeightJourney({ stats }) {
  const { start, target, current, progress } = stats;
  if (!start || !target) return null;
  const step = (start - target) / 4;
  const marks = [start, start - step, start - 2 * step, start - 3 * step, target].map((v) => Math.round(v * 10) / 10);
  return (
    <Card className="overflow-visible">
      <SectionTitle>🗺️ Weight journey</SectionTitle>
      <p className="mb-5 text-sm text-muted">
        You've completed <span className="font-display text-base font-bold text-gradient">{progress.toFixed(1)}%</span> of your weight-loss journey.
      </p>
      <div className="relative mx-2 mb-10 mt-8">
        <div className="h-3 rounded-full bg-line" />
        <motion.div
          className="absolute left-0 top-0 h-3 rounded-full bg-[linear-gradient(90deg,var(--c-accent),var(--c-secondary),var(--c-primary))]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {marks.map((m, i) => {
          const p = (i / 4) * 100;
          const passed = current <= m;
          return (
            <div key={i} className="absolute top-1.5 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p}%` }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + i * 0.12, type: 'spring' }}
                className={cx('h-5 w-5 rounded-full border-4 border-card', passed ? 'bg-primary' : 'bg-line')}
              />
              <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap text-center">
                <div className="text-[10px] font-bold uppercase text-muted">{i === 0 ? 'Start' : i === 4 ? 'Target' : ''}</div>
                <div className={cx('text-xs font-semibold', passed ? 'text-ink' : 'text-muted')}>{m}</div>
              </div>
            </div>
          );
        })}
        <motion.div
          className="absolute -top-9 -translate-x-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-bg shadow-lg">{fmtKg(current)}</div>
        </motion.div>
      </div>
    </Card>
  );
}

export function InsightList({ insights }) {
  const tone = { good: 'border-primary/25 bg-primary/6', bad: 'border-danger/25 bg-danger/6', info: 'border-secondary/25 bg-secondary/6' };
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {insights.map((i, idx) => (
        <motion.li
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.04 }}
          className={cx('flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm', tone[i.tone])}
        >
          <span className="text-xl">{i.icon}</span>
          <span>{i.text}</span>
        </motion.li>
      ))}
    </ul>
  );
}
