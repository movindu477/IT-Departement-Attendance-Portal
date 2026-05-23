import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { exportSalarySheetToWord } from '../../utils/reportUtils';
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
  Trash2
} from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Navigation states
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 4 = May (0-indexed)
  
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
        status: isWeekend ? 'Weekend' : (matched ? 'Present' : 'Absent'),
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
      const [inH, inM] = inStr.split(':').map(Number);
      const [outH, outM] = outStr.split(':').map(Number);
      
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

  // Selecting a day on the calendar
  const handleSelectDay = (day) => {
    setSelectedDay(day);
    setInTime(day.checkIn || '');
    setOutTime(day.checkOut || '');
    setReason(day.reason || '');
  };

  // Saving attendance document to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;
    setIsSaving(true);

    const { hours, salary } = calculateHoursAndSalary(inTime, outTime);
    
    const docName = `${user.uid}_${selectedDay.dateKey}`;
    const payload = {
      userId: user.uid,
      date: selectedDay.dateKey,
      dayOfWeek: selectedDay.dayOfWeek,
      checkIn: inTime,
      checkOut: outTime,
      hours: hours,
      salary: salary,
      reason: reason,
      status: 'Present',
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'attendance', docName), payload);
      setIsSaving(false);
      setSelectedDay(null);
    } catch (error) {
      console.error("Error writing document to Firestore:", error);
      setIsSaving(false);
    }
  };

  // Delete attendance document
  const handleDelete = async () => {
    if (!selectedDay?.docId) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'attendance', selectedDay.docId));
      setIsSaving(false);
      setSelectedDay(null);
    } catch (error) {
      console.error("Error deleting document from Firestore:", error);
      setIsSaving(false);
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
      
      {/* HEADER NAVBAR */}
      <header className="h-16 shrink-0 bg-[#0c101d]/60 backdrop-blur-md border-b border-slate-850 px-8 flex justify-between items-center z-10">
        {/* Exact Local Date/Time display */}
        <div className="flex items-center gap-2.5 text-slate-400 font-mono text-sm font-semibold">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-slate-300 select-none tracking-tight">{timeString || 'Loading clock...'}</span>
        </div>

        {/* User Card & Log Out */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || DEFAULT_AVATAR}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border border-slate-800"
            />
            <div className="text-right hidden sm:block">
              <h4 className="text-xs font-bold text-slate-200">{user?.name}</h4>
              <p className="text-[10px] text-slate-500 font-light tracking-wide uppercase">{user?.role}</p>
            </div>
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
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Calendar Box */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Monthly Calendar</h3>
                <p className="text-xs text-slate-400">Click a day to add or edit attendance hours.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-bold">
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
            <div className="grid grid-cols-7 gap-2.5">
              {/* Padding empty slots */}
              {Array.from({ length: startOffset }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square bg-slate-950/10 rounded-xl border border-slate-900/50" />
              ))}

              {/* Days List */}
              {daysList.map((day) => {
                const hasHours = day.hours !== '0.00';
                
                let dayStyle = 'bg-slate-900/10 border-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900/30';
                if (day.isWeekend) {
                  dayStyle = 'bg-slate-950/20 border-slate-900/50 text-slate-550';
                }
                
                const isSelected = selectedDay && selectedDay.dateKey === day.dateKey;
                if (isSelected) {
                  dayStyle = 'ring-2 ring-[#C4FF36] border-transparent text-[#C4FF36]';
                }

                return (
                  <button
                    key={day.dateKey}
                    onClick={() => handleSelectDay(day)}
                    className={`aspect-square border rounded-xl p-2 flex flex-col justify-between items-start transition-all cursor-pointer group relative ${dayStyle}`}
                  >
                    <span className="text-xs font-bold">{day.dateNum}</span>
                    
                    {/* Micro logs rendering */}
                    {day.isWeekend ? (
                      <span className="text-[8px] font-bold text-amber-500/80 tracking-tight uppercase">Rest</span>
                    ) : hasHours ? (
                      <div className="text-[8px] font-medium text-slate-400 w-full text-left font-mono">
                        <span className="block text-[#C4FF36] font-bold">{day.hours} hrs</span>
                        <span className="block truncate max-w-full text-slate-500">{day.reason || 'Present'}</span>
                      </div>
                    ) : (
                      <span className="text-[8px] text-slate-600 font-light">Empty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Drawer Box */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[380px]">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IN Time</label>
                        <input
                          type="time"
                          value={inTime}
                          onChange={(e) => setInTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">OUT Time</label>
                        <input
                          type="time"
                          value={outTime}
                          onChange={(e) => setOutTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason / Task Info</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Web Developments"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-xs font-light"
                      />
                    </div>

                    {inTime && outTime && (
                      <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Calculated Hours:</span>
                          <span className="font-bold text-white font-mono">
                            {calculateHoursAndSalary(inTime, outTime).hours} hrs
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5">
                          <span>Estimated Day Pay:</span>
                          <span className="font-bold text-[#C4FF36] font-mono">
                            Rs. {calculateHoursAndSalary(inTime, outTime).salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#C4FF36] hover:bg-[#b0eb2f] text-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Saving...' : 'Save Log'}
                      </button>
                      
                      {selectedDay.docId && (
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
              onClick={() => exportSalarySheetToWord(daysList, monthNames[currentMonth], currentYear, totalHoursDecimal, totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#C4FF36] hover:bg-[#b0eb2f] text-black shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download Salary Sheet (.doc)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[11px] font-bold uppercase border-b border-slate-850">
                  <th className="px-6 py-3 text-center w-12 border border-slate-800">#</th>
                  <th className="px-6 py-3 border border-slate-800">Date</th>
                  <th className="px-6 py-3 border border-slate-800">Day</th>
                  <th className="px-6 py-3 text-center border border-slate-800">IN</th>
                  <th className="px-6 py-3 text-center border border-slate-800">OUT</th>
                  <th className="px-6 py-3 text-center border border-slate-800">Hours</th>
                  <th className="px-6 py-3 border border-slate-800">Salary (Rs.)</th>
                  <th className="px-6 py-3 border border-slate-800">Reason / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs font-medium text-slate-300">
                {daysList.map((day, idx) => {
                  const isWeekend = day.status === 'Weekend';
                  const shortMonth = monthNames[currentMonth].slice(0, 3);
                  
                  if (isWeekend) {
                    return (
                      <tr key={day.dateKey} className="bg-[#FFFF00] text-black border-slate-800">
                        <td className="px-6 py-2.5 text-center border border-slate-300/40">{idx + 1}</td>
                        <td className="px-6 py-2.5 border border-slate-300/40 font-bold">{day.dateNum}-{shortMonth}</td>
                        <td className="px-6 py-2.5 border border-slate-300/40 font-bold">{day.dayOfWeek}</td>
                        <td className="px-6 py-2.5 text-center border border-slate-300/40">—</td>
                        <td className="px-6 py-2.5 text-center border border-slate-300/40">—</td>
                        <td className="px-6 py-2.5 text-center border border-slate-300/40">—</td>
                        <td className="px-6 py-2.5 border border-slate-300/40">—</td>
                        <td className="px-6 py-2.5 border border-slate-300/40 font-bold text-amber-700">{day.dayOfWeek === 'Sat' ? 'Saturday — Weekend' : 'Sunday — Weekend'}</td>
                      </tr>
                    );
                  }

                  const hasHours = day.hours !== '0.00';

                  return (
                    <tr key={day.dateKey} className={`${idx % 2 === 0 ? 'bg-[#0f1423]/20' : 'bg-[#0f1423]/50'} hover:bg-slate-900/30 transition-colors`}>
                      <td className="px-6 py-2.5 text-center border border-slate-800">{idx + 1}</td>
                      <td className="px-6 py-2.5 border border-slate-800 font-bold text-white">{day.dateNum}-{shortMonth}</td>
                      <td className="px-6 py-2.5 border border-slate-800 font-bold text-white">{day.dayOfWeek}</td>
                      <td className="px-6 py-2.5 text-center border border-slate-800 font-mono">{day.checkIn || '—'}</td>
                      <td className="px-6 py-2.5 text-center border border-slate-800 font-mono">{day.checkOut || '—'}</td>
                      <td className="px-6 py-2.5 text-center border border-slate-800 font-mono font-bold text-white">{hasHours ? day.hours : '—'}</td>
                      <td className="px-6 py-2.5 border border-slate-800 font-bold font-mono text-white">
                        {day.salary > 0 ? `Rs. ${day.salary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className={`px-6 py-2.5 border border-slate-800 ${day.status === 'Absent' ? 'text-rose-500 font-bold' : 'text-slate-400 font-light'}`}>
                        {day.reason || (day.status === 'Absent' ? 'Absent' : '—')}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total row matching green highlighted cell in the spreadsheet */}
                <tr className="bg-slate-950/60 font-bold border-t-2 border-slate-800 text-sm">
                  <td colspan="3" className="px-6 py-3 text-center border border-slate-800 bg-[#C4FF36] text-black font-extrabold uppercase select-none">
                    TOTAL
                  </td>
                  <td className="px-6 py-3 text-center border border-slate-800">—</td>
                  <td className="px-6 py-3 text-center border border-slate-800">—</td>
                  <td className="px-6 py-3 text-center border border-slate-800 font-mono text-white font-bold">{totalHoursDecimal}</td>
                  <td className="px-6 py-3 border border-slate-800 font-mono text-[#C4FF36] font-bold font-mono">
                    Rs. {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 border border-slate-800 text-xs text-slate-500 font-light">Calculated at Rs. 240/hr</td>
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
