const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// This project never stored hourlyRate in Firestore — it was hardcoded in the
// Dashboard. So this migration seeds it into userPrivate/{uid} at the previous
// hardcoded value, keeping behaviour identical, and moves the job title out of
// `role` so `role` can mean an access level.
const DEFAULT_HOURLY_RATE = 240;

(async () => {
  const snap = await db.collection('users').get();
  let changed = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;

    // --- private: hourly rate -------------------------------------------
    const privRef = db.collection('userPrivate').doc(uid);
    const priv = await privRef.get();

    if (priv.exists && priv.data().hourlyRate !== undefined) {
      console.log('skip rate (already set):', data.email || uid);
    } else {
      // Prefer a rate already sitting on the public doc, else the old default.
      const rate = data.hourlyRate === undefined
        ? DEFAULT_HOURLY_RATE
        : Number(data.hourlyRate);
      await privRef.set({ hourlyRate: rate }, { merge: true });
      console.log('rate  →', data.email || uid, '=', rate);
      changed++;
    }

    // --- public: strip rate, split role/jobTitle -------------------------
    const update = {};
    if (data.hourlyRate !== undefined) update.hourlyRate = FieldValue.delete();
    if (data.jobTitle === undefined) {
      update.jobTitle = data.role || 'Software Engineer';
    }
    if (data.role !== 'staff') update.role = 'staff';

    if (Object.keys(update).length > 0) {
      await docSnap.ref.update(update);
      console.log('users →', data.email || uid, JSON.stringify(update));
      changed++;
    }
  }

  console.log(`\nDone — ${snap.size} document(s) checked, ${changed} write(s).`);
  process.exit(0);
})();
