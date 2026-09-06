import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatsCard = ({ weeklyHours = 32.5, targetHours = 40.0 }) => {
  const percentage = Math.min((weeklyHours / targetHours) * 100, 100);
  const radius = 52;
  const strokeDasharray = 2 * Math.PI * radius;
  const strokeDashoffset = strokeDasharray * (1 - percentage / 100);

  return (
    <div className="bg-subtle/90 border border-line rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-600/10 rounded-full blur-[60px] -z-10" />
      
      <div>
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Weekly Hours</span>
        <h3 className="text-lg font-bold text-ink mt-1">Weekly Target</h3>
      </div>

      <div className="my-4 flex items-center justify-center relative">
        {/* SVG Radial Progress Circle */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-line fill-none"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-indigo-500 fill-none transition-all duration-500"
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink">{weeklyHours}</span>
          <span className="text-[10px] text-ink-soft font-medium">of {targetHours.toFixed(1)} hrs</span>
        </div>
      </div>

      <div className="flex justify-between items-center bg-subtle border border-line p-3 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 text-ink-soft">
          <TrendingUp className="w-3.5 h-3.5 text-mint-ink" />
          <span>On Track</span>
        </div>
        <span className="text-indigo-400 font-bold">{percentage.toFixed(2)}% Complete</span>
      </div>
    </div>
  );
};

export default StatsCard;
