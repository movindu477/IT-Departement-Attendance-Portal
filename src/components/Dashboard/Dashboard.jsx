import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { exportSalarySheetToExcel } from '../../utils/reportUtils';
import AvatarUpload from '../Layout/AvatarUpload';
import logo from '../../assets/images/logo.png';
import StatWidgets from './StatWidgets';
import TopAttendance from './TopAttendance';
import TeamStatus from './TeamStatus';
// three.js is ~500 kB; loading it lazily keeps it out of the first paint
const RobotPanel = lazy(() => import('./RobotPanel'));
import { useTeam } from '../../hooks/useTeam';
import { computeMonthStats } from '../../utils/computeStats';
import { format } from 'date-fns';
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

  const getStartDayOfWeek = (month, year) => {
    // Convert to Monday-first convention (0 is Mon, 6 is Sun) matching the modern UI reference
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const daysCount = getDaysInMonth(currentMonth, currentYear);
  const startOffset = getStartDayOfWeek(currentMonth, currentYear);

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
        status: isWeekend ? 'Weekend' : (matched ? matched.status || 'Present' : 'Absent'),
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
  const workingDays = daysList.filter(d => !d.isWeekend);
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
    exportSalarySheetToExcel(daysList, monthNames[currentMonth], currentYear);
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

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-canvas text-ink">

      {/* Toast Alert Notification */}
      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-xl shadow-xl border ${alert.type === 'error'
            ? 'bg-accent-soft border-l-4 border-accent border-y-accent/20 border-r-accent/20 text-ink card-soft'
            : 'bg-mint border-l-4 border-brand border-y-brand/20 border-r-brand/20 text-ink card-soft'
            }`}>
            {alert.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-left">
              <h4 className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${alert.type === 'error' ? 'text-accent' : 'text-brand'}`}>
                {alert.type === 'error' ? 'Error' : 'Success'}
              </h4>
              <p className="text-xs text-ink/90 font-light leading-relaxed">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${alert.type === 'error'
                ? 'text-accent hover:bg-accent-soft hover:text-accent'
                : 'text-brand hover:bg-brand/10 hover:text-brand-ink'
                }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="relative h-16 shrink-0 bg-surface border-b border-line px-4 sm:px-6 flex justify-between items-center gap-4 z-10">

        {/* Profile badge & Date/Time display on the left */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 z-10">
          <AvatarUpload size={38} />
          <div className="min-w-0 hidden sm:block">
            <h4 className="text-sm font-bold text-ink truncate leading-tight">{user?.name || 'User'}</h4>
          </div>

          {/* Exact Local Date/Time display next to profile */}
          <div className="hidden md:flex items-center gap-2 text-ink-soft font-mono text-xs font-semibold bg-subtle border border-line/70 py-1.5 px-3 rounded-full">
            <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
            <span className="text-ink-soft select-none tracking-tight truncate">{timeString || 'Loading clock...'}</span>
          </div>
        </div>

        {/* Top Center: Logo Image */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <img src={logo} alt="Logo" className="h-11 sm:h-12 md:h-13 w-auto object-contain transition-transform duration-200 hover:scale-105" />
        </div>

        {/* Right: Team and Logout actions */}
        <div className="flex items-center gap-1 shrink-0 z-10">
          <Link
            to="/team"
            className="p-2 text-muted hover:text-brand hover:bg-subtle rounded-lg transition-colors cursor-pointer"
            title="My Team"
          >
            <Users className="w-4 h-4" />
          </Link>
          <button
            onClick={logout}
            className="p-2 text-muted hover:text-accent hover:bg-subtle rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* VIEWPORT SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Warning Banner on the Last Day & Extended 1-Day Download Window */}
        {isLastDayOfMonth && !isBannerDismissed && (
          <div className="bg-gradient-to-r from-amber-500/12 via-amber-500/5 to-surface border border-amber-500/30 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/100/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-sm font-bold text-ink tracking-tight flex flex-wrap items-center gap-2">
                  Monthly Cleanup — 1-Day Extended Download Window Active
                  <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500/100/20 text-amber-300 rounded-full border border-amber-500/30">
                    Extended +24h Window
                  </span>
                </h4>
                <p className="text-xs text-ink-soft leading-relaxed font-normal">
                  The data export period has been extended by an extra day. Please ensure all your work is logged and download your final Attendance Sheet (.xlsx) before the extended cleanup deadline.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-xs font-bold bg-[#111827] hover:bg-black text-white shadow-sm transition-all cursor-pointer w-full md:w-auto shrink-0 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                Download Sheet (.xlsx)
              </button>
              <button
                onClick={() => {
                  setIsBannerDismissed(true);
                  sessionStorage.setItem('attendance_cleanup_banner_dismissed', 'true');
                }}
                className="p-2 text-muted hover:text-ink-soft bg-subtle hover:bg-line rounded-full transition-all cursor-pointer shrink-0"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= THREE COLUMN WORKSPACE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">

          {/* ---------- LEFT: CALENDAR + SMOOTH RECORD BOX ---------- */}
          <div className="lg:col-span-4 space-y-5">

            {/* Modern UpGradely-style Calendar Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center gap-3 mb-6">
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Attendance Calendar</h3>
                </div>

                {/* Modern dark capsule pill selector */}
                <div className="flex items-center gap-1.5 bg-black hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all shrink-0">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer" title="Previous month">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[80px] text-center select-none font-medium">
                    {monthNames[currentMonth].slice(0, 3)} {currentYear}
                  </span>
                  <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer" title="Next month">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Days labels (Monday first matching modern standard) */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-3 text-center text-xs font-semibold text-slate-700">
                {weekDaysHeader.map(d => (
                  <div key={d} className="py-0.5">{d}</div>
                ))}
              </div>

              {/* Calendar grid circular status cells matching reference design */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square flex items-center justify-center p-0.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-slate-50/50" />
                  </div>
                ))}

                {daysList.map((day) => {
                  const hasHours = day.hours !== '0.00';
                  const isToday = day.dateKey === realDateKey;
                  const isSelected = selectedDay && selectedDay.dateKey === day.dateKey;

                  let circleStyle = 'bg-slate-50/80 border border-slate-200/80 text-slate-700 hover:bg-slate-100 shadow-2xs';
                  let content = (
                    <span className="text-xs font-bold leading-none">{day.dateNum}</span>
                  );

                  if (day.status === 'Day Off') {
                    circleStyle = 'bg-[#ff6947] hover:bg-[#f85936] text-white shadow-xs';
                    content = (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-white/80 leading-none">{day.dateNum}</span>
                        <span className="text-xs font-black text-white leading-none mt-0.5">✕</span>
                      </div>
                    );
                  } else if (day.isWeekend) {
                    circleStyle = 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-600';
                    content = (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-semibold text-slate-400 leading-none">{day.dateNum}</span>
                        <span className="text-xs font-bold text-slate-600 leading-none mt-0.5">✕</span>
                      </div>
                    );
                  } else if (hasHours || day.status === 'Present') {
                    circleStyle = 'bg-[#b4f481] hover:bg-[#a6eb70] text-slate-950 shadow-xs';
                    content = (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[8px] font-extrabold text-slate-900/80 leading-none">{day.dateNum}</span>
                        <span className="text-xs font-black text-slate-950 leading-none mt-0.5">✓</span>
                      </div>
                    );
                  }

                  if (isSelected) {
                    circleStyle += ' ring-2 ring-black ring-offset-2 scale-105 shadow-md';
                  }

                  return (
                    <div key={day.dateKey} className="aspect-square flex items-center justify-center p-0.5">
                      <button
                        onClick={() => handleSelectDay(day)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer relative ${circleStyle}`}
                        title={`${day.dateNum} ${monthNames[currentMonth]} ${currentYear} (${day.status})`}
                      >
                        {content}

                        {isToday && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Modern Legend */}
              <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 flex-wrap text-xs font-medium select-none justify-center sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#b4f481] flex items-center justify-center text-[7px] font-black text-slate-950">✓</span>
                  <span className="text-slate-700 font-semibold text-[11px]">Present / Worked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[7px] font-bold text-slate-600">✕</span>
                  <span className="text-slate-500 font-semibold text-[11px]">Weekend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff6947] flex items-center justify-center text-[7px] font-black text-white">✕</span>
                  <span className="text-slate-500 font-semibold text-[11px]">Day Off</span>
                </div>
              </div>

              {/* Download Sheet Action Button */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-bold bg-black hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span>Download Sheet (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* ---------- RECORD BOX: expands smoothly under the calendar ---------- */}
            <div
              id="attendance-editor-panel"
              className={`record-collapse ${selectedDay ? 'is-open' : ''}`}
            >
              <div className="record-collapse-inner">
                {renderedDay && (
                  <div className="bg-canvas border border-line/80 rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest block">Attendance record</span>
                        <h4 className="text-lg font-extrabold text-ink mt-0.5">
                          {renderedDay.dateNum} {monthNames[currentMonth]} {currentYear}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${renderedDay.isWeekend ? 'bg-subtle text-ink-soft' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            }`}>
                            {renderedDay.dayOfWeek}day &bull; {renderedDay.isWeekend ? 'Weekend' : 'Working Day'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDay(null)}
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink-soft hover:bg-subtle rounded-full transition-colors cursor-pointer"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                      {/* Day Off Switch */}
                      <div className="flex items-center justify-between p-3.5 bg-subtle/80 rounded-2xl border border-line">
                        <div className="space-y-0.5 text-left">
                          <label className="text-xs font-bold text-ink block">Day Off</label>
                          <p className="text-[11px] text-muted font-light">Mark as a non-working day</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = status === 'Day Off' ? 'Present' : 'Day Off';
                            setStatus(newStatus);
                            if (newStatus === 'Day Off') {
                              setInTime('');
                              setOutTime('');
                            } else {
                              setInTime('08:30');
                              setOutTime('17:30');
                            }
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status === 'Day Off' ? 'bg-[#111827]' : 'bg-line'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-canvas shadow ring-0 transition duration-200 ease-in-out ${status === 'Day Off' ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      <div className={`space-y-4 transition-all duration-200 ${status === 'Day Off' ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">IN Time</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={inTime}
                                onChange={handleInTimeChange}
                                onKeyDown={(e) => handleTimeKeyDown(e, setInTime, inTime)}
                                onBlur={handleInBlur}
                                placeholder="08:30"
                                disabled={status === 'Day Off'}
                                className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle/80 border border-line/80 focus:outline-none focus:border-line focus:bg-canvas text-ink text-xs font-mono transition-all pr-8"
                              />
                              <Clock className="w-3.5 h-3.5 text-muted absolute right-3 top-3 pointer-events-none" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">OUT Time</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={outTime}
                                onChange={handleOutTimeChange}
                                onKeyDown={(e) => handleTimeKeyDown(e, setOutTime, outTime)}
                                onBlur={handleOutBlur}
                                placeholder="17:30"
                                disabled={status === 'Day Off'}
                                className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle/80 border border-line/80 focus:outline-none focus:border-line focus:bg-canvas text-ink text-xs font-mono transition-all pr-8"
                              />
                              <Clock className="w-3.5 h-3.5 text-muted absolute right-3 top-3 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Quick Presets</label>
                          <div className="grid grid-cols-2 gap-2">
                            {PRESETS.map(([presetIn, presetOut, label]) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => { setInTime(presetIn); setOutTime(presetOut); }}
                                disabled={status === 'Day Off'}
                                className="py-2 px-2.5 rounded-xl bg-subtle hover:bg-subtle border border-line/80 hover:border-line-strong text-[10px] text-ink-soft transition-all cursor-pointer font-semibold text-center disabled:opacity-50"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                          {status === 'Day Off' ? 'Day Off Reason / Info' : 'Reason / Task Info'}
                        </label>
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={status === 'Day Off' ? 'e.g. Personal Holiday' : 'e.g. Web Developments'}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle/80 border border-line/80 focus:outline-none focus:border-line focus:bg-canvas text-ink text-xs transition-all"
                        />
                      </div>

                      <div className="p-3.5 bg-subtle/80 rounded-2xl border border-line text-xs space-y-2">
                        <div className="flex justify-between text-muted">
                          <span>Calculated Hours:</span>
                          <span className={`font-bold font-mono ${status === 'Day Off' ? 'text-muted' : 'text-ink'}`}>
                            {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).hours : '0.00')} hrs
                          </span>
                        </div>
                        <div className="flex justify-between text-muted border-t border-line/60 pt-2">
                          <span>Estimated Day Pay:</span>
                          <span className={`font-bold font-mono ${status === 'Day Off' ? 'text-muted' : 'text-ink'}`}>
                            Rs. {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 py-3 px-5 rounded-full text-xs font-bold bg-[#111827] hover:bg-black text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Saving...' : 'Save Log'}
                        </button>

                        {(renderedDay.docId || renderedDay.checkIn || renderedDay.checkOut || renderedDay.status === 'Day Off') && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="p-3 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                            title="Delete Record"
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

            {/* Hint shown only while nothing is selected */}
            {!selectedDay && (
              <div className="border border-dashed border-line rounded-3xl p-6 text-center select-none bg-subtle/40">
                <CalendarIcon className="w-7 h-7 text-muted stroke-1 mx-auto mb-2" />
                <p className="text-xs text-muted font-medium">
                  Click any calendar day to open its record here.
                </p>
              </div>
            )}
          </div>

          {/* ---------- MIDDLE: TOP ATTENDANCE & TEAM STATUS PANELS (SIDE BY SIDE) ---------- */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-5 items-start">
            <TopAttendance
              ranked={ranked}
              loading={teamLoading}
              error={teamError}
              currentUid={user?.uid}
            />
            <TeamStatus
              byActivity={byActivity}
              online={online}
              loading={teamLoading}
              error={teamError}
            />

            {/* Spans both columns so it fills the white space below the pair */}
            <div className="sm:col-span-2">
              <Suspense
                fallback={
                  <div className="h-[280px] sm:h-[320px] rounded-3xl border border-line bg-subtle flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-soft border-t-brand animate-spin" />
                  </div>
                }
              >
              <RobotPanel
                userName={user?.name}
                onlineCount={online.length}
                teamCount={byActivity.length}
                currentStreak={currentStreak}
                hoursLogged={totalHoursDecimal}
              />
              </Suspense>
            </div>
          </div>

          {/* ---------- RIGHT: WIDGET BOXES ---------- */}
          <div className="lg:col-span-3">
            <StatWidgets
              totalWorkedDays={totalWorkedDays}
              totalHoursDecimal={totalHoursDecimal}
              totalSalary={totalSalary}
              workingDaysElapsed={workingDaysElapsed}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
