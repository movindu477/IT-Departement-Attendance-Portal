import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid, BarChart3, Clock, MessageSquare, Share2, FolderOpen,
  HelpCircle, Settings, MoreHorizontal, ChevronsUpDown, ArrowLeftCircle, LogOut,
} from 'lucide-react';
import { Avatar } from '../Layout/Avatar';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
      active ? 'bg-violet-50 text-violet-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-violet-600' : 'text-gray-400'}`} />
    {label}
  </button>
);

const SectionLabel = ({ children }) => (
  <div className="flex items-center justify-between px-3 mb-1.5">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{children}</span>
    <MoreHorizontal className="w-3.5 h-3.5 text-gray-300" />
  </div>
);

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-white border-r border-gray-100">
      <div>
        {/* Profile header */}
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <Avatar user={user} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-gray-400 truncate">Admin · ValenTime</p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300 shrink-0" />
        </div>

        <nav className="p-4 space-y-5">
          <div>
            <SectionLabel>General</SectionLabel>
            <div className="space-y-0.5">
              <NavItem icon={LayoutGrid} label="Dashboard" active />
            </div>
          </div>

          <div>
            <SectionLabel>Overview</SectionLabel>
            <div className="space-y-0.5">
              <NavItem icon={BarChart3} label="Payroll analytics" />
              <NavItem icon={Clock} label="Attendance log" />
            </div>
          </div>

          <div>
            <SectionLabel>Collaboration</SectionLabel>
            <div className="space-y-0.5">
              <NavItem icon={MessageSquare} label="Team" />
              <NavItem icon={Share2} label="Presence" />
              <NavItem icon={FolderOpen} label="Reports" />
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100 space-y-0.5">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftCircle className="w-4 h-4 text-gray-400" />
          Back to my portal
        </Link>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-gray-400" />
          Help center
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
