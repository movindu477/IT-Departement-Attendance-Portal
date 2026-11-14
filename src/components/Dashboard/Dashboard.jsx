import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import AvatarUpload from '../Layout/AvatarUpload';
import StaffRail from '../Layout/StaffRail';
import ThemeToggle from '../Layout/ThemeToggle';
import StatCard from './StatCard';
import TopAttendance from './TopAttendance';
import HoursChart from './HoursChart';
import MonthProgress from './MonthProgress';
import { useTeam } from '../../hooks/useTeam';
import { useTheme } from '../../context/ThemeContext';
import { useSmoothNumber } from '../../hooks/useSmoothNumber';
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
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Phone,
  MapPin,
  Mail,
  Undo2,
  Redo2,
  AlignJustify,
  Bell,
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
  const { user } = useAuth();
  const { isDark } = useTheme();

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

  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState('dashboard');
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);

  // Calendar grid built with date-fns over whole Sunday-first weeks
  const monthStart = startOfMonth(new Date(currentYear, currentMonth, 1));
  const calendarCells = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),   // 0 = Sunday
    end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }),
  });

  // Look-up so a grid cell can find its attendance row by date key.
  const dayByKey = Object.fromEntries(daysList.map(d => [d.dateKey, d]));

  // Derived percentages for the 3 arc gauges & stepped breakdown
  const attendancePctRounded = Math.round(attendanceRate);
  const hoursProgressPct = Math.min(
    100,
    Math.round((parseFloat(totalHoursDecimal) / HOURS_TARGET) * 100)
  );
  const weekAdherencePct = Math.min(100, Math.round((weekTotal / 40) * 100));
  const weekDelta = weekTotal - lastWeekTotal;

  // Values displayed in gauges (with realistic visual arc positions even at start of month)
  const gauge1Val = workingDaysElapsed > 0 ? attendancePctRounded : 0;
  const gauge2Val = hoursProgressPct;
  const gauge3Val = weekAdherencePct;

  // Smooth 2.2s count-up animations for all dashboard numbers & stepped bars
  const animWorkedDays = useSmoothNumber(totalWorkedDays, 2200);
  const animMonthlyHours = useSmoothNumber(parseFloat(totalHoursDecimal) || 0, 2200);
  const animTotalSalary = useSmoothNumber(totalSalary, 2200);
  const animGauge1 = useSmoothNumber(gauge1Val, 2200);
  const animGauge2 = useSmoothNumber(gauge2Val, 2200);
  const animGauge3 = useSmoothNumber(gauge3Val, 2200);
  const animBarFill = useSmoothNumber(100, 2200);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleNavAction = (tabKey) => {
    setActiveNavTab(tabKey);
    if (tabKey === 'attendance') scrollToId('section-attendance-overview');
    else if (tabKey === 'insights') scrollToId('section-demographics');
    else if (tabKey === 'schedule') scrollToId('section-calendar');
    else if (tabKey === 'workspace') navigate('/team');
  };

  const staffIdCode = `#PT-${String(user?.uid || '20458')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 5)
    .toUpperCase()}`;

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#E2E5EC] text-[#1A1D21]">
      <StaffRail activeSection={activeNavTab} onSelectSection={handleNavAction} />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toast */}
        {alert && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md animate-fade-in-up">
            <div className={`flex items-start gap-3 p-4 rounded-2xl border bg-white shadow-[0_2px_12px_rgba(15,23,42,0.08)] ${
              alert.type === 'error'
                ? 'border-rose-200'
                : 'border-emerald-200'
            }`}>
              {alert.type === 'error'
                ? <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
              <div className="flex-1 text-left">
                <h4 className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${alert.type === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {alert.type === 'error' ? 'Error' : 'Success'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">{alert.message}</p>
              </div>
              <button onClick={() => setAlert(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------- HEADER ------------------------------- */}
        <header className="shrink-0 px-4 sm:px-6 pt-3.5 pb-3 flex items-center justify-between gap-4">
          {/* Left spacer on desktop so the pill tabs sit dead-center like the reference image */}
          <div className="hidden lg:flex items-center gap-2 min-w-[120px]">
            <span className="text-[11px] font-medium text-[#6B7280] truncate">{timeString.split(',')[0]}</span>
          </div>

          {/* Centered 5-tab navigation bar matching the reference image */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar mx-auto">
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'attendance', label: 'Attendance' },
              { key: 'insights', label: 'Insights' },
              { key: 'schedule', label: 'Schedule' },
              { key: 'workspace', label: 'Workspace' },
            ].map((tab) => {
              const isActive = activeNavTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleNavAction(tab.key)}
                  className={`px-4 sm:px-5 py-2.5 rounded-[12px] text-[12.5px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#4A90E2] text-white shadow-[0_4px_12px_rgba(74,144,226,0.28)]'
                      : 'bg-[#F2F4F7] text-[#4B5563] border border-white/80 hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right theme toggle + notification bell + square user avatar */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-[100px] justify-end">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleExportExcel}
              title="Download monthly timesheet (.xlsx)"
              className="relative w-10 h-10 rounded-[12px] bg-[#F2F4F7] border border-white/80 hover:bg-white
                         flex items-center justify-center text-[#1A1D21] transition-colors cursor-pointer"
            >
              <Bell className="w-[17px] h-[17px]" strokeWidth={1.9} />
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#4A90E2]" />
            </button>
            <AvatarUpload size={40} />
          </div>
        </header>

        {/* ---------------------------- SCROLL AREA ---------------------------- */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-4">

          {/* Month-end cleanup warning */}
          {isLastDayOfMonth && !isBannerDismissed && (
            <div className="bg-[#F2F4F7] border border-white/80 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1D21]">Last day of the month</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    This month&apos;s records clear at midnight. Download your sheet before then.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4A90E2] text-white text-[11px] font-semibold
                             hover:bg-[#3A7FD5] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Download sheet
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('attendance_cleanup_banner_dismissed', 'true');
                    setIsBannerDismissed(true);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================ TOP ROW ============================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

            {/* ---- TOP-LEFT CARD: Staff Details + Hero User Image + 3 Metrics ---- */}
            <div className="lg:col-span-4 bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] relative overflow-hidden flex flex-col justify-between">
              {/* Soft sky-blue top-left radial glow matching the reference image */}
              <div
                className="pointer-events-none absolute -top-6 -left-6 w-[78%] h-[74%]"
                style={{
                  background: isDark
                    ? 'radial-gradient(circle at 30% 32%, rgba(74, 144, 226, 0.28) 0%, rgba(56, 120, 210, 0.11) 46%, rgba(20, 25, 35, 0) 76%)'
                    : 'radial-gradient(circle at 30% 32%, rgba(142, 198, 255, 0.85) 0%, rgba(182, 218, 255, 0.45) 44%, rgba(242, 244, 247, 0) 76%)',
                }}
              />

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10 mb-1">
                <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
                  Staff details
                </h3>
                <div className="flex items-center gap-2 text-[#1A1D21]">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Previous month"
                    className="p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <Undo2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Next month"
                    className="p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <Redo2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* Middle Split: Large User Portrait on Left + User Details on Right */}
              <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 my-1.5">
                <div className="shrink-0">
                  <AvatarUpload variant="hero" />
                </div>

                <div className="min-w-0 flex-1 py-2">
                  <h2 className="text-[17px] font-semibold text-[#1A1D21] tracking-tight truncate">
                    {user?.name || 'Dianne Russell'}
                  </h2>
                  <p className="text-[11.5px] text-[#6B7280] mt-0.5 mb-4 truncate">
                    Staff ID: {staffIdCode}
                  </p>

                  <div className="space-y-2.5 text-[12px] text-[#2C3137]">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
                      <span className="truncate">
                        Rs. {hourlyRate}/hr · {user?.jobTitle || 'Staff'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
                      <span className="truncate">
                        APIIT · {monthNames[currentMonth]} {currentYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
                      <span className="truncate" title={user?.email || ''}>
                        {user?.email || 'staff@apiit.lk'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 3 Summary Columns with Blue, Orange, and Lime-Green Bars */}
              <div className="relative z-10 grid grid-cols-3 gap-4 pt-2 mt-auto">
                <div>
                  <p className="text-[11px] text-[#4B5563] mb-1 truncate">Total Worked Days</p>
                  <p className="text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums">
                    {Math.round(animWorkedDays).toLocaleString()}
                  </p>
                  <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#4A90E2]"
                      style={{ width: `${animBarFill}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-[#4B5563] mb-1 truncate">Monthly Hours</p>
                  <p className="text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums">
                    {animMonthlyHours.toFixed(2)}
                  </p>
                  <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#F5A623]"
                      style={{ width: `${animBarFill}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-[#4B5563] mb-1 truncate">Total Earnings</p>
                  <p
                    className="text-[22px] xl:text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums truncate"
                    title={`Rs. ${totalSalary.toLocaleString()}`}
                  >
                    {Math.round(animTotalSalary).toLocaleString()}
                  </p>
                  <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#95D600]"
                      style={{ width: `${animBarFill}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---- TOP-RIGHT AREA: 3 Sweeping Arc Gauges + Wide Stepped Breakdown ---- */}
            <div className="lg:col-span-8 flex flex-col gap-4">

              {/* 3 Arc Gauge Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  tone={1}
                  label="Attendance Stability"
                  value={`${gauge1Val}%`}
                  numericValue={gauge1Val}
                  percentage={gauge1Val > 0 ? gauge1Val : 84}
                  delta={
                    workingDaysElapsed > 0
                      ? `${totalWorkedDays}/${workingDaysElapsed}d`
                      : '+3.1%'
                  }
                  isDown={false}
                  onAction={() => scrollToId('section-calendar')}
                />
                <StatCard
                  tone={2}
                  label="Monthly Progress"
                  value={`${gauge2Val}%`}
                  numericValue={gauge2Val}
                  percentage={gauge2Val > 0 ? gauge2Val : 91}
                  delta={`${Math.max(HOURS_TARGET - parseFloat(totalHoursDecimal), 0).toFixed(1)}h left`}
                  isDown={true}
                  onAction={() => setShowDetailedCharts((v) => !v)}
                />
                <StatCard
                  tone={3}
                  label="Weekly Adherence"
                  value={`${gauge3Val}%`}
                  numericValue={gauge3Val}
                  percentage={gauge3Val > 0 ? gauge3Val : 58}
                  delta={`${weekDelta >= 0 ? '+' : ''}${weekDelta.toFixed(1)}h`}
                  isDown={false}
                  onAction={() => setShowDetailedCharts((v) => !v)}
                />
              </div>

              {/* Wide Stepped Demographics / Breakdown Card */}
              <div
                id="section-demographics"
                className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex-1 flex flex-col justify-between min-h-[218px]"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
                      Attendance Demographics
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetailedCharts((v) => !v)}
                    title={showDetailedCharts ? 'Show stepped overview' : 'Show detailed weekly & monthly charts'}
                    className="w-8 h-8 rounded-[10px] bg-[#E4E7EC] hover:bg-[#D8DCE3] text-[#2C3137]
                               flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <AlignJustify className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>

                {!showDetailedCharts ? (
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mt-auto pt-3">
                    {/* Bottom-left legend matching the reference image */}
                    <div className="space-y-2.5 text-[12px] text-[#374151] shrink-0 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4A90E2]" />
                        <span>Worked Days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                        <span>Monthly Hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#95D600]" />
                        <span>Weekly Pace</span>
                      </div>
                    </div>

                    {/* 3 contiguous stepped gradient bars matching "Patient Demographics" */}
                    <div className="flex-1 grid grid-cols-3 items-end">
                      {/* Step 1: Blue */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#4A90E2]" />
                          <span className="truncate">
                            Worked: {totalWorkedDays}/{workingDaysElapsed || workingDaysInMonth}d
                          </span>
                        </div>
                        <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
                          {Math.round(animGauge1)}%
                        </span>
                        <div
                          className="w-full border-t-[3.5px] border-[#4A90E2] bg-gradient-to-b from-[#4A90E2]/40 via-[#4A90E2]/15 to-transparent"
                          style={{ height: `${Math.round((animBarFill / 100) * 42)}px` }}
                        />
                      </div>

                      {/* Step 2: Orange (Tallest middle step) */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                          <span className="truncate">
                            Hours: {totalHoursDecimal}h / {HOURS_TARGET}h
                          </span>
                        </div>
                        <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
                          {Math.round(animGauge2)}%
                        </span>
                        <div
                          className="w-full border-t-[3.5px] border-[#F5A623] bg-gradient-to-b from-[#F5A623]/40 via-[#F5A623]/15 to-transparent"
                          style={{ height: `${Math.round((animBarFill / 100) * 88)}px` }}
                        />
                      </div>

                      {/* Step 3: Lime-Green */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#374151] mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#95D600]" />
                          <span className="truncate">
                            Week: {weekTotal.toFixed(1)}h ({ currentStreak > 0 ? `${currentStreak}d streak` : `Avg ${avgDayLength.toFixed(1)}h` })
                          </span>
                        </div>
                        <span className="text-[24px] font-normal text-[#1A1D21] leading-none mb-2.5 tabular-nums">
                          {Math.round(animGauge3)}%
                        </span>
                        <div
                          className="w-full border-t-[3.5px] border-[#95D600] bg-gradient-to-b from-[#95D600]/40 via-[#95D600]/15 to-transparent"
                          style={{ height: `${Math.round((animBarFill / 100) * 26)}px` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                )}
              </div>
            </div>
          </div>

          {/* ============================ BOTTOM ROW ============================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

            {/* ---- BOTTOM-LEFT: Attendance Overview Table (8 cols) ---- */}
            <div id="section-attendance-overview" className="lg:col-span-8">
              <TopAttendance
                ranked={ranked}
                loading={teamLoading}
                error={teamError}
                currentUid={user?.uid}
                workingDaysElapsed={workingDaysElapsed}
                monthLabel={monthNames[currentMonth]}
                daysList={daysList}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
                onExportExcel={handleExportExcel}
              />
            </div>

            {/* ---- BOTTOM-RIGHT: Calendar + Record Editor (4 cols) ---- */}
            <div id="section-calendar" className="lg:col-span-4 space-y-4">
              <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                {/* Calendar Header matching the reference image */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
                    Calendar
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      aria-label="Previous month"
                      className="w-6 h-6 rounded-full border border-[#4B5563] text-[#2C3137] flex items-center justify-center
                                 hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[12px] font-medium text-[#2C3137] min-w-[92px] text-center">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="w-6 h-6 rounded-full border border-[#4B5563] text-[#2C3137] flex items-center justify-center
                                 hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Single-letter weekday header row: S M T W T F S */}
                <div className="grid grid-cols-7 gap-x-1 mb-2 text-center text-[11px] font-medium text-[#6B7280]">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={`${d}-${i}`}>{d}</div>
                  ))}
                </div>

                {/* Calendar Date Grid with Full Status Circle Highlights & Dots */}
                <div className="grid grid-cols-7 gap-x-1 gap-y-1.5 justify-items-center">
                  {calendarCells.map((cellDate) => {
                    const key = format(cellDate, 'yyyy-MM-dd');
                    const day = dayByKey[key];

                    // Overflow dates from previous/next month
                    if (!day) {
                      return (
                        <div key={key} className="flex flex-col items-center py-0.5 select-none">
                          <span className="w-8 h-8 flex items-center justify-center text-[12px] text-[#B0B7C3]">
                            {cellDate.getDate()}
                          </span>
                          <span className="h-1" />
                        </div>
                      );
                    }

                    const worked = day.hours !== '0.00' || day.status === 'Present';
                    const isDayOff = day.status === 'Day Off';
                    const isToday = day.dateKey === realDateKey;
                    const isSelected = selectedDay && selectedDay.dateKey === day.dateKey;

                    const missed =
                      !worked &&
                      !isDayOff &&
                      !!realDateKey &&
                      day.dateKey <= realDateKey;

                    // Circle fill reflects attendance marking state; Today and Selected
                    // use offset rings so they never hide the underlying marking color.
                    let circleCls = 'text-[#2C3137] group-hover:bg-white';
                    if (day.isWeekend && !worked && !isDayOff && !missed) {
                      circleCls = 'text-[#6B7280] group-hover:bg-white';
                    }
                    if (worked) {
                      circleCls =
                        'bg-emerald-500 text-white font-semibold shadow-[0_2px_6px_rgba(16,185,129,0.3)] group-hover:bg-emerald-600';
                    } else if (isDayOff) {
                      circleCls =
                        'bg-amber-500 text-white font-semibold shadow-[0_2px_6px_rgba(245,158,11,0.3)] group-hover:bg-amber-600';
                    } else if (missed) {
                      circleCls =
                        'bg-rose-500 text-white font-semibold shadow-[0_2px_6px_rgba(244,63,94,0.3)] group-hover:bg-rose-600';
                    }

                    if (isToday && !isSelected) {
                      circleCls += ' ring-2 ring-[#4A90E2] ring-offset-2 ring-offset-[#F2F4F7]';
                    }
                    if (isSelected) {
                      circleCls += ' ring-2 ring-[#141619] ring-offset-2 ring-offset-[#F2F4F7] scale-105';
                    }

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectDay(day)}
                        title={`${format(cellDate, 'EEEE d MMMM yyyy')} — ${
                          worked
                            ? `Logged (${day.hours}h)`
                            : isDayOff
                              ? 'Day Off'
                              : missed
                                ? 'Missed (not logged)'
                                : day.status
                        }`}
                        className="flex flex-col items-center py-0.5 cursor-pointer group"
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] transition-all ${circleCls}`}
                        >
                          {day.dateNum}
                        </span>

                        {/* Matching status indicator dot underneath */}
                        <span className="flex items-center justify-center gap-0.5 h-1.5 mt-1">
                          {worked && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                          {isDayOff && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {missed && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-[#4A90E2]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Legend matching the highlighted states */}
                <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-3 border-t border-[#E2E6EC]">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#374151]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Logged
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#374151]">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Day Off
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#374151]">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Missed
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#374151]">
                    <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#4A90E2] ring-inset" />
                    Today
                  </span>
                </div>
              </div>

              {/* Record editor — expands smoothly under the calendar when a date is clicked */}
              <div
                id="attendance-editor-panel"
                className={`record-collapse ${selectedDay ? 'is-open' : ''}`}
              >
                <div className="record-collapse-inner">
                  {renderedDay && (
                    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-[15px] font-semibold text-[#1A1D21]">
                            {renderedDay.dateNum} {monthNames[currentMonth]} {currentYear}
                          </h4>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">
                            {renderedDay.dayOfWeek}day · {renderedDay.isWeekend ? 'Weekend' : 'Working day'}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedDay(null)}
                          aria-label="Close record"
                          className="w-8 h-8 rounded-full bg-white border border-slate-200/70 text-slate-500
                                     flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-white/90">
                          <div className="text-left">
                            <label className="text-xs font-medium text-[#1A1D21] block">Day off</label>
                            <p className="text-[10px] text-[#6B7280]">Mark as a non-working day</p>
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
                                        ${status === 'Day Off' ? 'bg-[#4A90E2]' : 'bg-slate-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 mt-0.5 transform rounded-full bg-white
                                              transition duration-200 ${status === 'Day Off' ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className={`space-y-4 transition-opacity ${status === 'Day Off' ? 'opacity-40 pointer-events-none' : ''}`}>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider block">In</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={inTime}
                                  onChange={handleInTimeChange}
                                  onKeyDown={(e) => handleTimeKeyDown(e, setInTime, inTime)}
                                  onBlur={handleInBlur}
                                  placeholder="08:30"
                                  disabled={status === 'Day Off'}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/70 text-[#1A1D21] text-xs font-mono
                                             focus:outline-none focus:border-[#4A90E2] transition-colors pr-8"
                                />
                                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider block">Out</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={outTime}
                                  onChange={handleOutTimeChange}
                                  onKeyDown={(e) => handleTimeKeyDown(e, setOutTime, outTime)}
                                  onBlur={handleOutBlur}
                                  placeholder="17:30"
                                  disabled={status === 'Day Off'}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200/70 text-[#1A1D21] text-xs font-mono
                                             focus:outline-none focus:border-[#4A90E2] transition-colors pr-8"
                                />
                                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
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
                                className="py-2 px-1.5 rounded-xl bg-white border border-slate-200/70 text-[10px] text-[#4B5563]
                                           hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider block">
                            {status === 'Day Off' ? 'Reason' : 'Task info'}
                          </label>
                          <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={status === 'Day Off' ? 'e.g. Personal holiday' : 'e.g. Web development'}
                            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200/70 text-[#1A1D21] text-xs
                                       focus:outline-none focus:border-[#4A90E2] transition-colors"
                          />
                        </div>

                        <div className="p-3 bg-white rounded-2xl border border-slate-200/70 text-xs space-y-2">
                          <div className="flex justify-between text-[#6B7280]">
                            <span>Hours</span>
                            <span className="font-mono font-semibold text-[#1A1D21]">
                              {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).hours : '0.00')}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#6B7280] border-t border-slate-100 pt-2">
                            <span>Day pay</span>
                            <span className="font-mono font-semibold text-[#4A90E2]">
                              Rs. {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-xl bg-[#4A90E2] text-white text-xs font-semibold
                                       hover:bg-[#3A7FD5] transition-colors cursor-pointer disabled:opacity-50
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
                              className="w-11 rounded-xl bg-white border border-slate-200/70 text-rose-500
                                         flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
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
    </div>
  );
};

export default Dashboard;
