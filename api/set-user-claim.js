// api/set-user-claim.js
// -----------------------------------------------------------------
//  Grants { role: 'authenticated' } to the caller's own account.
//
//  Supabase derives the Postgres role from the `role` claim in the JWT, so
//  without it every request falls back to `anon` and the storage RLS policy
//  refuses the upload. Firebase does not set that claim, so something has to.
//
//  The uid comes from the *verified* token, never from the request body, so a
//  caller can only ever grant the claim to themselves. Granting
//  'authenticated' to someone who has already authenticated adds no privilege
//  beyond what they had.
//
//  DEPLOYMENT: this is a Vercel/Netlify-style serverless handler. It is NOT
//  reachable on the current Firebase Hosting setup, where firebase.json
//  rewrites "**" to /index.html and static files are all that is served.
//  See the notes in README/handover before relying on it.
// -----------------------------------------------------------------

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function auth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores the key with literal \n sequences.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const a = auth();
    // The token proves identity; the claim is only ever set on that uid
    const decoded = await a.verifyIdToken(header.slice(7));

    if (decoded.role === 'authenticated') {
      return res.status(200).json({ status: 'already set' });
    }

    await a.setCustomUserClaims(decoded.uid, { role: 'authenticated' });
    return res.status(200).json({ status: 'set' });
  } catch (err) {
    console.error('set-user-claim:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
