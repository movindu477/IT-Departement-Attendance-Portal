import React from 'react';
import { Link } from 'react-router-dom';
import AttendanceCard from './AttendanceCard';
import StatsCard from './StatsCard';
import { getSummaryStats } from '../../utils/reportUtils';
import { Clock, CheckCircle, User, ArrowRight } from 'lucide-react';

const Dashboard = ({
  currentTime,
  currentDate,
  isCheckedIn,
  isOnBreak,
  checkInTime,
  checkOutTime,
  handleCheckIn,
  handleBreakToggle,
  handleCheckOut,
  logs
}) => {
  const stats = getSummaryStats(logs);

  return (
    <div className="space-y-8">
      {/* CLOCK-IN WIDGET & STATS TARGET GROUP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AttendanceCard
          currentTime={currentTime}
          currentDate={currentDate}
          isCheckedIn={isCheckedIn}
          isOnBreak={isOnBreak}
          checkInTime={checkInTime}
          checkOutTime={checkOutTime}
          handleCheckIn={handleCheckIn}
          handleBreakToggle={handleBreakToggle}
          handleCheckOut={handleCheckOut}
        />
        <StatsCard />
      </div>

      {/* THREE COLUMN SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl shadow-md flex items-center justify-between group hover:border-slate-700 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Average Arrival</span>
            <span className="text-2xl font-bold text-white tracking-tight">{stats.averageArrival}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl shadow-md flex items-center justify-between group hover:border-slate-700 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Attendance Rate</span>
            <span className="text-2xl font-bold text-white tracking-tight">{stats.attendanceRate}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-200">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl shadow-md flex items-center justify-between group hover:border-slate-700 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Leave Balance</span>
            <span className="text-2xl font-bold text-white tracking-tight">12.5 Days</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* RECENT LOGS SECTION */}
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Attendance Logs</h3>
            <p className="text-xs text-slate-400">Review your check-in history for the past few days</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 hover:gap-1.5 transition-all duration-200"
          >
            View All Logs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-850 text-xs text-slate-400 font-medium uppercase">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {logs.slice(0, 3).map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-white">{log.date}</td>
                  <td className="px-6 py-4 text-slate-300">{log.checkIn}</td>
                  <td className="px-6 py-4 text-slate-300">{log.checkOut}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'On-time'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{log.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
