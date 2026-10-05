import { useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { friendsApi } from '../../services/friendsService';
import { buildPublicStats } from '../../utils/friends';

/** Keeps my shared friend summary (publicStats/{uid}) up to date, debounced. */
export default function FriendSync() {
  const d = useData();
  const payload = useMemo(
    () => (d.loading || !d.userDoc?.onboarded ? null : buildPublicStats(d)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d.loading, d.userDoc, d.days, d.stats, d.streaks, d.settings, d.goals, d.achievements, d.profile],
  );
  const json = payload ? JSON.stringify(payload) : '';

  useEffect(() => {
    if (!payload) return;
    const t = setTimeout(() => friendsApi.publish(d.uid, payload).catch(() => {}), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, d.uid]);

  return null;
}
