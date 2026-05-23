import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-6 pb-36 justify-end text-slate-200">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h2 className="text-3xl font-light text-white tracking-tight">Login</h2>
          <p className="text-sm text-slate-400 mt-2 font-light">Welcome back! Sign in to access your attendance portal.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
              <a href="#" className="text-xs font-semibold text-slate-500 hover:text-[#C4FF36] transition-colors">Forgot?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/80 focus:outline-none focus:border-[#C4FF36] focus:ring-1 focus:ring-[#C4FF36] text-white text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-[#C4FF36] hover:bg-[#b5eb32] text-black shadow-md hover:shadow-lg hover:shadow-[#C4FF36]/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span className="font-light">New to the portal? </span>
          <Link to="/register" className="font-semibold text-[#C4FF36] hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
