import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebase';
import { useTeamPresence } from './useTeamPresence';

export function useTeam() {
  const presence = useTeamPresence();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const monthKey = format(new Date(), 'yyyy-MM');
        const [usersSnap, statsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'publicStats')),
        ]);

        const statsByUid = {};
        statsSnap.forEach(d => {
          const s = d.data();
          if (s.month === monthKey) statsByUid[s.uid] = s;
        });

        setMembers(usersSnap.docs.map(d => ({
          // users/{uid} documents don't carry a uid field — the doc id is the uid
          uid: d.id,
          ...d.data(),
          stats: statsByUid[d.id] ?? { daysPresent: 0, currentStreak: 0, lastMarked: null },
        })));
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withPresence = members.map(m => ({
    ...m,
    isOnline: presence[m.uid]?.state === 'online',
  }));

  return {
    team: withPresence,
    online: withPresence.filter(m => m.isOnline),
    ranked: [...withPresence].sort((a, b) => b.stats.daysPresent - a.stats.daysPresent),
    loading,
    error,
  };
}
