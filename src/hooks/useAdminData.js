import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_RATES, isWeekendDateKey } from '../utils/payroll';

const pad = n => String(n).padStart(2, '0');

function monthKeyOf(monthDate) {
  return `${monthDate.getFullYear()}-${pad(monthDate.getMonth() + 1)}`;
}

/**
 * All staff attendance for one month, for the read-only admin dashboard.
 *
 * Pay split: weekday hours are paid at each person's own userPrivate rate
 * (the same field the Dashboard already uses), weekend hours at the single
 * org-wide weekend premium in settings/payroll (default in utils/payroll.js).
 * This reuses the existing per-user rate rather than introducing a new
 * weekday/weekend field pair - see admin plan Section 9.3.
 *
 * A permission error is surfaced, not swallowed into an empty list - for a
 * non-admin caller that would otherwise look identical to "no data".
 */
export function useAdminData(monthDate) {
  const monthKey = monthKeyOf(monthDate);
  const [state, setState] = useState({ staff: [], totals: null, rates: DEFAULT_RATES, loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const [usersSnap, privSnap, ratesSnap, attendanceSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'userPrivate')),
          getDoc(doc(db, 'settings', 'payroll')),
          getDocs(query(
            collection(db, 'attendance'),
            where('date', '>=', `${monthKey}-01`),
            where('date', '<=', `${monthKey}-31`)
          )),
        ]);
        if (cancelled) return;

        const rates = ratesSnap.exists()
          ? { ...DEFAULT_RATES, ...ratesSnap.data() }
          : DEFAULT_RATES;

        const rateByUid = {};
        privSnap.forEach(d => {
          rateByUid[d.id] = Number(d.data().hourlyRate ?? rates.weekdayRate);
        });

        const recordsByUid = {};
        attendanceSnap.forEach(d => {
          const r = d.data();
          if (!r.userId) return;
          (recordsByUid[r.userId] ??= []).push(r);
        });

        const staff = usersSnap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(u => u.role !== 'admin')
          .map(u => {
            const records = (recordsByUid[u.uid] || [])
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date));
            const weekdayRate = rateByUid[u.uid] ?? rates.weekdayRate;

            let daysPresent = 0;
            let weekdayHours = 0;
            let weekendHours = 0;

            for (const r of records) {
              const hours = Number(r.hours) || 0;
              if (r.status === 'Present' && hours > 0) {
                daysPresent++;
                if (isWeekendDateKey(r.date)) weekendHours += hours;
                else weekdayHours += hours;
              }
            }

            const totalHours = weekdayHours + weekendHours;
            const estPay = weekdayHours * weekdayRate + weekendHours * rates.weekendRate;

            return {
              uid: u.uid,
              name: u.name || 'Unnamed',
              jobTitle: u.jobTitle || '',
              avatar: u.avatar || null,
              weekdayRate,
              records,
              daysPresent,
              weekdayHours,
              weekendHours,
              totalHours,
              estPay,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        const totals = staff.reduce((acc, s) => ({
          staffCount: acc.staffCount + 1,
          daysPresent: acc.daysPresent + s.daysPresent,
          weekdayHours: acc.weekdayHours + s.weekdayHours,
          weekendHours: acc.weekendHours + s.weekendHours,
          totalHours: acc.totalHours + s.totalHours,
          estPay: acc.estPay + s.estPay,
        }), { staffCount: 0, daysPresent: 0, weekdayHours: 0, weekendHours: 0, totalHours: 0, estPay: 0 });

        setState({ staff, totals, rates, loading: false, error: null });
      } catch (e) {
        if (!cancelled) setState({ staff: [], totals: null, rates: DEFAULT_RATES, loading: false, error: e });
      }
    })();

    return () => { cancelled = true; };
  }, [monthKey, reloadToken]);

  return { ...state, monthKey, reload };
}
