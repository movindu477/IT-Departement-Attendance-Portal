import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ShieldCheck, ArrowLeftCircle, LogOut, Clock } from 'lucide-react';
import { Avatar } from '../Layout/Avatar';

const AdminSidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-surface border-r border-line">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-line">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-brand-ink flex items-center justify-center">
            <Clock className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink">
              Valen<span className="text-mint">Time</span>
            </h1>
            <span className="text-[10px] text-muted font-semibold tracking-widest uppercase">Admin</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <span className="px-3 text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">General</span>
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-raised text-ink">
            <LayoutDashboard className="w-4 h-4 text-mint" />
            Dashboard
          </div>

          <span className="px-3 text-[10px] text-muted font-bold uppercase tracking-wider block mt-5 mb-2">Account</span>
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink-soft hover:bg-raised hover:text-ink transition-colors"
          >
            <ArrowLeftCircle className="w-4 h-4" />
            Back to my portal
          </Link>
        </nav>
      </div>

      <div className="p-4 border-t border-line space-y-3">
        <div className="flex items-center gap-2 text-[11px] text-muted px-2">
          <ShieldCheck className="w-3.5 h-3.5 text-mint" />
          Read-only admin access
        </div>
        <div className="flex items-center gap-3 p-2 rounded-xl bg-raised">
          <Avatar user={user} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-muted truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-lg text-ink-soft hover:text-danger hover:bg-line transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
