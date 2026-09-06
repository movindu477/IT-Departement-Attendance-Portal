// Backfills publicStats/{uid} for a month, e.g.  node scripts/backfillStats.cjs 2026-09
//
// Reuses the client's computeMonthStats so the numbers cannot drift from what
// the app publishes on save. Writes exactly the seven keys the publicStats
// rule permits (uid, name, month, daysPresent, currentStreak, lastMarked,
// updatedAt) and `name`, matching the client — never `displayName`.
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');
const { computeMonthStats } = require('../src/utils/computeStats.js');

const monthKey = process.argv[2];
if (!/^\d{4}-\d{2}$/.test(monthKey || '')) {
  console.error('Usage: node scripts/backfillStats.cjs YYYY-MM   (e.g. 2026-09)');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

(async () => {
  const usersSnap = await db.collection('users').get();
  let written = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const { name } = userDoc.data();

    const logsSnap = await db
      .collection('attendance')
      .where('userId', '==', uid)
      .get();
    const records = logsSnap.docs.map(d => d.data());

    const stats = computeMonthStats(records, monthKey);

    await db.collection('publicStats').doc(uid).set({
      uid,
      name: name || 'User',
      month: monthKey,
      ...stats,
      updatedAt: FieldValue.serverTimestamp(),
    });

    written++;
    console.log(
      `${(name || uid).padEnd(20)} days=${String(stats.daysPresent).padStart(2)}` +
      `  streak=${String(stats.currentStreak).padStart(2)}  last=${stats.lastMarked ?? '—'}`
    );
  }

  console.log(`\nDone — ${written} publicStats document(s) written for ${monthKey}.`);
  process.exit(0);
})();
