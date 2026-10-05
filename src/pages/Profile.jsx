import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAchievements } from '../hooks';
import { Card, PageHeader, SectionTitle, Button, stagger, fadeUp } from '../components/common/ui';
import { ProgressBar } from '../components/common/ProgressRing';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { WeightJourney } from '../components/dashboard/Widgets';
import { calcBmi } from '../utils/calc';
import { fmtInt } from '../utils/format';
import { fmtKey } from '../utils/date';

export default function Profile() {
  const { profile, stats, calories, goals, streaks, achievements: stored, days } = useData();
  const list = useAchievements();
  const unlocked = list.filter((a) => a.unlocked).length;
  const bmi = calcBmi(stats.current, profile.heightCm);
  const deficit = calories.maintenance ? calories.maintenance - goals.calorieTarget : null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader title="Profile">
        <Link to="/settings"><Button variant="soft" icon={Pencil}>Edit</Button></Link>
      </PageHeader>

      <Card className="flex items-center gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-secondary))] font-display text-3xl font-bold text-white shadow-lg">
          {(profile.name || '?').charAt(0).toUpperCase()}
        </motion.div>
        <div className="min-w-0">
          <div className="font-display text-2xl font-bold">{profile.name || 'You'}</div>
          <div className="text-sm text-muted">
            {profile.age} yrs · {profile.heightCm} cm · {profile.gender} {profile.startDate && `· since ${fmtKey(profile.startDate, 'd MMM yyyy')}`}
          </div>
          <div className="mt-1 text-sm">
            🔥 {streaks.overall.current}-day streak · 📅 {days.filter((d) => d.logged).length} days tracked · 🏆 {unlocked} achievements
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange opacity-20 blur-3xl" />
          <SectionTitle>🔥 Estimated maintenance</SectionTitle>
          <div className="font-display text-4xl font-bold">
            <AnimatedNumber value={calories.maintenance} /> <span className="text-base text-muted">kcal/day</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl bg-card-2 p-2"><div className="text-[11px] text-muted">BMR</div><b>{fmtInt(calories.bmr)}</b></div>
            <div className="rounded-2xl bg-card-2 p-2"><div className="text-[11px] text-muted">Activity ×</div><b>{calories.level.factor}</b></div>
            <div className="rounded-2xl bg-card-2 p-2"><div className="text-[11px] text-muted">Eat target</div><b>{fmtInt(goals.calorieTarget)}</b></div>
          </div>
          <p className="mt-3 text-xs text-muted">
            {calories.overridden ? 'Using your manual override. ' : ''}Estimate using Mifflin-St Jeor BMR × activity factor ({calories.level.label}).
            {deficit != null && ` Your target is ~${fmtInt(deficit)} kcal/day ${deficit >= 0 ? 'below' : 'above'} maintenance.`} Estimates only, not medical advice.
          </p>
          {bmi && <p className="mt-2 text-sm">BMI (estimate): <b>{bmi}</b></p>}
        </Card>
        <WeightJourney stats={stats} />
      </div>

      <Card>
        <SectionTitle>🏆 Achievements · {unlocked}/{list.length}</SectionTitle>
        <motion.div variants={stagger} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((a) => (
            <motion.div
              key={a.id}
              variants={fadeUp}
              whileHover={{ y: -4, rotate: a.unlocked ? -1 : 0 }}
              className={`relative overflow-hidden rounded-3xl border p-4 ${a.unlocked ? 'border-primary/30 bg-[linear-gradient(145deg,color-mix(in_srgb,var(--c-primary)_14%,transparent),color-mix(in_srgb,var(--c-secondary)_10%,transparent))]' : 'border-line bg-card-2/40'}`}
            >
              {a.unlocked && <motion.div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)]" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }} />}
              <div className={`text-3xl ${a.unlocked ? '' : 'opacity-30 grayscale'}`}>{a.icon}</div>
              <div className="mt-2 text-sm font-bold">{a.title}</div>
              <div className="text-[11px] text-muted">{a.desc}</div>
              {a.unlocked ? (
                <div className="mt-2 text-[10px] font-semibold text-primary">
                  ✓ Unlocked {stored?.[a.id]?.unlockedAt ? new Date(stored[a.id].unlockedAt).toLocaleDateString() : ''}
                </div>
              ) : (
                <ProgressBar value={a.progress * 100} className="mt-2 h-1.5" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </motion.div>
  );
}
