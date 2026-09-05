import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    accessToken: async () => {
      // `auth` is null when the Firebase config is missing — see firebase.js
      const user = auth?.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    },
  }
);
