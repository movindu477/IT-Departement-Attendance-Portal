import React, { useState } from 'react';
import { Calendar as CalendarIcon, Info, Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const MonthlyReport = ({ logs }) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 4 = May (0-indexed)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to get number of days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get the starting day of the week
  const getStartDayOfWeek = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const startDay = getStartDayOfWeek(currentMonth, currentYear);

  // Generate calendar days
  const calendarDays = [];
  // Padding for starting days
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ type: 'empty' });
  }

  // Populate days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthNames[currentMonth]} ${day < 10 ? '0' + day : day}, ${currentYear}`;
    const matchedLog = logs.find(log => log.date.includes(dateStr) || log.date === `${monthNames[currentMonth].slice(0, 3)} ${day}, ${currentYear}`);
    
    // Check if weekend (Saturday or Sunday)
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let status = 'Not Logged';
    let checkIn = null;
    let checkOut = null;
    let hours = null;

    if (matchedLog) {
      status = matchedLog.status;
      checkIn = matchedLog.checkIn;
      checkOut = matchedLog.checkOut;
      hours = matchedLog.hours;
    } else if (isWeekend) {
      status = 'Weekend';
    } else if (day < new Date().getDate() || currentMonth < new Date().getMonth()) {
      // Past day, no log means absent or rest day
      status = 'Absent';
    }

    calendarDays.push({
      day,
      status,
      checkIn,
      checkOut,
      hours,
      dateStr
    });
  }

  // Calculate monthly metrics
  const totalLogs = calendarDays.filter(d => d.day && d.status !== 'Weekend' && d.status !== 'Not Logged').length;
  const onTimeCount = calendarDays.filter(d => d.status === 'On-time').length;
  const lateCount = calendarDays.filter(d => d.status === 'Late').length;
  const absentCount = calendarDays.filter(d => d.status === 'Absent').length;
  const totalWorkedMinutes = calendarDays.reduce((acc, d) => {
    if (d.hours && d.hours !== '--') {
      return acc + parseFloat(d.hours) * 60;
    }
    return acc;
  }, 0);
  const totalWorkedHours = (totalWorkedMinutes / 60).toFixed(1);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Navigator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-bold text-white">Monthly Attendance</h3>
          <p className="text-xs text-slate-400">View detailed daily calendar breakdowns and monthly aggregates.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl">
          <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">On-Time Days</span>
            <span className="text-2xl font-bold text-emerald-400 block">{onTimeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Late Check-ins</span>
            <span className="text-2xl font-bold text-amber-400 block">{lateCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Absent Days</span>
            <span className="text-2xl font-bold text-rose-400 block">{absentCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Monthly Hours</span>
            <span className="text-2xl font-bold text-violet-400 block">{totalWorkedHours}h</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid Calendar Layout */}
      <div className="bg-[#101426]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-[100px] -z-10" />
        
        {/* Days of week labels */}
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <span key={d} className="text-xs font-bold text-slate-500 uppercase tracking-widest py-2">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2.5">
          {calendarDays.map((cell, idx) => {
            if (cell.type === 'empty') {
              return <div key={`empty-${idx}`} className="aspect-square bg-slate-950/20 rounded-xl border border-slate-900/30" />;
            }

            let statusColors = 'bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400';
            if (cell.status === 'On-time') {
              statusColors = 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400';
            } else if (cell.status === 'Late') {
              statusColors = 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 text-amber-400';
            } else if (cell.status === 'Absent') {
              statusColors = 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 text-rose-400';
            } else if (cell.status === 'Weekend') {
              statusColors = 'bg-slate-900/25 border-slate-850/40 text-slate-600';
            }

            return (
              <div
                key={`day-${cell.day}`}
                className={`aspect-square border rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200 group relative ${statusColors}`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold">{cell.day}</span>
                  {cell.status !== 'Weekend' && cell.status !== 'Not Logged' && cell.status !== 'Absent' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                </div>
                
                {/* Micro info on hover or compact view */}
                <div className="hidden sm:block text-[9px] font-semibold mt-2 truncate">
                  {cell.status === 'Weekend' ? (
                    <span className="text-slate-600 uppercase font-bold">Rest</span>
                  ) : cell.status === 'Absent' ? (
                    <span className="text-rose-500 uppercase font-bold">Absent</span>
                  ) : cell.checkIn ? (
                    <span className="text-slate-300 font-mono tracking-tight block">
                      {cell.checkIn}
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </div>

                {/* Desktop hover popup */}
                {cell.day && cell.status !== 'Weekend' && cell.status !== 'Not Logged' && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">{cell.dateStr}</p>
                    <div className="space-y-1 text-xs text-slate-200">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-semibold ${cell.status === 'On-time' ? 'text-emerald-400' : 'text-amber-400'}`}>{cell.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check In:</span>
                        <span className="font-mono text-slate-300">{cell.checkIn || '--:--'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check Out:</span>
                        <span className="font-mono text-slate-300">{cell.checkOut || '--:--'}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 text-[11px] font-bold">
                        <span>Hours:</span>
                        <span className="text-violet-400 font-mono">{cell.hours || '--'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-xs border-t border-slate-900 pt-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/25 border border-emerald-500/50" />
            <span className="text-slate-400 font-medium">On-Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/25 border border-amber-500/50" />
            <span className="text-slate-400 font-medium">Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/25 border border-rose-500/50" />
            <span className="text-slate-400 font-medium">Absent / Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-850" />
            <span className="text-slate-400 font-medium">Weekend / Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
