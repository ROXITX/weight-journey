import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataContext';
import { useAnalytics, useWater } from '../hooks';
import { Card, PageHeader, SectionTitle, IconButton, EmptyState, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { ProgressBar } from '../components/common/ProgressRing';
import WaterBottle from '../components/water/WaterBottle';
import { WaterQuick } from '../components/quick/QuickForms';
import { GoalBars } from '../components/charts/Charts';
import { fmtKey, todayKey } from '../utils/date';
import { fmtL, pct } from '../utils/format';

export default function Water() {
  const { goals, streaks } = useData();
  const w = useWater(todayKey());
  const [sel, setSel] = useState({ range: '7D' });
  const a = useAnalytics(sel);
  const week = useAnalytics({ range: '7D' });
  const month = useAnalytics({ range: '1M' });
  const history = [...a.days].reverse().filter((d) => d.waterMl > 0);
  const remaining = Math.max(0, w.target - w.totalMl);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader emoji="💧" title="Water" subtitle="Stay hydrated — carry your bottle!" />

      <Card className="!p-0">
        <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_20%_30%,color-mix(in_srgb,var(--c-water)_20%,transparent),transparent)]" />
        <div className="relative grid items-center gap-4 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
          <div className="mx-auto"><WaterBottle pct={w.pct} size={150} /></div>
          <div>
            <div className="font-display text-5xl font-bold text-water">
              <AnimatedNumber value={w.totalMl / 1000} decimals={2} /> <span className="text-2xl text-muted">/ {goals.waterTarget.toFixed(1)} L</span>
            </div>
            <div className="mt-1 text-sm font-semibold">{w.pct}% · {remaining ? `${remaining} ml to go` : '🎉 Goal reached!'}</div>
            <ProgressBar value={w.pct} className="my-4 h-3" color="linear-gradient(90deg,var(--c-water),var(--c-secondary))" />
            <WaterQuick />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Weekly avg', fmtL(week.water.avg || 0, 2)],
          ['Monthly avg', fmtL(month.water.avg || 0, 2)],
          ['Best day', a.water.best ? `${fmtL(a.water.best.waterMl)}` : '—', a.water.best ? fmtKey(a.water.best.date, 'd MMM') : sel.range],
          ['Goal achieved', `${a.water.goalDays} / ${a.totalDays} days`, `${pct(a.water.goalDays, a.totalDays)}% · ${sel.range}`],
          ['Total consumed', fmtL(a.water.total), sel.range],
          ['Water streak', `${streaks.water.current} days`, `best ${streaks.water.longest}`],
        ].map(([l, v, h]) => (
          <Card key={l} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</div>
            <div className="mt-1 font-display text-xl font-bold">{v}</div>
            {h && <div className="text-[11px] text-muted">{h}</div>}
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold">Water trend</h2>
          <DateRangeSelector value={sel} onChange={setSel} layoutId="water-range" />
        </div>
        <GoalBars days={a.days} value={(d) => d.waterMl} goal={w.target} color="var(--c-water)" unit=" ml" height={240} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Today's entries</SectionTitle>
          {!w.entries.length ? (
            <EmptyState icon="💧" title="No water logged today" text="Tap a quick button above to start." />
          ) : (
            <ul className="space-y-1.5">
              {[...w.entries].reverse().map((e) => (
                <motion.li key={e.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-xl bg-card-2/60 px-3 py-2">
                  <span className="text-lg">💧</span>
                  <span className="flex-1 font-semibold">{e.ml > 0 ? '+' : ''}{e.ml} ml</span>
                  <span className="text-xs text-muted">{format(e.at, 'h:mm a')}</span>
                  <IconButton icon={Trash2} label="Remove entry" size={15} onClick={() => w.remove(e.id)} />
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <SectionTitle>History · {sel.range}</SectionTitle>
          {!history.length ? (
            <EmptyState icon="📅" title="No water history yet" />
          ) : (
            <ul className="space-y-2">
              {history.map((d) => (
                <li key={d.date} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-muted">{fmtKey(d.date, 'EEE d MMM')}</span>
                  <ProgressBar value={pct(d.waterMl, w.target)} className="h-2" color={d.waterMl >= w.target ? 'var(--c-primary)' : 'var(--c-water)'} />
                  <span className="w-24 text-right text-sm font-semibold">{(d.waterMl / 1000).toFixed(1)} / {goals.waterTarget} L</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
