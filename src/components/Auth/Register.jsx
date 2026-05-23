import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';

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
      // Automatically redirect to login page after successful registration as requested
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-6 pb-8 justify-end text-slate-200">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-white tracking-tight">Register</h2>
          <p className="text-sm text-slate-400 mt-2 font-light">Create your account to start tracking your attendance and salary sheets.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/80 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-sm transition-all font-light"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@apiit.lk"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/80 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-sm transition-all font-light"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/80 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-sm transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/80 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-[#C4FF36] hover:bg-[#b5eb32] text-black shadow-md hover:shadow-lg hover:shadow-[#C4FF36]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span className="font-light">Already have an account? </span>
          <Link to="/login" className="font-semibold text-[#C4FF36] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
