import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, CheckCircle2, AlertCircle, X } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      setSuccess('Access granted! Preparing your dashboard...');
      setIsRedirecting(true);
      setTimeout(() => {
        navigate('/');
      }, 1800);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-6 justify-center text-ink">
      <div className={`w-full max-w-md transition-all duration-700 ${isRedirecting ? 'opacity-0 translate-y-[-10px] scale-95 pointer-events-none' : 'animate-fade-in-up'}`}>
        <div className="mb-8">
          <h2 className="text-3xl font-light text-ink tracking-tight">Login</h2>
          <p className="text-sm text-ink-soft mt-2 font-light">Welcome back! Sign in to access your attendance portal.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-950/40 border-l-4 border-rose-500 border border-y-rose-500/20 border-r-rose-500/20 text-accent text-sm shadow-[0_4px_20px_rgba(244,63,94,0.15)] animate-fade-in-up relative group">
            <AlertCircle className="w-5 h-5 text-accent0 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-accent text-xs uppercase tracking-wider mb-0.5">Error Occurred</h4>
              <p className="text-xs text-ink/80 font-light leading-relaxed">{error}</p>
            </div>
            <button 
              type="button"
              onClick={() => setError('')} 
              className="text-accent hover:text-accent p-0.5 rounded-lg hover:bg-accent-soft transition-colors absolute top-3 right-3 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-mint border-l-4 border-mint-ink border border-y-mint-ink/20 border-r-mint-ink/20 text-ink text-sm card-soft animate-fade-in-up relative group">
            <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-brand text-xs uppercase tracking-wider mb-0.5">Success</h4>
              <p className="text-xs text-ink/90 font-light leading-relaxed">{success}</p>
            </div>
            <button 
              type="button"
              onClick={() => setSuccess('')} 
              className="text-brand hover:text-brand-ink p-0.5 rounded-lg hover:bg-brand/10 transition-colors absolute top-3 right-3 opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@apiit.lk"
              className="w-full px-4 py-3 rounded-xl bg-subtle/50 border border-line focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink text-sm transition-all font-light"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-ink-soft uppercase tracking-wider block">Password</label>
              <a href="#" className="text-xs font-semibold text-muted hover:text-brand transition-colors">Forgot?</a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-subtle/50 border border-line focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink text-sm transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold bg-brand hover:bg-brand-ink text-white shadow-md hover:shadow-lg hover:shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-8 text-center text-sm text-ink-soft">
          <span className="font-light">New to the portal? </span>
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
