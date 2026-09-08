import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Rate previously hardcoded in Dashboard; now the seed for new accounts.
const DEFAULT_HOURLY_RATE = 240;

const AuthContext = createContext(null);

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

/**
 * Asks the backend to set { role: 'authenticated' } on the freshly created
 * user, then pulls the new claim into the session.
 *
 * The endpoint is not reachable on a static Firebase Hosting deploy - the
 * catch-all rewrite answers with index.html - so the response is checked
 * rather than trusted, and a miss is logged loudly instead of silently
 * appearing to succeed.
 */
async function requestUserClaim(firebaseUser) {
  try {
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/set-user-claim', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      console.warn(
        '[claims] /api/set-user-claim did not answer as JSON (status ' + res.status + '). ' +
        'This account has no role claim yet, so avatar upload will be refused. ' +
        'Run: node scripts/setClaims.cjs'
      );
      return false;
    }

    await res.json();
    // Pull the new claim into this session so no sign-out is needed.
    await firebaseUser.getIdToken(true);
    return true;
  } catch (err) {
    console.warn('[claims] could not set role claim:', err);
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // getIdToken() serves a cached token until it nears expiry, so a user
          // whose custom claim was set after their last refresh keeps sending
          // the old one and Supabase RLS rejects them. Force a refresh here;
          // it costs one round-trip per sign-in.
          await firebaseUser.getIdToken(true);
        } catch (e) {
          // Non-fatal: a stale token still authenticates against Firestore.
          console.error('Could not refresh ID token:', e);
        }

        try {
          // Public profile and owner-only pay data live in separate collections
          const [pubSnap, privSnap] = await Promise.all([
            getDoc(doc(db, 'users', firebaseUser.uid)),
            getDoc(doc(db, 'userPrivate', firebaseUser.uid))
          ]);

          if (pubSnap.exists()) {
            const data = pubSnap.data();
            const priv = privSnap.exists() ? privSnap.data() : {};
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || firebaseUser.displayName || 'User',
              jobTitle: data.jobTitle || 'Software Engineer',
              role: data.role || 'staff',
              avatar: data.avatar || DEFAULT_AVATAR,
              hourlyRate: Number(priv.hourlyRate ?? DEFAULT_HOURLY_RATE)
            });
          } else {
            // Fallback if document doesn't exist
            const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: displayName,
              jobTitle: 'Software Engineer',
              role: 'staff',
              avatar: DEFAULT_AVATAR,
              hourlyRate: DEFAULT_HOURLY_RATE
            });
          }
        } catch (e) {
          console.error("Error fetching user document from Firestore:", e);
          const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: displayName,
            jobTitle: 'Software Engineer',
            role: 'staff',
            avatar: DEFAULT_AVATAR,
            hourlyRate: DEFAULT_HOURLY_RATE
          });
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update Auth profile display name
      await updateProfile(userCredential.user, { displayName: name });

      const uid = userCredential.user.uid;

      const userData = {
        name: name,
        email: email,
        jobTitle: 'Software Engineer',
        role: 'staff',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
        createdAt: new Date().toISOString()
      };

      // Public profile and private pay data are written separately
      await Promise.all([
        setDoc(doc(db, 'users', uid), userData),
        setDoc(doc(db, 'userPrivate', uid), { hourlyRate: DEFAULT_HOURLY_RATE })
      ]);

      // Grant the Supabase 'authenticated' role claim. Never let this fail the
      // registration - the account is already created and usable for
      // everything except avatar upload.
      await requestUserClaim(userCredential.user);

      setUser({
        uid: uid,
        email: email,
        ...userData,
        hourlyRate: DEFAULT_HOURLY_RATE
      });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Reflect a newly uploaded avatar immediately, rather than waiting for re-login
  const updateAvatar = (avatar) => {
    setUser(prev => (prev ? { ...prev, avatar } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
