import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { exportSalarySheetToExcel } from '../../utils/reportUtils';
import {
  Clock,
  LogOut,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Clock3,
  X,
  Save,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Navigation states
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  
  // Real-time time display
  const [timeString, setTimeString] = useState('');
  
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
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
    if (!user?.uid || firestoreLogs.length === 0) return;

    const today = new Date();
    const currentYearStr = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1; // 1-indexed
    const currentMonthStr = currentMonthNum < 10 ? `0${currentMonthNum}` : currentMonthNum;
    
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
  }, [firestoreLogs, user?.uid]);

  // Helper to get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getStartDayOfWeek = (month, year) => {
    return new Date(year, month, 1).getDay();
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
      const salaryVal = hoursDecimal * 240;
      
      return {
        hours: hoursDecimal.toFixed(2),
        salary: parseFloat(salaryVal.toFixed(2))
      };
    } catch (e) {
      return { hours: '0.00', salary: 0 };
    }
  };

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
    
    // Smooth scroll into view for the editor drawer panel on mobile/tablet viewports
    setTimeout(() => {
      const editorPanel = document.getElementById('attendance-editor-panel');
      if (editorPanel && window.innerWidth < 1024) {
        editorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
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

  // Delete attendance document
  const handleDelete = async () => {
    if (!selectedDay) return;
    setIsSaving(true);
    const docId = selectedDay.docId || `${user.uid}_${selectedDay.dateKey}`;
    try {
      await deleteDoc(doc(db, 'attendance', docId));
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
  
  const hourlyRate = 240;
  const salaryGoal = 38400; // goal: 160 hrs * 240 Rs.
  const progressPercent = Math.min((totalSalary / salaryGoal) * 100, 100);

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
    <div className="h-full w-full flex flex-col overflow-hidden bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-black text-slate-200">
      
      {/* Toast Alert Notification */}
      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-xl backdrop-blur-md shadow-xl border ${
            alert.type === 'error' 
              ? 'bg-[#1a0e12]/90 border-l-4 border-rose-500 border-y-rose-500/20 border-r-rose-500/20 text-slate-200 shadow-[0_4px_20px_rgba(244,63,94,0.2)]'
              : 'bg-[#0f1d13]/90 border-l-4 border-[#C4FF36] border-y-[#C4FF36]/20 border-r-[#C4FF36]/20 text-slate-200 shadow-[0_4px_20px_rgba(196,255,54,0.2)]'
          }`}>
            {alert.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-450 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#C4FF36] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-left">
              <h4 className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${alert.type === 'error' ? 'text-rose-400' : 'text-[#C4FF36]'}`}>
                {alert.type === 'error' ? 'Error' : 'Success'}
              </h4>
              <p className="text-xs text-slate-200/90 font-light leading-relaxed">{alert.message}</p>
            </div>
            <button 
              onClick={() => setAlert(null)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                alert.type === 'error' 
                  ? 'text-rose-400 hover:bg-rose-500/10 hover:text-white' 
                  : 'text-[#C4FF36] hover:bg-[#C4FF36]/10 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      
      {/* HEADER NAVBAR */}
      <header className="h-16 shrink-0 bg-[#0c101d]/60 backdrop-blur-md border-b border-slate-850 px-4 sm:px-8 flex justify-between items-center z-10">
        {/* Exact Local Date/Time display */}
        <div className="flex items-center gap-2.5 text-slate-400 font-mono text-xs sm:text-sm font-semibold">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-slate-300 select-none tracking-tight">{timeString || 'Loading clock...'}</span>
        </div>

        {/* User Card & Log Out */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <h4 className="text-xs font-bold text-slate-200">{user?.name}</h4>
            <p className="text-[10px] text-slate-500 font-light tracking-wide uppercase">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* VIEWPORT SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Worked Days</span>
              <span className="text-2xl font-bold text-white tracking-tight">{totalWorkedDays} Days</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center text-slate-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Hours</span>
              <span className="text-2xl font-bold text-white tracking-tight">{totalHoursDecimal} hrs</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center text-slate-300">
              <Clock3 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Earnings</span>
              <span className="text-2xl font-bold text-[#C4FF36] tracking-tight">
                Rs. {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-center text-[#C4FF36]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Salary Goal Progress</span>
              <span className="text-xs font-bold text-[#C4FF36]">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2">
              <div 
                className="bg-[#C4FF36] h-2 rounded-full transition-all duration-500 shadow-md shadow-[#C4FF36]/20" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>

        {/* CALENDAR AND EDIT DRAWER SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Calendar Box */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly Calendar</h3>
                <p className="text-xs text-slate-400">Click a day to add or edit attendance hours.</p>
                {/* Color Legend */}
                <div className="flex gap-3 mt-2.5 flex-wrap text-[10px] font-semibold text-slate-400 select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-slate-900 border border-slate-800" />
                    <span>Working Day</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-[#EF401D]/25 border border-[#EF401D]/45" />
                    <span className="text-red-400/90">Weekend</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-indigo-950/30 border border-indigo-900/50" />
                    <span className="text-indigo-300">Day Off</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-bold mt-1 w-full sm:w-auto">
                <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="min-w-[100px] text-center text-slate-200 select-none">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors p-1 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days labels */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {/* Padding empty slots */}
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square bg-slate-950/10 rounded-xl border border-slate-900/50" />
              ))}

              {/* Days List */}
              {daysList.map((day) => {
                const hasHours = day.hours !== '0.00';
                
                let dayStyle = 'bg-slate-900/10 border-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900/30';
                if (day.status === 'Day Off') {
                  dayStyle = 'bg-indigo-950/30 border-indigo-900/50 text-indigo-200 hover:border-indigo-700 hover:bg-indigo-900/20';
                } else if (day.isWeekend) {
                  dayStyle = 'bg-[#EF401D]/15 border-[#EF401D]/30 text-rose-200 hover:border-[#EF401D]/60 hover:bg-[#EF401D]/25';
                }
                
                const isSelected = selectedDay && selectedDay.dateKey === day.dateKey;
                if (isSelected) {
                  dayStyle = 'ring-2 ring-[#C4FF36] border-transparent text-[#C4FF36]';
                }

                return (
                  <button
                    key={day.dateKey}
                    onClick={() => handleSelectDay(day)}
                    className={`aspect-square border rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between items-start transition-all cursor-pointer group relative ${dayStyle}`}
                  >
                    <span className="text-[10px] sm:text-xs font-bold">{day.dateNum}</span>
                    
                    {/* Micro logs rendering */}
                    {day.status === 'Day Off' ? (
                      <div className="text-[7px] sm:text-[8px] font-medium text-indigo-300 w-full text-left font-mono leading-tight">
                        <span className="block text-indigo-400 font-bold uppercase tracking-tight">Off</span>
                        <span className="hidden sm:block truncate max-w-full text-slate-550">{day.reason || 'Day Off'}</span>
                      </div>
                    ) : day.isWeekend ? (
                      <span className="text-[7px] sm:text-[8px] font-bold text-[#EF401D] tracking-tight uppercase">Rest</span>
                    ) : hasHours ? (
                      <div className="text-[7px] sm:text-[8px] font-medium text-slate-400 w-full text-left font-mono leading-tight">
                        <span className="block text-[#C4FF36] font-bold">{day.hours}h</span>
                        <span className="hidden sm:block truncate max-w-full text-slate-550">{day.reason || 'Present'}</span>
                      </div>
                    ) : (
                      <span className="text-[7px] sm:text-[8px] text-slate-600 font-light">Empty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Drawer Box */}
          <div 
            id="attendance-editor-panel"
            className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col h-full min-h-[380px]"
          >
            {selectedDay ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-[#C4FF36] uppercase tracking-widest block">Logged hours editor</span>
                      <h4 className="text-lg font-bold text-white mt-1">
                        {selectedDay.dateNum} {monthNames[currentMonth]} {currentYear}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedDay.dayOfWeek}day — {selectedDay.isWeekend ? 'Weekend' : 'Working Day'}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="space-y-4">
                    {/* Day Off Switch */}
                    <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                      <div className="space-y-0.5 text-left">
                        <label className="text-xs font-bold text-white block">Day Off</label>
                        <p className="text-[10px] text-slate-500 font-light">Mark this day as a non-working day off</p>
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
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status === 'Day Off' ? 'bg-indigo-650' : 'bg-slate-800'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${status === 'Day Off' ? 'translate-x-4' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className={`space-y-4 transition-all duration-200 ${status === 'Day Off' ? 'opacity-40 pointer-events-none' : ''}`}>
                      <div className="grid grid-cols-2 gap-4">
                        {/* IN Time Field */}
                        <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IN Time</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={inTime}
                              onChange={handleInTimeChange}
                              onKeyDown={(e) => handleTimeKeyDown(e, setInTime, inTime)}
                              onBlur={handleInBlur}
                              placeholder="08:30"
                              disabled={status === 'Day Off'}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-mono transition-all pr-8"
                            />
                            <Clock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                          </div>
                        </div>

                        {/* OUT Time Field */}
                        <div className="space-y-1.5 relative">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OUT Time</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={outTime}
                              onChange={handleOutTimeChange}
                              onKeyDown={(e) => handleTimeKeyDown(e, setOutTime, outTime)}
                              onBlur={handleOutBlur}
                              placeholder="17:30"
                              disabled={status === 'Day Off'}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-mono transition-all pr-8"
                            />
                            <Clock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</label>
                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setInTime('08:30'); setOutTime('17:30'); }}
                            disabled={status === 'Day Off'}
                            className="py-2 px-1.5 sm:px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-[#C4FF36]/40 hover:text-[#C4FF36] text-[9px] sm:text-[10px] text-slate-400 transition-all cursor-pointer font-medium text-center hover:bg-slate-900/30 disabled:opacity-50"
                          >
                            Full Day (08:30 - 17:30)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setInTime('09:00'); setOutTime('18:00'); }}
                            disabled={status === 'Day Off'}
                            className="py-2 px-1.5 sm:px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-[#C4FF36]/40 hover:text-[#C4FF36] text-[9px] sm:text-[10px] text-slate-400 transition-all cursor-pointer font-medium text-center hover:bg-slate-900/30 disabled:opacity-50"
                          >
                            Full Day (09:00 - 18:00)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setInTime('08:30'); setOutTime('13:00'); }}
                            disabled={status === 'Day Off'}
                            className="py-2 px-1.5 sm:px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-[#C4FF36]/40 hover:text-[#C4FF36] text-[9px] sm:text-[10px] text-slate-400 transition-all cursor-pointer font-medium text-center hover:bg-slate-900/30 disabled:opacity-50"
                          >
                            Half Day (08:30 - 13:00)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setInTime('13:00'); setOutTime('17:30'); }}
                            disabled={status === 'Day Off'}
                            className="py-2 px-1.5 sm:px-2 rounded-xl bg-slate-950 border border-slate-850 hover:border-[#C4FF36]/40 hover:text-[#C4FF36] text-[9px] sm:text-[10px] text-slate-400 transition-all cursor-pointer font-medium text-center hover:bg-slate-900/30 disabled:opacity-50"
                          >
                            Half Day (13:00 - 17:30)
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-medium">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {status === 'Day Off' ? 'Day Off Reason / Info' : 'Reason / Task Info'}
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={status === 'Day Off' ? 'e.g. Personal Holiday' : 'e.g. Web Developments'}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-light"
                      />
                    </div>

                    <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Calculated Hours:</span>
                        <span className={`font-bold font-mono ${status === 'Day Off' ? 'text-indigo-400' : 'text-white'}`}>
                          {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).hours : '0.00')} hrs
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5">
                        <span>Estimated Day Pay:</span>
                        <span className={`font-bold font-mono ${status === 'Day Off' ? 'text-indigo-400' : 'text-[#C4FF36]'}`}>
                          Rs. {status === 'Day Off' ? '0.00' : (inTime && outTime ? calculateHoursAndSalary(inTime, outTime).salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#C4FF36] hover:bg-[#b0eb2f] text-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Saving...' : 'Save Log'}
                      </button>
                      
                      {(selectedDay.docId || selectedDay.checkIn || selectedDay.checkOut || selectedDay.status === 'Day Off') && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isSaving}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 cursor-pointer disabled:opacity-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
                <CalendarIcon className="w-10 h-10 text-slate-500 stroke-1 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">No date selected</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] font-light">Click any calendar cell to manage log times and details.</p>
              </div>
            )}
          </div>

        </div>

        {/* SPREADSHEET TABLE LIST */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800/80 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Attendance & Salary Statement</h3>
              <p className="text-xs text-slate-400">Statement breakdown for the active month.</p>
            </div>
            
            <button
              onClick={() => exportSalarySheetToExcel(daysList, monthNames[currentMonth], currentYear, totalHoursDecimal, totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#C4FF36] hover:bg-[#b0eb2f] text-black shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Salary Sheet (.xls)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[11px] font-bold uppercase border-b border-slate-850">
                  <th className="px-3 sm:px-6 py-3 text-center w-12 border border-slate-800">#</th>
                  <th className="px-3 sm:px-6 py-3 border border-slate-800">Date</th>
                  <th className="px-3 sm:px-6 py-3 border border-slate-800">Day</th>
                  <th className="px-3 sm:px-6 py-3 text-center border border-slate-800">IN</th>
                  <th className="px-3 sm:px-6 py-3 text-center border border-slate-800">OUT</th>
                  <th className="px-3 sm:px-6 py-3 text-center border border-slate-800">Hours</th>
                  <th className="px-3 sm:px-6 py-3 border border-slate-800">Salary (Rs.)</th>
                  <th className="px-3 sm:px-6 py-3 border border-slate-800">Reason / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs font-medium text-slate-300">
                {daysList.map((day, idx) => {
                  const isWeekend = day.status === 'Weekend';
                  const isDayOff = day.status === 'Day Off';
                  const shortMonth = monthNames[currentMonth].slice(0, 3);
                  
                  if (isWeekend) {
                    return (
                      <tr key={day.dateKey} className="bg-[#EF401D] text-white border-slate-800">
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-850/40">{idx + 1}</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-850/40 font-bold text-white">{day.dateNum}-{shortMonth}</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-850/40 font-bold text-white">{day.dayOfWeek}</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-850/40 text-red-200">—</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-850/40 text-red-200">—</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-850/40 text-red-200">—</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-850/40 text-red-200">—</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-850/40 font-bold text-white">{day.dayOfWeek === 'Sat' ? 'Saturday — Weekend' : 'Sunday — Weekend'}</td>
                      </tr>
                    );
                  }

                  if (isDayOff) {
                    return (
                      <tr key={day.dateKey} className="bg-indigo-950/40 text-indigo-200 border-slate-850">
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800">{idx + 1}</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold text-indigo-100">{day.dateNum}-{shortMonth}</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold text-indigo-100">{day.dayOfWeek}</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 text-indigo-400/40 font-mono">—</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 text-indigo-400/40 font-mono">—</td>
                        <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 text-indigo-400/40 font-mono">—</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-800 text-indigo-400/40">—</td>
                        <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold text-indigo-300">Day Off — {day.reason || 'Not Working'}</td>
                      </tr>
                    );
                  }

                  const hasHours = day.hours !== '0.00';

                  return (
                    <tr key={day.dateKey} className={`${idx % 2 === 0 ? 'bg-[#0f1423]/20' : 'bg-[#0f1423]/50'} hover:bg-slate-900/30 transition-colors`}>
                      <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800">{idx + 1}</td>
                      <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold text-white">{day.dateNum}-{shortMonth}</td>
                      <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold text-white">{day.dayOfWeek}</td>
                      <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 font-mono">{day.checkIn || '—'}</td>
                      <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 font-mono">{day.checkOut || '—'}</td>
                      <td className="px-3 sm:px-6 py-2.5 text-center border border-slate-800 font-mono font-bold text-white">{hasHours ? day.hours : '—'}</td>
                      <td className="px-3 sm:px-6 py-2.5 border border-slate-800 font-bold font-mono text-white">
                        {day.salary > 0 ? `Rs. ${day.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className={`px-3 sm:px-6 py-2.5 border border-slate-800 ${day.status === 'Absent' ? 'text-rose-500 font-bold' : 'text-slate-400 font-light'}`}>
                        {day.reason || (day.status === 'Absent' ? 'Absent' : '—')}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total row matching green highlighted cell in the spreadsheet */}
                <tr className="bg-slate-950/60 font-bold border-t-2 border-slate-800 text-sm">
                  <td colspan="3" className="px-3 sm:px-6 py-3 text-center border border-slate-800 bg-[#C4FF36] text-black font-extrabold uppercase select-none">
                    TOTAL
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-center border border-slate-800">—</td>
                  <td className="px-3 sm:px-6 py-3 text-center border border-slate-800">—</td>
                  <td className="px-3 sm:px-6 py-3 text-center border border-slate-800 font-mono text-white font-bold">{totalHoursDecimal}</td>
                  <td className="px-3 sm:px-6 py-3 border border-slate-800 font-mono text-[#C4FF36] font-bold">
                    Rs. {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-3 border border-slate-800 text-xs text-slate-500 font-light">Calculated at Rs. 240/hr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
