import React from 'react';
import { MapPin, LogIn, Coffee, LogOut } from 'lucide-react';

const AttendanceCard = ({
  currentTime,
  currentDate,
  isCheckedIn,
  isOnBreak,
  checkInTime,
  checkOutTime,
  handleCheckIn,
  handleBreakToggle,
  handleCheckOut
}) => {
  return (
    <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 via-[#101426] to-[#0f1122] border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] -z-10 group-hover:bg-violet-600/15 transition-all duration-700" />
      
      {/* Card Header info */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Attendance Tracker</span>
          <h3 className="text-lg font-bold text-white mt-1">Shift Check-in</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">Office Desk (HQ)</span>
        </div>
      </div>

      {/* Digital Live Clock Section */}
      <div className="my-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono tabular-nums">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {currentDate || 'Loading calendar...'}
          </div>
        </div>

        {/* Quick status mini badges */}
        <div className="grid grid-cols-2 gap-3 max-w-[280px]">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Check-In</span>
            <span className="text-xs text-slate-200 font-semibold">{checkInTime || '--:--'}</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-center">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Check-Out</span>
            <span className="text-xs text-slate-200 font-semibold">{checkOutTime || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* Main Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* BUTTON: CHECK-IN */}
        <button
          onClick={handleCheckIn}
          disabled={isCheckedIn}
          className={`relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide shadow-md transition-all duration-300 ${
            isCheckedIn
              ? 'bg-slate-900/60 border border-slate-800/80 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:shadow-violet-500/25 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <LogIn className="w-4 h-4" />
          Check In
        </button>

        {/* BUTTON: BREAK */}
        <button
          onClick={handleBreakToggle}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold border transition-all duration-300 ${
            isOnBreak
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700/80 text-slate-300'
          } transform hover:-translate-y-0.5 active:translate-y-0`}
        >
          <Coffee className="w-4 h-4" />
          {isOnBreak ? 'End Break' : 'Take Break'}
        </button>

        {/* BUTTON: CHECK-OUT */}
        <button
          onClick={handleCheckOut}
          disabled={!isCheckedIn}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 border ${
            !isCheckedIn
              ? 'bg-slate-900/60 border-slate-800/80 text-slate-500 cursor-not-allowed'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10'
          } transform hover:-translate-y-0.5 active:translate-y-0`}
        >
          <LogOut className="w-4 h-4" />
          Check Out
        </button>
      </div>
    </div>
  );
};

export default AttendanceCard;
