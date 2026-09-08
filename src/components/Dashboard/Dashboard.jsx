import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import AvatarUpload from '../Layout/AvatarUpload';
import StatCard from './StatCard';
import TopAttendance from './TopAttendance';
import HoursChart from './HoursChart';
import MonthProgress from './MonthProgress';
// three.js is ~500 kB; loading it lazily keeps it out of the first paint
const RobotPanel = lazy(() => import('./RobotPanel'));
import { useTeam } from '../../hooks/useTeam';
import { computeMonthStats } from '../../utils/computeStats';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import {
  Clock,
  LogOut,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Users
} from 'lucide-react';

// Monthly target (160 hrs = standard month)
const HOURS_TARGET = 160;

const PRESETS = [
  ['08:30', '17:30', 'Full 08:30-17:30'],
  ['09:00', '18:00', 'Full 09:00-18:00'],
  ['08:30', '13:00', 'Half 08:30-13:00'],
  ['13:00', '17:30', 'Half 13:00-17:30'],
];

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Pay rate now comes from userPrivate/{uid} via AuthContext; the literal is
  // only a fallback for the first render before the profile resolves.
  const hourlyRate = user?.hourlyRate ?? 240;

  // Navigation states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  // Real-time time display
  const [timeString, setTimeString] = useState('');

  // Real-world current date key (YYYY-MM-DD)
  const [realDateKey, setRealDateKey] = useState('');
  // Check if today is the last day of the current month
  const [isLastDayOfMonth, setIsLastDayOfMonth] = useState(false);
  // Dismiss banner state (persisted per-session)
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return sessionStorage.getItem('attendance_cleanup_banner_dismissed') === 'true';
  });

  // Firestore data state
  const [firestoreLogs, setFirestoreLogs] = useState([]);

  // Selected date state (for editing side panel)
  const [selectedDay, setSelectedDay] = useState(null);

  // Input fields for editing
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('Present');
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Roster + presence for the middle panels
  const { ranked, byActivity, online, loading: teamLoading, error: teamError } = useTeam();

  // The record box keeps rendering the last day for the length of the close
  // animation; unmounting immediately would collapse it with no transition.
  const [renderedDay, setRenderedDay] = useState(null);

  // Time parsing and formatting normalization function
  const parseAndFormatTime = (inputStr, defaultVal = '08:30') => {
    if (!inputStr) return defaultVal;

    let clean = inputStr.trim().toLowerCase();

    // Check for AM/PM
    const isPM = clean.includes('pm');
    const isAM = clean.includes('am');

    // Remove am/pm and non-numeric/non-separator characters
    clean = clean.replace(/(am|pm)/g, '').trim();

    let hours = 0;
    let minutes = 0;

    // Try matching standard and informal typing formats
    const separatorMatch = clean.match(/^(\d{1,2})[\s\.:](\d{2})$/);
    const singleMinMatch = clean.match(/^(\d{1,2})[\s\.:](\d{1})$/);
    const pureDigitsMatch = clean.match(/^(\d{3,4})$/);
    const pureHoursMatch = clean.match(/^(\d{1,2})$/);

    if (separatorMatch) {
      hours = parseInt(separatorMatch[1], 10);
      minutes = parseInt(separatorMatch[2], 10);
    } else if (singleMinMatch) {
      hours = parseInt(singleMinMatch[1], 10);
      minutes = parseInt(singleMinMatch[2], 10) * 10;
    } else if (pureDigitsMatch) {
      const val = pureDigitsMatch[1];
      if (val.length === 3) {
        hours = parseInt(val.charAt(0), 10);
        minutes = parseInt(val.slice(1), 10);
      } else {
        hours = parseInt(val.slice(0, 2), 10);
        minutes = parseInt(val.slice(2), 10);
      }
    } else if (pureHoursMatch) {
      hours = parseInt(pureHoursMatch[1], 10);
      minutes = 0;
    } else {
      return defaultVal;
    }

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    if (isNaN(hours) || hours < 0 || hours > 23) hours = 8;
    if (isNaN(minutes) || minutes < 0 || minutes > 59) minutes = 0;

    const hStr = hours < 10 ? `0${hours}` : `${hours}`;
    const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

    return `${hStr}:${mStr}`;
  };

  const handleInBlur = () => {
    setInTime(prev => parseAndFormatTime(prev, '08:30'));
  };

  const handleOutBlur = () => {
    setOutTime(prev => parseAndFormatTime(prev, '17:30'));
  };

  // Helper to handle keyboard backspace / delete logic
  const handleTimeKeyDown = (e, setter, value) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;

    if (e.key === 'Backspace') {
      if (start !== end) return; // let default selection deletion work

      const parts = value.split(':');
      const h = parts[0] || '';
      const m = parts[1] || '';

      if (start > 2) {
        // Cursor is in minutes section (e.g. index 3, 4, 5)
        e.preventDefault();
        if (m.length > 0) {
          setter(h + ':');
          setTimeout(() => {
            e.target.setSelectionRange(3, 3);
          }, 0);
        } else {
          setter(':');
          setTimeout(() => {
            e.target.setSelectionRange(0, 0);
          }, 0);
        }
      } else {
        // Cursor is in hours section (e.g. index 0, 1, 2)
        e.preventDefault();
        setter(':' + m);
        setTimeout(() => {
          e.target.setSelectionRange(0, 0);
        }, 0);
      }
    } else if (e.key === 'Delete') {
      if (start !== end) return;
      if (start === 2) {
        // Protect the colon at index 2
        e.preventDefault();
      }
    }
  };

  // Helper to handle text typing and keep segments locked
  const handleTimeInputChange = (e, setter) => {
    const rawVal = e.target.value;
    const cursor = e.target.selectionStart;

    if (rawVal === '') {
      setter(':');
      setTimeout(() => {
        e.target.setSelectionRange(0, 0);
      }, 0);
      return;
    }

    // Keep only numbers and colons
    let clean = rawVal.replace(/[^\d:]/g, '');

    // Ensure there is at least one colon
    if (!clean.includes(':')) {
      if (clean.length === 1) {
        clean = clean + ':';
      } else if (clean.length >= 2) {
        clean = clean.slice(0, 2) + ':' + clean.slice(2);
      }
    }

    // Split hours and minutes
    const parts = clean.split(':');
    let hours = parts[0] || '';
    let minutes = parts[1] || '';

    // Limit each segment to max 2 digits
    hours = hours.slice(0, 2);
    minutes = minutes.slice(0, 2);

    const formatted = `${hours}:${minutes}`;
    setter(formatted);

    // Calculate correct cursor position
    let newCursor = cursor;

    // Cap cursor if it exceeds the formatted string length
    if (newCursor > formatted.length) {
      newCursor = formatted.length;
    }

    // If typing extra digits in hours (e.g. "129:34"), cap cursor at 2
    if (parts[0].length > 2 && cursor === 3) {
      newCursor = 2;
    }

    // If typing extra digits in minutes (e.g. "12:349"), cap cursor at 5
    if (parts[1] && parts[1].length > 2 && cursor === 6) {
      newCursor = 5;
    }

    setTimeout(() => {
      e.target.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleInTimeChange = (e) => {
    handleTimeInputChange(e, setInTime);
  };

  const handleOutTimeChange = (e) => {
    handleTimeInputChange(e, setOutTime);
  };

  // Month Names Array
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to determine day of the week name
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDaysHeader = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Update digital live clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));

      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      setRealDateKey(`${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if today is the last day of the current month OR the 1st day of the next month (+24h extended download period)
  useEffect(() => {
    if (!realDateKey) return;
    const now = new Date();
    const day = now.getDate();
    const lastDayOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    setIsLastDayOfMonth(day === lastDayOfThisMonth || day === 1);
  }, [realDateKey]);

  // Listen to attendance logs in real-time from Firestore for the logged-in user
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray = [];
      snapshot.forEach((doc) => {
        logsArray.push({ id: doc.id, ...doc.data() });
      });
      setFirestoreLogs(logsArray);
    }, (error) => {
      console.error("Error listening to attendance logs:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Automatically clean up database logs from previous months when the real-world month changes
  useEffect(() => {
    if (!user?.uid || firestoreLogs.length === 0 || !realDateKey) return;

    const [currentYearStr, currentMonthStr] = realDateKey.split('-');

    // First day of the current real-world month
    const startOfCurrentMonthKey = `${currentYearStr}-${currentMonthStr}-01`;

    // Filter logs that are older than the current month
    const oldLogs = firestoreLogs.filter(log => log.date && log.date < startOfCurrentMonthKey);

    if (oldLogs.length > 0) {
      console.log(`Cleaning up ${oldLogs.length} old logs from previous months...`);
      oldLogs.forEach(async (oldLog) => {
        const docId = oldLog.id || `${user.uid}_${oldLog.date}`;
        try {
          await deleteDoc(doc(db, 'attendance', docId));
          console.log(`Successfully cleaned up old log: ${docId}`);
        } catch (e) {
          console.error(`Failed to delete old log ${docId}:`, e);
        }
      });
    }
  }, [firestoreLogs, user?.uid, realDateKey]);

  // Helper to get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysCount = getDaysInMonth(currentMonth, currentYear);

  // Compile full days list for the month (including week labels and weekend marks)
  const compileDaysList = () => {
    const list = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dayOfWeekNum = dateObj.getDay(); // 0 is Sun, 6 is Sat
      const dayOfWeekName = dayNames[dayOfWeekNum];
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;

      // Format date key to match document lookup e.g. "2026-05-01"
      const mStr = currentMonth + 1 < 10 ? `0${currentMonth + 1}` : currentMonth + 1;
      const dStr = d < 10 ? `0${d}` : d;
      const dateKey = `${currentYear}-${mStr}-${dStr}`;

      // Search matching firestore log
      const matched = firestoreLogs.find(log => log.date === dateKey);

      list.push({
        dateKey,
        dateNum: d,
        dayOfWeek: dayOfWeekName,
        isWeekend,
        // A logged record always wins; the weekend label is only the default
        // for a day with nothing recorded against it.
        status: matched ? (matched.status || 'Present') : (isWeekend ? 'Weekend' : 'Absent'),
        checkIn: matched?.checkIn || '',
        checkOut: matched?.checkOut || '',
        hours: matched?.hours || '0.00',
        salary: matched?.salary || 0,
        reason: matched?.reason || '',
        docId: matched?.id || null
      });
    }
    return list;
  };

  const daysList = compileDaysList();

  // Excel decimal duration and salary calculation
  const calculateHoursAndSalary = (inStr, outStr) => {
    if (!inStr || !outStr) return { hours: '0.00', salary: 0 };

    try {
      // Parse/normalize input strings in real-time
      const inNormalized = parseAndFormatTime(inStr, '08:30');
      const outNormalized = parseAndFormatTime(outStr, '17:30');

      const [inH, inM] = inNormalized.split(':').map(Number);
      const [outH, outM] = outNormalized.split(':').map(Number);

      let diffH = outH - inH;
      let diffM = outM - inM;

      if (diffM < 0) {
        diffH -= 1;
        diffM += 60;
      }

      // Hours formatted as standard decimal placeholder to match the spreadsheet format (e.g. 9h 30m -> 9.30)
      const hoursDecimal = diffH + (diffM / 100);
      const salaryVal = hoursDecimal * hourlyRate;

      return {
        hours: hoursDecimal.toFixed(2),
        salary: parseFloat(salaryVal.toFixed(2))
      };
    } catch (e) {
      return { hours: '0.00', salary: 0 };
    }
  };

  useEffect(() => {
    if (selectedDay) {
      setRenderedDay(selectedDay);
      return;
    }
    // Matches the 0.38s grid-template-rows transition in index.css
    const timer = setTimeout(() => setRenderedDay(null), 400);
    return () => clearTimeout(timer);
  }, [selectedDay]);

  // Auto-dismiss dashboard alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Selecting a day on the calendar
  const handleSelectDay = (day) => {
    setSelectedDay(day);
    const isDayOff = day.status === 'Day Off';
    setStatus(isDayOff ? 'Day Off' : 'Present');
    setInTime(isDayOff ? '' : (day.checkIn || '08:30'));
    setOutTime(isDayOff ? '' : (day.checkOut || '17:30')); // default out is 17:30
    setReason(day.reason || '');

    // Smooth scroll into view for the attendance record box section
    setTimeout(() => {
      const editorPanel = document.getElementById('attendance-editor-panel');
      if (editorPanel) {
        editorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 80);
  };

  // Saving attendance document to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;
    setIsSaving(true);

    const isDayOff = status === 'Day Off';
    const cleanIn = isDayOff ? '' : parseAndFormatTime(inTime, '08:30');
    const cleanOut = isDayOff ? '' : parseAndFormatTime(outTime, '17:30');
    const { hours, salary } = isDayOff ? { hours: '0.00', salary: 0 } : calculateHoursAndSalary(cleanIn, cleanOut);

    const docName = `${user.uid}_${selectedDay.dateKey}`;
    const payload = {
      userId: user.uid,
      date: selectedDay.dateKey,
      dayOfWeek: selectedDay.dayOfWeek,
      checkIn: cleanIn,
      checkOut: cleanOut,
      hours: hours,
      salary: salary,
      reason: reason,
      status: status,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'attendance', docName), payload);
      await publishStats(payload);
      setIsSaving(false);
      setSelectedDay(null);
      setAlert({
        type: 'success',
        message: `Successfully saved log for ${selectedDay.dateNum} ${monthNames[currentMonth]}.`
      });
    } catch (error) {
      console.error("Error writing document to Firestore:", error);
      setIsSaving(false);
      setAlert({
        type: 'error',
        message: `Failed to save log: ${error.message || 'Permission denied or connection issue.'}`
      });
    }
  };

  // Publish the shareable, non-sensitive slice of this month's attendance.
  // Always recomputed from the full record set, so a retry or a double save
  // cannot inflate the counts. Never includes times, hours or salary.
  const publishStats = async (savedRecord) => {
    if (!user?.uid) return;
    const monthKey = format(new Date(), 'yyyy-MM');
    const records = [
      ...firestoreLogs.filter(r => r.date !== savedRecord.date),
      savedRecord
    ];
    const stats = computeMonthStats(records, monthKey);

    try {
      await setDoc(doc(db, 'publicStats', user.uid), {
        uid: user.uid,
        name: user.name,
        month: monthKey,
        ...stats,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      // Never let a stats failure surface as a failed attendance save
      console.error('Failed to publish public stats:', error);
    }
  };

  // Delete attendance document
  const handleDelete = async () => {
    if (!selectedDay) return;
    setIsSaving(true);
    const docId = selectedDay.docId || `${user.uid}_${selectedDay.dateKey}`;
    try {
      await deleteDoc(doc(db, 'attendance', docId));
      await publishStats({ date: selectedDay.dateKey, status: 'Absent', hours: '0.00' });
      setIsSaving(false);
      setSelectedDay(null);
      setAlert({
        type: 'success',
        message: `Successfully deleted log for ${selectedDay.dateNum} ${monthNames[currentMonth]}.`
      });
    } catch (error) {
      console.error("Error deleting document from Firestore:", error);
      setIsSaving(false);
      setAlert({
        type: 'error',
        message: `Failed to delete log: ${error.message || 'Permission denied. Please check your Firestore Security Rules.'}`
      });
    }
  };

  // Calculate Aggregates
  const totalWorkedDays = daysList.filter(d => d.status === 'Present').length;
  const totalWorkedMinutes = daysList.reduce((acc, d) => acc + (d.hours !== '0.00' ? parseFloat(d.hours) * 60 : 0), 0);
  const totalHoursDecimal = daysList.reduce((acc, d) => acc + (d.hours !== '0.00' ? parseFloat(d.hours) : 0), 0).toFixed(2);
  const totalSalary = daysList.reduce((acc, d) => acc + d.salary, 0);

  const salaryGoal = HOURS_TARGET * hourlyRate; // goal: 160 hrs at the user's rate

  // Working days in the displayed month, and how many have already passed.
  // For a month other than the live one every working day counts as elapsed.
  // Weekdays, plus any weekend day the user actually logged.
  const workingDays = daysList.filter(d => !d.isWeekend || d.status === 'Present');
  const workingDaysInMonth = workingDays.length;
  const workingDaysElapsed = workingDays.filter(
    d => !realDateKey || d.dateKey <= realDateKey
  ).length;
  const attendanceRate = workingDaysElapsed > 0
    ? Math.min((totalWorkedDays / workingDaysElapsed) * 100, 100)
    : 0;

  // Streak is null for any month that isn't the current one — see computeStats
  const viewMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentStreak = computeMonthStats(firestoreLogs, viewMonthKey).currentStreak ?? 0;

  // Handle downloading sheet and recording export to monthlyReports collection
  const handleExportExcel = async () => {
    // Only the displayed month's records; the generator lays them out by week.
    const monthRecords = firestoreLogs.filter(
      l => typeof l.date === 'string' && l.date.startsWith(viewMonthKey)
    );

    try {
      // ExcelJS is ~900 kB; importing it on click keeps it out of first paint.
      const { generateTimesheet } = await import('../../utils/generateTimesheet');
      await generateTimesheet(new Date(currentYear, currentMonth, 1), monthRecords, user);
    } catch (err) {
      console.error('Timesheet export failed:', err);
      setAlert({ type: 'error', message: 'Could not build the timesheet. Please try again.' });
      return; // don't record a download that never happened
    }

    if (user?.uid) {
      try {
        const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        await setDoc(doc(db, 'monthlyReports', `${user.uid}_${monthKey}`), {
          userId: user.uid,
          month: monthKey,
          format: 'xlsx',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to track monthly report export:", err);
      }
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // ---- Week helpers -------------------------------------------------------
  const dayKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const mondayOf = (ref) => {
    const dow = ref.getDay();                 // 0 Sun .. 6 Sat
    const backToMonday = dow === 0 ? -6 : 1 - dow;
    return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + backToMonday);
  };

  const buildWeek = (start) =>
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const match = firestoreLogs.find(l => l.date === dayKey(d));
      const hours = match ? (parseFloat(match.hours) || 0) : 0;
      return { label, value: hours, regular: Math.min(hours, 8), overtime: Math.max(hours - 8, 0) };
    });

  const nowRef = new Date();
  const thisMonday = mondayOf(nowRef);
  const lastMonday = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() - 7);

  const weekData = buildWeek(thisMonday);
  const lastWeekData = buildWeek(lastMonday);
  const weekTotal = weekData.reduce((a, d) => a + d.value, 0);
  const lastWeekTotal = lastWeekData.reduce((a, d) => a + d.value, 0);
  const todayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][nowRef.getDay()];

  // ---- Month pace ---------------------------------------------------------
  const monthLogs = firestoreLogs.filter(l => typeof l.date === 'string' && l.date.startsWith(viewMonthKey));

  const overtimeHours = monthLogs.reduce(
    (a, l) => a + Math.max((parseFloat(l.hours) || 0) - 8, 0), 0
  );

  const avgDayLength = totalWorkedDays > 0
    ? parseFloat(totalHoursDecimal) / totalWorkedDays
    : 0;

  // Mean check-in across the month, as a punctuality read-out.
  const avgStartTime = (() => {
    const mins = monthLogs
      .filter(l => typeof l.checkIn === 'string' && l.checkIn.includes(':'))
      .map(l => {
        const [h, m] = l.checkIn.split(':').map(Number);
        return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
      })
      .filter(v => v !== null);
    if (mins.length === 0) return null;
    const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
  })();

  const headerDate = nowRef.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', weekday: 'long',
  });

  // The calendar grid runs Monday-first, while getDay() is Sunday-first.
  // Calendar grid built with date-fns rather than hand-rolled offsets. The
  // previous code converted the first-of-month weekday twice - once in
  // getStartDayOfWeek and again at render - which shifted every date one
  // column. eachDayOfInterval over whole weeks cannot drift.
  const monthStart = startOfMonth(new Date(currentYear, currentMonth, 1));
  const calendarCells = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),   // 0 = Sunday
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
  });

  // Look-up so a grid cell can find its attendance row by date key.
  const dayByKey = Object.fromEntries(daysList.map(d => [d.dateKey, d]));

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-canvas text-ink">

      {/* Toast */}
      {alert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
            alert.type === 'error'
              ? 'bg-surface border-danger/40'
              : 'bg-surface border-mint/40'
          }`}>
            {alert.type === 'error'
              ? <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              : <CheckCircle2 className="w-5 h-5 text-mint-deep shrink-0 mt-0.5" />}
            <div className="flex-1 text-left">
              <h4 className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${alert.type === 'error' ? 'text-danger' : 'text-mint-deep'}`}>
                {alert.type === 'error' ? 'Error' : 'Success'}
              </h4>
              <p className="text-xs text-ink-soft leading-relaxed">{alert.message}</p>
            </div>
            <button onClick={() => setAlert(null)} className="p-1 rounded-lg text-muted hover:text-ink cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------- HEADER ------------------------------- */}
      <header className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">{headerDate}</h1>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/team"
            title="My team"
            className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center
                       text-ink-soft hover:text-ink hover:bg-raised transition-colors"
          >
            <Users className="w-4 h-4" />
          </Link>


          <div className="flex items-center gap-2.5 pl-1">
            <AvatarUpload size={36} />
            <div className="hidden sm:block leading-tight">
              <p className="text-[13px] font-medium text-ink truncate max-w-[140px]">{user?.name || 'User'}</p>
              <p className="text-[11px] text-muted truncate max-w-[140px]">{user?.jobTitle || 'Staff'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center
                       text-ink-soft hover:text-danger hover:bg-raised transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ---------------------------- SCROLL AREA ---------------------------- */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-5">

        {/* Month-end cleanup warning */}
        {isLastDayOfMonth && !isBannerDismissed && (
          <div className="bg-surface border border-amber/30 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-ink">Last day of the month</h4>
                <p className="text-[11px] text-ink-soft mt-0.5">
                  This month&apos;s records clear at midnight. Download your sheet before then.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mint text-mint-ink text-[11px] font-semibold
                           hover:bg-mint-deep transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Download sheet
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('attendance_cleanup_banner_dismissed', 'true');
                  setIsBannerDismissed(true);
                }}
                className="p-2 rounded-xl text-muted hover:text-ink hover:bg-raised transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ============================ LEFT ============================ */}
          <div className="lg:col-span-8 space-y-5">

            {/* Metric row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <StatCard
                tone={1}
                label="Total worked days"
                value={totalWorkedDays}
                delta={workingDaysElapsed > 0 ? `of ${workingDaysElapsed} so far` : 'no days elapsed'}
              />
              <StatCard
                tone={2}
                label="Monthly hours"
                value={totalHoursDecimal}
                unit="hrs"
                delta={`${Math.max(HOURS_TARGET - parseFloat(totalHoursDecimal), 0).toFixed(1)} to target`}
              />
              <StatCard
                tone={3}
                label="Total earnings"
                value={`Rs. ${totalSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                delta={currentStreak > 0 ? `${currentStreak} day streak` : `Rs. ${hourlyRate}/hr`}
              />
            </div>

            {/* Charts side by side, directly under the metric row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <HoursChart
                data={weekData}
                weekTotal={weekTotal}
                lastWeekTotal={lastWeekTotal}
                todayLabel={todayLabel}
              />
              <MonthProgress
                hoursLogged={parseFloat(totalHoursDecimal)}
                target={HOURS_TARGET}
                workingDaysElapsed={workingDaysElapsed}
                workingDaysInMonth={workingDaysInMonth}
                avgDayLength={avgDayLength}
                avgStartTime={avgStartTime}
                overtimeHours={overtimeHours}
                monthLabel={`${monthNames[currentMonth]} ${currentYear}`}
              />
            </div>

            {/* Roster sits at the bottom of the column */}
            <TopAttendance
              ranked={ranked}
              loading={teamLoading}
              error={teamError}
              currentUid={user?.uid}
              workingDaysElapsed={workingDaysElapsed}
              monthLabel={monthNames[currentMonth]}
            />
          </div>

          {/* ============================ RIGHT ============================ */}
          <div className="lg:col-span-4 space-y-5">

            {/* Assistant sits at the top of the column */}
            <Suspense
              fallback={<div className="rounded-3xl bg-surface border border-line h-[188px] animate-pulse" />}
            >
              <RobotPanel onlineCount={online.length} teamCount={byActivity.length} />
            </Suspense>

            {/* Calendar — compact box, generous day circles */}
            <div className="bg-surface border border-line rounded-3xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-ink tracking-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="w-7 h-7 rounded-full bg-raised border border-line text-ink flex items-center justify-center
                               hover:bg-line transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="w-7 h-7 rounded-full bg-raised border border-line text-ink flex items-center justify-center
                               hover:bg-line transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-x-1 gap-y-1 mb-1 text-center text-[11px] text-muted">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={`${d}-${i}`}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-x-1 gap-y-1 justify-items-center">
                {calendarCells.map((cellDate) => {
                  const key = format(cellDate, 'yyyy-MM-dd');
                  const day = dayByKey[key];

                  // Cells outside the displayed month are dimmed and inert.
                  if (!day) {
                    return (
                      <span
                        key={key}
                        className="w-10 h-10 flex items-center justify-center text-[13px] text-muted/40 select-none"
                      >
                        {cellDate.getDate()}
                      </span>
                    );
                  }

                  const worked = day.hours !== '0.00' || day.status === 'Present';
                  const isToday = day.dateKey === realDateKey;
                  const isSelected = selectedDay && selectedDay.dateKey === day.dateKey;

                  // Any past day with nothing logged and no day-off marker.
                  // Future days stay neutral - flagging them would be noise.
                  const missed =
                    !worked &&
                    day.status !== 'Day Off' &&
                    !!realDateKey &&
                    day.dateKey <= realDateKey;

                  // Fill = state. Green for a logged day, red for a missed one.
                  // Today and selection are rings layered on top so they never
                  // hide the underlying state.
                  let cls = 'text-ink hover:bg-raised';
                  if (day.isWeekend) cls = 'text-ink-soft hover:bg-raised';
                  if (worked) cls = 'bg-mint text-mint-ink font-semibold hover:opacity-90';
                  if (missed) cls = 'bg-danger text-canvas font-semibold hover:opacity-90';
                  if (isToday) cls += ' ring-2 ring-azure ring-offset-2 ring-offset-surface';
                  if (isSelected) cls += ' ring-2 ring-ink ring-offset-2 ring-offset-surface';

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectDay(day)}
                      title={`${format(cellDate, 'EEEE d MMMM yyyy')} — ${day.status}${missed ? ' (not logged)' : ''}`}
                      className={`w-10 h-10 rounded-full flex items-center justify-center
                                  text-[13px] transition-colors cursor-pointer relative ${cls}`}
                    >
                      {day.dateNum}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line">
                <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                  <span className="w-2.5 h-2.5 rounded-full bg-mint" /> Logged
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Missed
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-azure ring-inset" /> Today
                </span>
              </div>

              {/* Export lives with the month it exports */}
              <button
                onClick={handleExportExcel}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                           bg-mint text-mint-ink text-[11px] font-semibold hover:bg-mint-deep
                           transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Download .xls
              </button>
            </div>

            {/* Record editor — expands under the calendar */}
            <div
              id="attendance-editor-panel"
              className={`record-collapse ${selectedDay ? 'is-open' : ''}`}
            >
              <div className="record-collapse-inner">
                {renderedDay && (
                  <div className="bg-surface border border-line rounded-3xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-semibold text-ink">
                          {renderedDay.dateNum} {monthNames[currentMonth]} {currentYear}
                        </h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          {renderedDay.dayOfWeek}day · {renderedDay.isWeekend ? 'Weekend' : 'Working day'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedDay(null)}
                        aria-label="Close record"
                        className="w-8 h-8 rounded-full bg-raised border border-line text-ink-soft
                                   flex items-center justify-center hover:bg-line transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-raised rounded-2xl border border-line">
                        <div className="text-left">
                          <label className="text-xs font-medium text-ink block">Day off</label>
                          <p className="text-[10px] text-muted">Mark as a non-working day</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = status === 'Day Off' ? 'Present' : 'Day Off';
                            setStatus(next);
                            if (next === 'Day Off') { setInTime(''); setOutTime(''); }
                            else { setInTime('08:30'); setOutTime('17:30'); }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors
                                      ${status === 'Day Off' ? 'bg-azure' : 'bg-line-strong'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 mt-0.5 transform rounded-full bg-white
                                            transition duration-200 ${status === 'Day Off' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>

                      <div className={`space-y-4 transition-opacity ${status === 'Day Off' ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-muted uppercase tracking-wider block">In</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={inTime}
                                onChange={handleInTimeChange}
                                onKeyDown={(e) => handleTimeKeyDown(e, setInTime, inTime)}
                                onBlur={handleInBlur}
                                placeholder="08:30"
                                disabled={status === 'Day Off'}
                                className="w-full px-3 py-2 rounded-xl bg-raised border border-line text-ink text-xs font-mono
                                           focus:outline-none focus:border-mint transition-colors pr-8"
                              />
                              <Clock className="w-3.5 h-3.5 text-muted absolute right-3 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-medium text-muted uppercase tracking-wider block">Out</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={outTime}
                                onChange={handleOutTimeChange}
                                onKeyDown={(e) => handleTimeKeyDown(e, setOutTime, outTime)}
                                onBlur={handleOutBlur}
                                placeholder="17:30"
                                disabled={status === 'Day Off'}
                                className="w-full px-3 py-2 rounded-xl bg-raised border border-line text-ink text-xs font-mono
                                           focus:outline-none focus:border-mint transition-colors pr-8"
                              />
                              <Clock className="w-3.5 h-3.5 text-muted absolute right-3 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {PRESETS.map(([pIn, pOut, label]) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => { setInTime(pIn); setOutTime(pOut); }}
                              disabled={status === 'Day Off'}
                              className="py-2 px-1.5 rounded-xl bg-raised border border-line text-[10px] text-ink-soft
                                         hover:border-mint hover:text-mint transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted uppercase tracking-wider block">
                          {status === 'Day Off' ? 'Reason' : 'Task info'}
                        </label>
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={status === 'Day Off' ? 'e.g. Personal holiday' : 'e.g. Web development'}
                          className="w-full px-3 py-2.5 rounded-xl bg-raised border border-line text-ink text-xs
                                     focus:outline-none focus:border-mint transition-colors"
                        />
                      </div>

                      <div className="p-3 bg-raised rounded-2xl border border-line text-xs space-y-2">
                        <div className="flex justify-between text-ink-soft">
                          <span>Hours</span>
                          <span className="font-mono font-semibold text-ink">
                            {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).hours : '0.00')}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-soft border-t border-line pt-2">
                          <span>Day pay</span>
                          <span className="font-mono font-semibold text-mint-deep">
                            Rs. {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 py-2.5 rounded-xl bg-mint text-mint-ink text-xs font-semibold
                                     hover:bg-mint-deep transition-colors cursor-pointer disabled:opacity-50
                                     flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Saving...' : 'Save record'}
                        </button>

                        {(renderedDay.docId || renderedDay.checkIn || renderedDay.checkOut || renderedDay.status === 'Day Off') && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isSaving}
                            title="Delete record"
                            className="w-11 rounded-xl bg-raised border border-line text-danger
                                       flex items-center justify-center hover:bg-line transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
