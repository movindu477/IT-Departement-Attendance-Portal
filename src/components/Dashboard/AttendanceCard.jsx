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
    <div className="lg:col-span-2 bg-surface border border-line rounded-2xl p-6 card-soft relative overflow-hidden flex flex-col justify-between group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] -z-10 group-hover:bg-violet-600/15 transition-all duration-700" />
      
      {/* Card Header info */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-brand uppercase tracking-widest">Attendance Tracker</span>
          <h3 className="text-lg font-bold text-ink mt-1">Shift Check-in</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-subtle/90 px-3 py-1.5 rounded-xl border border-line text-xs font-medium">
          <MapPin className="w-3.5 h-3.5 text-mint-ink animate-pulse" />
          <span className="text-ink-soft">Office Desk (HQ)</span>
        </div>
      </div>

      {/* Digital Live Clock Section */}
      <div className="my-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight font-mono tabular-nums">
            {currentTime || '--:--:--'}
          </div>
          <div className="text-xs text-ink-soft font-medium">
            {currentDate || 'Loading calendar...'}
          </div>
        </div>

        {/* Quick status mini badges */}
        <div className="grid grid-cols-2 gap-3 max-w-[280px]">
          <div className="bg-subtle p-2.5 rounded-xl border border-line text-center">
            <span className="text-[10px] text-muted block uppercase font-bold">Check-In</span>
            <span className="text-xs text-ink font-semibold">{checkInTime || '--:--'}</span>
          </div>
          <div className="bg-subtle p-2.5 rounded-xl border border-line text-center">
            <span className="text-[10px] text-muted block uppercase font-bold">Check-Out</span>
            <span className="text-xs text-ink font-semibold">{checkOutTime || '--:--'}</span>
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
              ? 'bg-subtle/60 border border-line text-muted cursor-not-allowed'
              : 'bg-gradient-to-r from-brand to-brand-ink hover:from-violet-500 hover:to-indigo-500 text-ink hover:shadow-violet-500/25 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
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
              ? 'bg-accent/20 border-amber-500/50 text-amber-700 hover:bg-accent/30'
              : 'bg-subtle border-line hover:bg-subtle hover:border-line-strong/80 text-ink-soft'
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
              ? 'bg-subtle/60 border-line text-muted cursor-not-allowed'
              : 'bg-accent-soft border-accent/30 text-accent hover:bg-rose-100 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10'
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
