import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid, BarChart3, Clock, MessageSquare, Share2, FolderOpen,
  HelpCircle, MoreHorizontal, ChevronsUpDown, ArrowLeftCircle, LogOut,
} from 'lucide-react';
import { Avatar } from '../Layout/Avatar';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
      active ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-violet-300' : 'text-muted'}`} />
    {label}
  </button>
);

const SectionLabel = ({ children }) => (
  <div className="flex items-center justify-between px-3 mb-1.5">
    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{children}</span>
    <MoreHorizontal className="w-3.5 h-3.5 text-muted" />
  </div>
);

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-surface border-r border-line">
      <div>
        {/* Profile header */}
        <div className="p-5 flex items-center gap-3 border-b border-line">
          <Avatar user={user} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-muted truncate">Admin · ValenTime</p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
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

      <div className="p-4 border-t border-line space-y-0.5">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-soft hover:bg-raised hover:text-ink transition-colors"
        >
          <ArrowLeftCircle className="w-4 h-4 text-muted" />
          Back to my portal
        </Link>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-soft hover:bg-raised hover:text-ink transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-muted" />
          Help center
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-soft hover:bg-raised hover:text-danger transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-muted" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
