// Verifies the privacy boundary of firestore.rules against the Firestore
// emulator. Run with:  npx firebase emulators:exec --only firestore "node scripts/testRules.mjs"
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
