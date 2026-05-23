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
    <div className="h-full w-full flex flex-col items-center px-6 pb-36 justify-end">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-slate-800 tracking-tight">Register</h2>
          <p className="text-sm text-slate-500 mt-2 font-light">Create your account to start tracking your attendance and salary sheets.</p>
        </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Marcus Vance"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-800 text-sm transition-all font-light"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. yourname@apiit.lk"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-800 text-sm transition-all font-light"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-800 text-sm transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-800 text-sm transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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

      <div className="mt-8 text-center text-sm text-slate-500">
        <span className="font-light">Already have an account? </span>
        <Link to="/login" className="font-semibold text-slate-900 hover:underline">
          Sign In
        </Link>
      </div>
      </div>
    </div>
  );
};

export default Register;
