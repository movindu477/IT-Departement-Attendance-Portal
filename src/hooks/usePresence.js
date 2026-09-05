import { useEffect } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !rtdb) return;

    const myRef = ref(rtdb, `presence/${user.uid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() === false) return;

      // The offline instruction must reach the server before we announce
      // ourselves online, so a crash or dropped socket still clears the status.
      onDisconnect(myRef)
        .set({ state: 'offline', lastChanged: serverTimestamp() })
        .then(() => set(myRef, { state: 'online', lastChanged: serverTimestamp() }))
        .catch(err => console.error('presence:', err));
    });

    return () => unsub();
  }, [user]);
}
