// firebase-admin v14 modular API, matching scripts/setClaims.cjs.
//
// Grants (or revokes) the `admin: true` custom claim used by firestore.rules'
// isAdmin() check. Claims are only settable with the Admin SDK, which is the
// whole point - a Firestore field would be writable by the user themselves.
//
// Usage:
//   node scripts/setAdmin.cjs nirushan@apiit.lk
//   node scripts/setAdmin.cjs nirushan@apiit.lk --revoke
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!email) {
  console.error('Usage: node scripts/setAdmin.cjs <email> [--revoke]');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });

(async () => {
  const auth = getAuth();
  const db = getFirestore();

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    console.error(`No Auth account found for ${email}. Create it in the Firebase Console first (Authentication > Users > Add user) - do not register it through the app's signup form, since that writes a userPrivate/hourlyRate document and this account is not on the payroll.`);
    process.exit(1);
  }

  // Merge with whatever claims the account already has. This account also
  // needs role: 'authenticated' for Supabase avatar uploads - overwriting
  // claims instead of merging would silently break image upload.
  const existingClaims = user.customClaims || {};
  const nextClaims = { ...existingClaims, role: 'authenticated' };

  if (revoke) {
    delete nextClaims.admin;
  } else {
    nextClaims.admin = true;
  }

  await auth.setCustomUserClaims(user.uid, nextClaims);

  // Mirror role onto users/{uid} as a UI convenience only - security rules
  // must never read this field, only request.auth.token.admin.
  await db.doc(`users/${user.uid}`).set(
    { role: revoke ? 'staff' : 'admin' },
    { merge: true }
  );

  console.log(`${revoke ? 'Revoked' : 'Granted'} admin claim for ${email} (${user.uid}).`);
  console.log('Claims now:', nextClaims);
  console.log('\nThe account must sign out and back in (or get a fresh ID token) before the new claim takes effect.');
  process.exit(0);
})();
