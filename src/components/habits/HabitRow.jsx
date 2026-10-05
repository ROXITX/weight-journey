import { motion } from 'framer-motion';
import Check from '../common/Checkbox';
import { Stepper, cx } from '../common/ui';
import { fmtInt, fmtHours } from '../../utils/format';

const autoText = (item) => {
  switch (item.habit.auto) {
    case 'steps':
      return `${fmtInt(item.value)} / ${fmtInt(item.target)} steps`;
    case 'water':
      return `${(item.value / 1000).toFixed(1)} / ${(item.target / 1000).toFixed(1)} L`;
    case 'sleep':
      return `${fmtHours(item.value)} / ${item.target}h`;
    case 'bowel':
      return item.value ? `${item.value}× logged` : 'Log below';
    default:
      return '';
  }
};

/**
 * One habit on the Today page. Boolean → tap to toggle. Number → stepper.
 * Auto habits are computed from other inputs (steps, water, sleep, bowel) and show progress.
 */
export default function HabitRow({ item, color, onToggle, onValue, onAutoClick }) {
  const { habit, done } = item;
  const isNum = habit.type && habit.type !== 'boolean' && !habit.auto;

  if (isNum)
    return (
      <div className={cx('flex items-center gap-3 rounded-2xl border px-3 py-2.5', done ? 'border-primary/30 bg-primary/8' : 'border-line bg-card-2/50')}>
        <span className="text-xl">{habit.icon}</span>
        <div className="mr-auto min-w-0">
          <div className="truncate text-sm font-semibold">{habit.label}</div>
          <div className="text-xs text-muted">Target {habit.target} {habit.unit}</div>
        </div>
        <Stepper value={item.value} onChange={onValue} max={100000} />
      </div>
    );

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={habit.auto ? onAutoClick : onToggle}
      aria-pressed={done}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
        done ? 'border-transparent' : 'border-line bg-card-2/40 hover:bg-card-2',
      )}
      style={done ? { background: `color-mix(in srgb, ${color} 13%, transparent)` } : undefined}
    >
      <Check checked={done} color={color} />
      <span className="text-xl leading-none">{habit.icon}</span>
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate text-sm font-semibold', done && 'text-ink')}>{habit.label}</span>
        {habit.auto && <span className="block text-xs text-muted">Auto · {autoText(item)}</span>}
      </span>
      {habit.weight > 1 && <span className="rounded-full bg-card-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">×{habit.weight}</span>}
    </motion.button>
  );
}
