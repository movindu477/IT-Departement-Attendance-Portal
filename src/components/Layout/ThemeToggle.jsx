import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Smooth animated pill toggle button for switching between Light and Dark theme.
 */
const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-[68px] h-10 rounded-[12px] p-1 flex items-center justify-between cursor-pointer select-none transition-colors duration-300 border ${
        isDark
          ? 'bg-[#141923] border-[#262F40] shadow-[inset_0_1px_3px_rgba(0,0,0,0.45)]'
          : 'bg-[#F2F4F7] border-white/80 shadow-[0_2px_6px_rgba(15,23,42,0.03)] hover:bg-white'
      } ${className}`}
    >
      {/* Sliding thumb */}
      <span
        className={`absolute top-1 left-1 w-8 h-8 rounded-[9px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDark
            ? 'translate-x-[28px] bg-[#4A90E2] shadow-[0_2px_10px_rgba(74,144,226,0.45)]'
            : 'translate-x-0 bg-[#141619] shadow-[0_2px_8px_rgba(20,22,25,0.22)]'
        }`}
      />

      {/* Sun icon (Light) */}
      <span
        className={`relative z-10 w-8 h-8 flex items-center justify-center transition-all duration-500 ${
          !isDark
            ? 'text-amber-300 scale-100 rotate-0'
            : 'text-[#6B7280] scale-90 -rotate-45 hover:text-slate-300'
        }`}
      >
        <Sun className="w-[15px] h-[15px]" strokeWidth={2.1} />
      </span>

      {/* Moon icon (Dark) */}
      <span
        className={`relative z-10 w-8 h-8 flex items-center justify-center transition-all duration-500 ${
          isDark
            ? 'text-white scale-100 rotate-0'
            : 'text-[#6B7280] scale-90 rotate-45 hover:text-[#1A1D21]'
        }`}
      >
        <Moon className="w-[15px] h-[15px]" strokeWidth={2.1} />
      </span>
    </button>
  );
};

export default ThemeToggle;
