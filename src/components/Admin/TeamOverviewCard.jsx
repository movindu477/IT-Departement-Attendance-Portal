import React from 'react';
import { Phone, MapPin, Mail, Undo2, Redo2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSmoothNumber } from '../../hooks/useSmoothNumber';

/**
 * Top-left hero card on the Admin dashboard matching the reference UI card
 * style with the soft sky-blue top-left radial glow, team/department details
 * (without any admin portrait image), and smooth 2.2s animated bottom metrics.
 */
const TeamOverviewCard = ({ totals, online, adminEmail, loading, onRefresh, shiftMonth }) => {
  const { user } = useAuth();
  const staffCount = totals?.staffCount ?? 0;
  const daysPresent = totals?.daysPresent ?? 0;
  const onlineCount = online?.length ?? 0;

  const animStaff = useSmoothNumber(loading ? 0 : staffCount, 2200);
  const animDays = useSmoothNumber(loading ? 0 : daysPresent, 2200);
  const animOnline = useSmoothNumber(onlineCount, 2200);
  const animBarFill = useSmoothNumber(100, 2200);

  return (
    <div className="bg-[#F2F4F7] rounded-[20px] p-5 border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.03)] relative overflow-hidden flex flex-col justify-between h-full">
      {/* Soft sky-blue top-left radial glow matching the reference image */}
      <div
        className="pointer-events-none absolute -top-6 -left-6 w-[78%] h-[74%]"
        style={{
          background:
            'radial-gradient(circle at 30% 32%, rgba(142, 198, 255, 0.85) 0%, rgba(182, 218, 255, 0.45) 44%, rgba(242, 244, 247, 0) 76%)',
        }}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between relative z-10 mb-2">
        <h3 className="text-[16px] font-medium text-[#1A1D21] tracking-tight">
          Team details
        </h3>
        <div className="flex items-center gap-2 text-[#1A1D21]">
          <button
            type="button"
            onClick={() => (shiftMonth ? shiftMonth(-1) : onRefresh && onRefresh())}
            title="Previous month"
            className="p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => (shiftMonth ? shiftMonth(1) : onRefresh && onRefresh())}
            title="Next month"
            className="p-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Middle Team/Admin Details (No image on Admin side) */}
      <div className="relative z-10 my-3 py-2 px-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/75 border border-white text-[#2A6CB8] text-[11px] font-medium mb-2.5 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4A90E2]" />
          <span>Admin Control Panel</span>
        </div>

        <h4 className="text-[19px] font-semibold text-[#1A1D21] tracking-tight truncate">
          {user?.name || 'IT Tech Team'}
        </h4>
        <p className="text-[11.5px] text-[#6B7280] mt-0.5 mb-4 truncate">
          Department ID: #APIIT-IT
        </p>

        <div className="space-y-2.5 text-[12.5px] text-[#2C3137]">
          <div className="flex items-center gap-2.5">
            <Phone className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
            <span className="truncate">
              {staffCount} Staff · {onlineCount} Active Now
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
            <span className="truncate">APIIT, Sri Lanka</span>
          </div>
          {adminEmail && (
            <div className="flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-[#374151] shrink-0" strokeWidth={1.8} />
              <span className="truncate" title={adminEmail}>
                {adminEmail}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom 3 Summary Columns with Blue, Orange, and Lime-Green Bars */}
      <div className="relative z-10 grid grid-cols-3 gap-4 pt-3 mt-auto">
        <div>
          <p className="text-[11px] text-[#4B5563] mb-1 truncate">Total Staff</p>
          <p className="text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums">
            {Math.round(animStaff).toLocaleString()}
          </p>
          <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#4A90E2]"
              style={{ width: `${animBarFill}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] text-[#4B5563] mb-1 truncate">Days Present</p>
          <p className="text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums">
            {Math.round(animDays).toLocaleString()}
          </p>
          <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#F5A623]"
              style={{ width: `${animBarFill}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] text-[#4B5563] mb-1 truncate">Online Now</p>
          <p className="text-[25px] font-normal text-[#1A1D21] tracking-tight leading-none mb-2.5 tabular-nums">
            {Math.round(animOnline).toLocaleString()}
          </p>
          <div className="h-[3px] w-full rounded-full bg-[#E2E6EC] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#95D600]"
              style={{ width: `${animBarFill}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamOverviewCard;
