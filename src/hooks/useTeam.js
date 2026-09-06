import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebase';
import { useTeamPresence } from './useTeamPresence';
import { formatLastSeen } from '../utils/formatLastSeen';

// monthKey is a parameter rather than a hardcoded `new Date()` so a month
// selector can be added later without rewriting the hook.
export function useTeam(monthKey = format(new Date(), 'yyyy-MM')) {
  const presence = useTeamPresence();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [usersSnap, statsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'publicStats')),
        ]);
        if (cancelled) return;

        const statsByUid = {};
        statsSnap.forEach(d => {
          const s = d.data();
          if (s.month === monthKey) statsByUid[s.uid] = s;
        });

        setMembers(usersSnap.docs.map(d => ({
          // users/{uid} documents don't carry a uid field — the doc id is the uid
          uid: d.id,
          ...d.data(),
          stats: statsByUid[d.id] ?? { daysPresent: 0, currentStreak: null, lastMarked: null },
        })));
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [monthKey]);

  const withPresence = members.map(m => {
    const node = presence[m.uid];
    const isOnline = node?.state === 'online';
    const lastSeenAt = node?.lastChanged ?? null;
    return {
      ...m,
      isOnline,
      lastSeenAt,
      lastSeenLabel: isOnline ? 'Online now' : formatLastSeen(lastSeenAt),
    };
  });

  return {
    team: withPresence,
    online: withPresence.filter(m => m.isOnline),
    ranked: [...withPresence].sort((a, b) => b.stats.daysPresent - a.stats.daysPresent),
    // Online first, then most recently seen, then name — a roster ordering
    byActivity: [...withPresence].sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      if ((b.lastSeenAt ?? 0) !== (a.lastSeenAt ?? 0)) return (b.lastSeenAt ?? 0) - (a.lastSeenAt ?? 0);
      return (a.name || '').localeCompare(b.name || '');
    }),
    monthKey,
    loading,
    error,
  };
}
