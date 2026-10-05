import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Scale, Droplets, Footprints, Dumbbell, NotebookPen } from 'lucide-react';
import Modal from '../common/Modal';
import { WeightForm, WaterQuick, StepsForm, WorkoutForm } from '../quick/QuickForms';

const ACTIONS = [
  { id: 'weight', label: 'Weight', icon: Scale, color: 'var(--c-accent)' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'var(--c-water)' },
  { id: 'steps', label: 'Steps', icon: Footprints, color: 'var(--c-orange)' },
  { id: 'workout', label: 'Workout', icon: Dumbbell, color: 'var(--c-primary)' },
  { id: 'journal', label: 'Journal', icon: NotebookPen, color: 'var(--c-pink)' },
];

/** Floating "+" button → fan of quick-log actions. */
export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const nav = useNavigate();

  const pick = (id) => {
    setOpen(false);
    if (id === 'journal') return nav('/today#journal');
    setSheet(id);
  };

  return (
    <>
      <AnimatePresence>
        {open && <motion.div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />}
      </AnimatePresence>
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5 lg:bottom-8 lg:right-8">
        <AnimatePresence>
          {open &&
            ACTIONS.map((a, i) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: (ACTIONS.length - i) * 0.035, type: 'spring', stiffness: 420, damping: 24 } }}
                exit={{ opacity: 0, y: 12, scale: 0.7, transition: { duration: 0.12 } }}
                whileTap={{ scale: 0.92 }}
                onClick={() => pick(a.id)}
                className="glass flex items-center gap-3 rounded-2xl py-2 pl-4 pr-2 text-sm font-semibold shadow-xl"
              >
                + {a.label}
                <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: a.color }}>
                  <a.icon size={19} />
                </span>
              </motion.button>
            ))}
        </AnimatePresence>
        <motion.button
          aria-label={open ? 'Close quick actions' : 'Quick add'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.06 }}
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="grid h-15 w-15 place-items-center rounded-[22px] bg-[linear-gradient(135deg,var(--c-primary),var(--c-secondary))] text-white shadow-[0_12px_32px_-8px_var(--c-primary)]"
          style={{ width: 60, height: 60 }}
        >
          <Plus size={28} strokeWidth={2.6} />
        </motion.button>
      </div>

      <Modal open={sheet === 'weight'} onClose={() => setSheet(null)} title="⚖️ Log weight">
        <WeightForm onDone={() => setSheet(null)} />
      </Modal>
      <Modal open={sheet === 'water'} onClose={() => setSheet(null)} title="💧 Add water">
        <WaterQuick />
      </Modal>
      <Modal open={sheet === 'steps'} onClose={() => setSheet(null)} title="🚶 Steps today">
        <StepsForm onDone={() => setSheet(null)} />
      </Modal>
      <Modal open={sheet === 'workout'} onClose={() => setSheet(null)} title="🏋️ Workout">
        <WorkoutForm onDone={() => setSheet(null)} />
      </Modal>
    </>
  );
}
