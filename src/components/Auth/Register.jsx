import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, Shield, UserPlus } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-black text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-950/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -z-10" />
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Clock className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1 justify-center">
              Valen<span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Time</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Smart Attendance & Workforce Portal</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-6 text-center">Create a new account</h2>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-violet-500 text-sm text-slate-200 transition-colors duration-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. marcus.vance@valentime.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-violet-500 text-sm text-slate-200 transition-colors duration-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-violet-500 text-sm text-slate-200 transition-colors duration-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 focus:outline-none focus:border-violet-500 text-sm text-slate-200 transition-colors duration-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold tracking-wide shadow-md transition-all duration-300 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white hover:shadow-violet-500/25 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-900 text-center text-xs">
          <span className="text-slate-400">Already have an account? </span>
          <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            Sign In
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-violet-500/60" />
          <span>Secure Enterprise Connection</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
