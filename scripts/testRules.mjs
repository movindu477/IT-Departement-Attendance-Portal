// Verifies the privacy boundary of firestore.rules against the Firestore
// emulator. Run with:  npx firebase emulators:exec --only firestore "node scripts/testRules.mjs"
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const ME = 'uid_me';
const OTHER = 'uid_other';

const testEnv = await initializeTestEnvironment({
  projectId: 'attendance-portal-it',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

// Seed documents bypassing rules, so reads have something real to hit.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users', OTHER), { name: 'Other', role: 'staff', jobTitle: 'Engineer' });
  await setDoc(doc(db, 'users', ME), { name: 'Me', role: 'staff', jobTitle: 'Engineer' });
  await setDoc(doc(db, 'userPrivate', OTHER), { hourlyRate: 999 });
  await setDoc(doc(db, 'userPrivate', ME), { hourlyRate: 240 });
  await setDoc(doc(db, 'publicStats', OTHER), { uid: OTHER, month: '2026-09', daysPresent: 3 });
  await setDoc(doc(db, 'attendance', `${OTHER}_2026-09-01`), { userId: OTHER, salary: 1920, hours: '8.00' });
  await setDoc(doc(db, 'attendance', `${ME}_2026-09-01`), { userId: ME, salary: 1920, hours: '8.00' });
});

const me = testEnv.authenticatedContext(ME).firestore();
const anon = testEnv.unauthenticatedContext().firestore();

const results = [];
const check = async (name, promise) => {
  try { await promise; results.push([true, name]); }
  catch (e) { results.push([false, name + ' :: ' + e.message]); }
};

// --- the boundary Step 15 cares about --------------------------------------
await check("DENY  read another user's pay data",
  assertFails(getDoc(doc(me, 'userPrivate', OTHER))));
await check("DENY  read another user's attendance (carries salary)",
  assertFails(getDoc(doc(me, 'attendance', `${OTHER}_2026-09-01`))));
await check('DENY  unfiltered attendance query',
  assertFails(getDocs(query(collection(me, 'attendance')))));
await check("DENY  query another user's attendance",
  assertFails(getDocs(query(collection(me, 'attendance'), where('userId', '==', OTHER)))));
await check("DENY  write another user's profile",
  assertFails(setDoc(doc(me, 'users', OTHER), { name: 'hacked' })));
await check("DENY  write another user's publicStats",
  assertFails(setDoc(doc(me, 'publicStats', OTHER), { uid: OTHER, daysPresent: 99 })));
await check('DENY  create attendance owned by someone else',
  assertFails(setDoc(doc(me, 'attendance', `${OTHER}_2026-09-02`), { userId: OTHER })));
await check("DENY  delete another user's attendance",
  assertFails(deleteDoc(doc(me, 'attendance', `${OTHER}_2026-09-01`))));
await check('DENY  signed-out read of users',
  assertFails(getDoc(doc(anon, 'users', OTHER))));

// --- publicStats field guard: shape, not just ownership --------------------
const STATS_OK = {
  uid: ME, name: 'Me', month: '2026-09',
  daysPresent: 3, currentStreak: 2, lastMarked: '2026-09-03',
  updatedAt: serverTimestamp(),
};

await check('DENY  publicStats carrying a salary key',
  assertFails(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, salary: 1920 })));
await check('DENY  publicStats carrying an hours key',
  assertFails(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, hours: '8.00' })));
await check('DENY  publicStats carrying checkIn/checkOut',
  assertFails(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, checkIn: '08:30', checkOut: '17:30' })));
await check('DENY  publicStats carrying an unknown key',
  assertFails(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, hourlyRate: 240 })));
await check('ALLOW publicStats with exactly the seven permitted keys',
  assertSucceeds(setDoc(doc(me, 'publicStats', ME), STATS_OK)));
await check('ALLOW publicStats with a null currentStreak (non-current month)',
  assertSucceeds(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, month: '2026-08', currentStreak: null })));
await check('ALLOW publicStats with a null lastMarked (no days present)',
  assertSucceeds(setDoc(doc(me, 'publicStats', ME), { ...STATS_OK, daysPresent: 0, currentStreak: 0, lastMarked: null })));

// --- monthlyReports ownership ---------------------------------------------
await check("DENY  create monthlyReports with someone else's userId",
  assertFails(setDoc(doc(me, 'monthlyReports', 'r_other'), { userId: OTHER, month: '2026-09' })));
await check('ALLOW create own monthlyReports',
  assertSucceeds(setDoc(doc(me, 'monthlyReports', 'r_me'), { userId: ME, month: '2026-09' })));

// --- what must still work --------------------------------------------------
await check('ALLOW read own pay data',
  assertSucceeds(getDoc(doc(me, 'userPrivate', ME))));
await check("ALLOW read another user's public profile (team page)",
  assertSucceeds(getDoc(doc(me, 'users', OTHER))));
await check("ALLOW read another user's publicStats (team page)",
  assertSucceeds(getDoc(doc(me, 'publicStats', OTHER))));
await check('ALLOW own attendance query (as the Dashboard issues it)',
  assertSucceeds(getDocs(query(collection(me, 'attendance'), where('userId', '==', ME)))));
await check('ALLOW write own publicStats',
  assertSucceeds(setDoc(doc(me, 'publicStats', ME), { uid: ME, month: '2026-09', daysPresent: 1 })));
await check('ALLOW create own attendance',
  assertSucceeds(setDoc(doc(me, 'attendance', `${ME}_2026-09-02`), { userId: ME, salary: 100 })));

await testEnv.cleanup();

let failed = 0;
for (const [ok, name] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
