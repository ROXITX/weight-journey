// Recharts-based charts. Colours come from CSS variables so light/dark themes just work.
import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, BarChart, Bar, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line,
} from 'recharts';
import { fmtKey, fromKey } from '../../utils/date';
import { fmtInt, signed } from '../../utils/format';
import { heatLevel } from '../../utils/scoring';
import { habitCategories } from '../../config/defaultHabits';
import { EmptyState } from '../common/ui';

const tick = { fontSize: 11, fill: 'var(--c-muted)' };
const shortDate = (k) => (k ? fmtKey(k, 'd MMM') : '');

export function TooltipBox({ title, rows }) {
  return (
    <div className="glass rounded-2xl px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-ink">{title}</div>
      {rows.map(([label, value, color]) => (
        <div key={label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted">
            {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
            {label}
          </span>
          <span className="font-semibold text-ink">{value}</span>
        </div>
      ))}
    </div>
  );
}

/** Weight line with start / target reference lines. Tap a point to see the change. */
export const WeightChart = memo(function WeightChart({ entries, start, target, height = 260 }) {
  const [sel, setSel] = useState(null);
  const data = useMemo(() => entries.map((e, i) => ({ ...e, change: i ? e.weight - entries[i - 1].weight : null })), [entries]);
  if (data.length < 1) return <EmptyState icon="⚖️" title="No weight data in this range" text="Log your weight to see your trend." />;
  const vals = data.map((d) => d.weight);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  // Include start/target in the scale only when they're close, so the trend isn't flattened
  const near = (v) => v && v >= lo - 4 && v <= hi + 4;
  const ws = vals.concat([start, target].filter(near));
  const domain = [Math.floor(Math.min(...ws) - 0.5), Math.ceil(Math.max(...ws) + 0.5)];
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-accent" /> Actual</span>
        {start && <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-muted" /> Start {start} kg</span>}
        {target && <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-primary" /> Target {target} kg</span>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            onClick={(s) => {
              const i = s?.activeIndex ?? s?.activeTooltipIndex;
              const d = i != null ? data[Number(i)] : data.find((x) => x.date === s?.activeLabel);
              if (d) setSel(d);
            }}
          >
            <defs>
              <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--c-accent)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--c-accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wline" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--c-accent)" />
                <stop offset="100%" stopColor="var(--c-secondary)" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis domain={domain} tick={tick} axisLine={false} tickLine={false} width={48} />
            {near(start) && <ReferenceLine y={start} stroke="var(--c-muted)" strokeDasharray="5 5" label={{ value: `Start ${start}`, position: 'insideTopLeft', fill: 'var(--c-muted)', fontSize: 10 }} />}
            {near(target) && <ReferenceLine y={target} stroke="var(--c-primary)" strokeDasharray="5 5" label={{ value: `Target ${target}`, position: 'insideBottomLeft', fill: 'var(--c-primary)', fontSize: 10 }} />}
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <TooltipBox
                    title={fmtKey(payload[0].payload.date, 'EEE, d MMM yyyy')}
                    rows={[
                      ['Weight', `${payload[0].payload.weight} kg`, 'var(--c-accent)'],
                      ['Change', payload[0].payload.change == null ? '—' : signed(payload[0].payload.change, 1, ' kg')],
                    ]}
                  />
                ) : null
              }
            />
            <Area type="monotone" dataKey="weight" stroke="url(#wline)" strokeWidth={3} fill="url(#wgrad)" dot={data.length < 40 ? { r: 3, fill: 'var(--c-card)', strokeWidth: 2, stroke: 'var(--c-accent)' } : false} activeDot={{ r: 6, fill: 'var(--c-accent)', stroke: 'var(--c-card)', strokeWidth: 3 }} animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <AnimatePresence>
        {sel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-card-2 px-4 py-3 text-sm">
              <span className="text-muted">{fmtKey(sel.date, 'EEE, d MMM')}</span>
              <span className="font-display text-lg font-bold">{sel.weight} kg</span>
              <span className={sel.change > 0 ? 'font-semibold text-danger' : 'font-semibold text-primary'}>{sel.change == null ? 'First entry' : signed(sel.change, 1, ' kg')}</span>
              <button className="text-xs text-muted" onClick={() => setSel(null)} aria-label="Close">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/** Generic daily bars with a goal line (water, steps, sleep, calories…). */
export const GoalBars = memo(function GoalBars({ days, value, goal, color, unit = '', format = fmtInt, height = 200, goalLabel = 'Goal', invert }) {
  const data = days.map((d) => ({ date: d.date, v: value(d) ?? 0 }));
  if (!data.some((d) => d.v)) return <EmptyState icon="📊" title="No data in this range" text="Start logging and your chart will appear here." />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
          {goal != null && <ReferenceLine y={goal} stroke="var(--c-primary)" strokeDasharray="5 5" label={{ value: goalLabel, position: 'insideTopRight', fill: 'var(--c-primary)', fontSize: 10 }} />}
          <Tooltip cursor={{ fill: 'var(--c-line)' }} content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={fmtKey(payload[0].payload.date, 'EEE, d MMM')} rows={[['Value', `${format(payload[0].payload.v)}${unit}`, color]]} /> : null)} />
          <Bar dataKey="v" radius={[8, 8, 3, 3]} maxBarSize={28} animationDuration={900}>
            {data.map((d) => {
              const hit = goal != null && (invert ? d.v <= goal : d.v >= goal);
              return <Cell key={d.date} fill={hit ? 'var(--c-primary)' : color} fillOpacity={hit ? 1 : 0.75} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const HEAT = ['var(--heat-0)', 'var(--heat-1)', 'var(--heat-2)', 'var(--heat-3)', 'var(--heat-4)', 'var(--heat-5)'];
export const heatColor = (pct, logged) => HEAT[heatLevel(pct, logged)];

/** Daily consistency % bars coloured by heat bucket + target line. */
export const ConsistencyBars = memo(function ConsistencyBars({ days, target, height = 200 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 10, right: 6, left: -6, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} width={48} unit="%" />
          <ReferenceLine y={target} stroke="var(--c-secondary)" strokeDasharray="5 5" label={{ value: `Target ${target}%`, position: 'insideTopRight', fill: 'var(--c-secondary)', fontSize: 10 }} />
          <Tooltip cursor={{ fill: 'var(--c-line)' }} content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={fmtKey(payload[0].payload.date, 'EEE, d MMM')} rows={[['Consistency', `${payload[0].payload.pct}%`], ['Goals', `${payload[0].payload.done}/${payload[0].payload.total}`]]} /> : null)} />
          <Bar dataKey="pct" radius={[8, 8, 3, 3]} maxBarSize={26} animationDuration={900}>
            {days.map((d) => (
              <Cell key={d.date} fill={heatColor(d.pct, d.logged)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

/** Rolling 7-day average consistency line. */
export const ConsistencyTrend = memo(function ConsistencyTrend({ days, height = 200 }) {
  const data = days.map((d, i) => {
    const win = days.slice(Math.max(0, i - 6), i + 1).filter((x) => x.logged);
    return { date: d.date, pct: d.logged ? d.pct : null, avg: win.length ? Math.round(win.reduce((s, x) => s + x.pct, 0) / win.length) : null };
  });
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 6, left: -6, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} width={48} unit="%" />
          <Tooltip content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={fmtKey(payload[0].payload.date, 'EEE, d MMM')} rows={[['Day', payload[0].payload.pct == null ? '—' : `${payload[0].payload.pct}%`, 'var(--c-secondary)'], ['7-day avg', `${payload[0].payload.avg ?? '—'}%`, 'var(--c-primary)']]} /> : null)} />
          <Line dataKey="pct" stroke="var(--c-secondary)" strokeOpacity={0.5} dot={{ r: 2 }} strokeWidth={1.5} connectNulls animationDuration={900} />
          <Line dataKey="avg" stroke="var(--c-primary)" strokeWidth={3} dot={false} connectNulls animationDuration={1200} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

/** Radar of completion % by habit category. */
export const CategoryRadar = memo(function CategoryRadar({ days, height = 240 }) {
  const data = habitCategories
    .map((c) => {
      let done = 0;
      let total = 0;
      days.filter((d) => d.logged).forEach((d) => d.items.forEach((i) => i.habit.category === c.id && (total++, i.done && done++)));
      return { cat: c.label, v: total ? Math.round((done / total) * 100) : null };
    })
    .filter((d) => d.v != null);
  if (data.length < 3) return <EmptyState icon="🕸️" title="Not enough data yet" text="Log a few days to see your balance." />;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--c-line)" />
          <PolarAngleAxis dataKey="cat" tick={{ fontSize: 11, fill: 'var(--c-muted)' }} />
          <Radar dataKey="v" stroke="var(--c-accent)" fill="var(--c-accent)" fillOpacity={0.35} strokeWidth={2} animationDuration={1000} />
          <Tooltip content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={payload[0].payload.cat} rows={[['Completion', `${payload[0].payload.v}%`]]} /> : null)} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
});

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Average consistency per weekday. */
export const WeekdayChart = memo(function WeekdayChart({ days, height = 200 }) {
  const data = WD.map((w, i) => {
    const list = days.filter((d) => d.logged && fromKey(d.date).getDay() === i);
    return { w, v: list.length ? Math.round(list.reduce((s, d) => s + d.pct, 0) / list.length) : 0 };
  });
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 6, left: -6, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="w" tick={tick} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} width={48} unit="%" />
          <Tooltip cursor={{ fill: 'var(--c-line)' }} content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={payload[0].payload.w} rows={[['Avg consistency', `${payload[0].payload.v}%`]]} /> : null)} />
          <Bar dataKey="v" radius={[10, 10, 4, 4]} maxBarSize={34} animationDuration={900}>
            {data.map((d) => (
              <Cell key={d.w} fill={heatColor(d.v, true)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
