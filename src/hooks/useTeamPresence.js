import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

export function useTeamPresence() {
  const [presence, setPresence] = useState({});

  useEffect(() => {
    if (!rtdb) return;
    const unsub = onValue(ref(rtdb, 'presence'), snap => setPresence(snap.val() || {}));
    return () => unsub();
  }, []);

  return presence; // presence[uid]?.state === 'online'
}
