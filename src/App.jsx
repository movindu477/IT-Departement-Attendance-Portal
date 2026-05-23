import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import MonthlyReport from './components/Reports/MonthlyReport';
import ReportGenerator from './components/Reports/ReportGenerator';
import { getCheckInStatus, formatTime, formatDate, formatLongDate } from './utils/attendanceUtils';
import { Search, CheckCircle, AlertCircle, Coffee } from 'lucide-react';

// Teammates mock data
const initialTeammates = [
  { name: 'Sarah Connor', role: 'UI/UX Designer', status: 'present', time: '08:45 AM', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100' },
  { name: 'Alex Mercer', role: 'Backend Engineer', status: 'present', time: '09:02 AM', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
  { name: 'Elena Rostova', role: 'Product Manager', status: 'break', time: '12:15 PM', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100' },
  { name: 'David Kim', role: 'Frontend Lead', status: 'absent', time: '-', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
];

// Log mock data
const initialLogs = [
  { id: 1, date: 'May 22, 2026', checkIn: '08:58 AM', checkOut: '05:30 PM', status: 'On-time', hours: '8.5h' },
  { id: 2, date: 'May 21, 2026', checkIn: '09:05 AM', checkOut: '05:00 PM', status: 'On-time', hours: '8.0h' },
  { id: 3, date: 'May 20, 2026', checkIn: '09:15 AM', checkOut: '06:00 PM', status: 'Late', hours: '8.75h' },
  { id: 4, date: 'May 19, 2026', checkIn: '08:50 AM', checkOut: '05:25 PM', status: 'On-time', hours: '8.5h' },
];

function MainLayout({
  currentTime,
  currentDate,
  isCheckedIn,
  isOnBreak,
  toast,
  showToast,
  children
}) {
  const location = useLocation();

  // Helper to compute section title from route path
  const getRouteTitle = (pathname) => {
    if (pathname === '/') return 'dashboard';
    if (pathname === '/history') return 'attendance history';
    if (pathname === '/reports/monthly') return 'monthly overview';
    if (pathname === '/reports/generator') return 'report generator';
    if (pathname === '/team') return 'my team';
    return 'overview';
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-black text-slate-100 flex flex-col md:flex-row">
      <Sidebar isCheckedIn={isCheckedIn} isOnBreak={isOnBreak} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Navbar title={getRouteTitle(location.pathname)} currentDate={currentDate} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {children ? children : <Outlet />}
        </div>
      </main>

      {/* TOAST NOTIFICATION CONTAINER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' 
              : toast.type === 'error' 
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/30' 
                : 'bg-slate-900/95 text-slate-200 border-slate-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// History View Page
function HistoryPage({ logs }) {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log =>
    log.date.toLowerCase().includes(search.toLowerCase()) ||
    log.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Full Attendance Logs</h3>
            <p className="text-xs text-slate-400">Total record history of logins, check-ins, and breaks</p>
          </div>
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dates or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 focus:outline-none focus:border-violet-500 text-xs text-slate-200 transition-colors duration-200"
            />
          </div>
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
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-white">{log.date}</td>
                  <td className="px-6 py-4 text-slate-300">{log.checkIn}</td>
                  <td className="px-6 py-4 text-slate-300">{log.checkOut}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'On-time' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{log.hours}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-medium text-slate-400 hover:text-white transition-colors duration-150">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Team View Page
function TeamPage() {
  const [teammates] = useState(initialTeammates);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teammates.map((member, index) => (
          <div key={index} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-6 rounded-2xl text-center shadow-lg relative group overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            
            <div className="relative inline-block mx-auto mb-4">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover mx-auto ring-4 ring-slate-900 group-hover:ring-violet-500/20 transition-all duration-300"
              />
              <span className={`absolute bottom-0 right-1.5 w-4 h-4 rounded-full border-3 border-slate-900 ${
                member.status === 'present' 
                  ? 'bg-emerald-500' 
                  : member.status === 'break' 
                    ? 'bg-amber-500 animate-pulse' 
                    : 'bg-slate-500'
              }`} />
            </div>

            <h4 className="font-bold text-white mb-0.5">{member.name}</h4>
            <p className="text-xs text-slate-400 mb-4">{member.role}</p>

            <div className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-semibold capitalize ${
                  member.status === 'present' 
                    ? 'text-emerald-400' 
                    : member.status === 'break' 
                      ? 'text-amber-400' 
                      : 'text-slate-400'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logged In</span>
                <span className="text-slate-300 font-medium">{member.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  // Live Date/Time States
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Interactive States
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  
  // Persist logs in localStorage for rich UX
  const [logs, setLogs] = useState(() => {
    const stored = localStorage.getItem('valentime_logs');
    return stored ? JSON.parse(stored) : initialLogs;
  });

  // Save logs when they change
  useEffect(() => {
    localStorage.setItem('valentime_logs', JSON.stringify(logs));
  }, [logs]);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Effect to update time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(formatTime(now));
      setCurrentDate(formatLongDate(now));
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Trigger Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Handle Check-In / Check-Out Actions
  const handleCheckIn = () => {
    if (!isCheckedIn) {
      const now = new Date();
      const timeStr = formatTime(now);
      
      setIsCheckedIn(true);
      setCheckInTime(timeStr);
      setCheckOutTime(null);
      showToast(`Successfully checked in at ${timeStr}!`, 'success');

      // Prepend to logs
      const status = getCheckInStatus(now);
      const newLog = {
        id: Date.now(),
        date: formatDate(now),
        checkIn: timeStr,
        checkOut: '--:--',
        status: status,
        hours: '--'
      };
      setLogs([newLog, ...logs]);
    }
  };

  const handleBreakToggle = () => {
    if (!isCheckedIn) {
      showToast('You must check in first before taking a break!', 'error');
      return;
    }

    const nextBreakState = !isOnBreak;
    setIsOnBreak(nextBreakState);
    
    if (nextBreakState) {
      showToast('Break started. Enjoy your coffee!', 'info');
    } else {
      showToast('Break ended. Welcome back to work!', 'success');
    }
  };

  const handleCheckOut = () => {
    if (isCheckedIn) {
      const now = new Date();
      const timeStr = formatTime(now);
      
      setIsCheckedIn(false);
      setIsOnBreak(false);
      setCheckOutTime(timeStr);
      showToast(`Successfully checked out at ${timeStr}!`, 'info');

      // Update the top log with checkout time
      setLogs(prevLogs => {
        const updated = [...prevLogs];
        if (updated.length > 0 && updated[0].checkOut === '--:--') {
          updated[0].checkOut = timeStr;
          updated[0].hours = '8.25h'; // mock checkout duration
        }
        return updated;
      });
    }
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes Wrapper */}
          <Route element={<PrivateRoute />}>
            <Route
              path="/"
              element={
                <MainLayout
                  currentTime={currentTime}
                  currentDate={currentDate}
                  isCheckedIn={isCheckedIn}
                  isOnBreak={isOnBreak}
                  toast={toast}
                  showToast={showToast}
                >
                  <Dashboard
                    currentTime={currentTime}
                    currentDate={currentDate}
                    isCheckedIn={isCheckedIn}
                    isOnBreak={isOnBreak}
                    checkInTime={checkInTime}
                    checkOutTime={checkOutTime}
                    handleCheckIn={handleCheckIn}
                    handleBreakToggle={handleBreakToggle}
                    handleCheckOut={handleCheckOut}
                    logs={logs}
                  />
                </MainLayout>
              }
            />
            <Route
              path="/history"
              element={
                <MainLayout
                  currentTime={currentTime}
                  currentDate={currentDate}
                  isCheckedIn={isCheckedIn}
                  isOnBreak={isOnBreak}
                  toast={toast}
                  showToast={showToast}
                >
                  <HistoryPage logs={logs} />
                </MainLayout>
              }
            />
            <Route
              path="/reports/monthly"
              element={
                <MainLayout
                  currentTime={currentTime}
                  currentDate={currentDate}
                  isCheckedIn={isCheckedIn}
                  isOnBreak={isOnBreak}
                  toast={toast}
                  showToast={showToast}
                >
                  <MonthlyReport logs={logs} />
                </MainLayout>
              }
            />
            <Route
              path="/reports/generator"
              element={
                <MainLayout
                  currentTime={currentTime}
                  currentDate={currentDate}
                  isCheckedIn={isCheckedIn}
                  isOnBreak={isOnBreak}
                  toast={toast}
                  showToast={showToast}
                >
                  <ReportGenerator logs={logs} />
                </MainLayout>
              }
            />
            <Route
              path="/team"
              element={
                <MainLayout
                  currentTime={currentTime}
                  currentDate={currentDate}
                  isCheckedIn={isCheckedIn}
                  isOnBreak={isOnBreak}
                  toast={toast}
                  showToast={showToast}
                >
                  <TeamPage />
                </MainLayout>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
