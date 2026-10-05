import { useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useAchievements } from '../../hooks';

/** Saves newly-unlocked achievements and celebrates them once. */
export default function AchievementWatcher() {
  const { achievements: stored, unlockAchievement, loading } = useData();
  const { celebrate } = useToast();
  const list = useAchievements();
  const pending = useRef(new Set());

  useEffect(() => {
    if (loading || stored == null) return;
    const fresh = list.filter((a) => a.unlocked && !stored[a.id] && !pending.current.has(a.id));
    if (!fresh.length) return;
    fresh.forEach((a) => {
      pending.current.add(a.id);
      unlockAchievement(a.id);
    });
    const a = fresh.at(-1);
    celebrate({ icon: a.icon, title: a.title, text: fresh.length > 1 ? `${a.desc} · +${fresh.length - 1} more unlocked` : a.desc });
  }, [list, stored, loading, unlockAchievement, celebrate]);

  return null;
}
