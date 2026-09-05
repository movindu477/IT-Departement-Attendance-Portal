// firebase-admin v14 uses the modular API — the old `admin.auth()` /
// `admin.credential.cert()` namespaced style was removed.
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

(async () => {
  const auth = getAuth();
  const { users } = await auth.listUsers(1000);

  if (users.length === 0) {
    console.log('No users found.');
    process.exit(0);
  }

  for (const u of users) {
    await auth.setCustomUserClaims(u.uid, { role: 'authenticated' });
    console.log('Claim set:', u.email || u.uid);
  }

  console.log(`\nDone — ${users.length} user(s) updated.`);
  process.exit(0);
})();
