import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import ThemeToggle from '../Layout/ThemeToggle';
import logo2 from '../../assets/images/logo2.png';
import loginBg from '../../assets/images/login.jpg';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      setSuccess('Account created successfully! Preparing to sign in...');
      setIsRedirecting(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-[#F3F4F6] text-[#111315] overflow-y-auto flex items-center justify-center px-6 py-8 sm:px-12 sm:py-10 select-none">
      {/* Top-right smooth theme toggle */}
      <div className="fixed top-5 right-6 z-40">
        <ThemeToggle />
      </div>

      <div
        className={`w-full max-w-[980px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-700 ${
          isRedirecting ? 'opacity-0 scale-[0.98] pointer-events-none' : 'animate-fade-in-up'
        }`}
      >
        {/* ================= LEFT COLUMN: Compact Sign-Up Form ================= */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start">
          <div className="w-full max-w-[295px]">
            <div className="mb-5">
              <img
                src={logo2}
                alt="APIIT"
                className="h-10 w-auto object-contain"
              />
            </div>

            <h1 className="text-[22px] font-bold text-[#111315] tracking-tight mb-4">
              Sign up
            </h1>

            {error && (
              <div className="w-full mb-3.5 flex items-start gap-2 p-3 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in-up relative">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1 pr-4">
                  <p className="text-[11px] text-rose-600 leading-relaxed">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-rose-400 hover:text-rose-700 p-0.5 rounded transition-colors absolute top-2 right-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {success && (
              <div className="w-full mb-3.5 flex items-start gap-2 p-3 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fade-in-up relative">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 pr-4">
                  <p className="text-[11px] text-emerald-700 leading-relaxed">{success}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess('')}
                  className="text-emerald-500 hover:text-emerald-800 p-0.5 rounded transition-colors absolute top-2 right-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#111315] mb-1">
                  Full Name
                </label>
                <div className="flex items-center gap-2.5 bg-white rounded-[8px] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-slate-300 transition-colors">
                  <User className="w-3.5 h-3.5 text-[#4B5563] shrink-0" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-transparent text-[12px] text-[#111315] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111315] mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-2.5 bg-white rounded-[8px] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-slate-300 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#4B5563] shrink-0" strokeWidth={1.8} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Johndoe@gmail.com"
                    required
                    className="w-full bg-transparent text-[12px] text-[#111315] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111315] mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2.5 bg-white rounded-[8px] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-slate-300 transition-colors">
                  <Lock className="w-3.5 h-3.5 text-[#4B5563] shrink-0" strokeWidth={1.8} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full bg-transparent text-[12px] text-[#111315] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-[#6B7280] hover:text-[#111315] cursor-pointer shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#111315] mb-1">
                  Confirm Password
                </label>
                <div className="flex items-center gap-2.5 bg-white rounded-[8px] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-transparent focus-within:border-slate-300 transition-colors">
                  <Lock className="w-3.5 h-3.5 text-[#4B5563] shrink-0" strokeWidth={1.8} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full bg-transparent text-[12px] text-[#111315] placeholder:text-[#9CA3AF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="text-[#6B7280] hover:text-[#111315] cursor-pointer shrink-0"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#161719] hover:bg-black text-white text-[12px] font-semibold transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            <div className="mt-4 space-y-1 text-[11px]">
              <p className="text-[#9CA3AF] whitespace-nowrap">
                Already have an account?{' '}
                <Link to="/login" className="text-[#111315] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Contained Dark Showcase Card ================= */}
        <div className="hidden lg:flex lg:col-span-7 justify-end">
          <div className="w-full max-w-[450px] h-[545px] rounded-[28px] bg-[#0B0C0E] relative overflow-hidden p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
            <img
              src={loginBg}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-35 mix-blend-luminosity pointer-events-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(160deg, rgba(11,12,14,0.55) 0%, rgba(11,12,14,0.88) 55%, rgba(11,12,14,0.96) 100%)',
              }}
            />

            <div className="pointer-events-none absolute -top-10 -right-12 w-72 h-72 rotate-[-38deg] opacity-30">
              <div className="w-full h-3 bg-gradient-to-r from-transparent via-white/50 to-white/80 mb-2" />
              <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-white/30 to-white/60" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center pt-4">
              <div className="mt-auto mb-5">
                <p className="text-[12px] font-medium text-white/90 mb-2">APIIT Portal</p>
                <h2 className="text-[26px] font-semibold text-white tracking-tight leading-snug mb-2.5">
                  Welcome to APIIT
                </h2>
                <p className="text-[11px] text-white/60 leading-relaxed max-w-[330px]">
                  APIIT Attendance Portal helps staff manage daily attendance logs, monitor monthly working hours, and generate payroll timesheets effortlessly.
                </p>
                <p className="text-[11.5px] text-white/85 mt-4 font-normal">
                  Track your attendance and monthly progress in real time
                </p>
              </div>
            </div>

            <div className="relative z-10 bg-[#2C2D30]/95 rounded-[22px] p-6 pr-7 overflow-hidden">
              <div className="hidden sm:block absolute -top-3 -right-3 w-16 h-12 rounded-bl-[20px] bg-[#0B0C0E]" />

              <h3 className="text-[15.5px] font-semibold text-white leading-snug mb-2.5 max-w-[235px]">
                Log your daily hours and export sheets easily
              </h3>

              <div className="flex items-end justify-between gap-3">
                <p className="text-[10.5px] text-white/70 leading-relaxed max-w-[205px]">
                  Record daily check-ins, monitor your monthly target pace, and stay connected with your team.
                </p>

                <div className="flex items-center -space-x-2 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border-2 border-[#2C2D30]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border-2 border-[#2C2D30]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border-2 border-[#2C2D30]"
                  />
                  <span className="w-7 h-7 rounded-full bg-[#141518] border-2 border-white/80 text-white text-[9px] font-semibold flex items-center justify-center">
                    +2
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
