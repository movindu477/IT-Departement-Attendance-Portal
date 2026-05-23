import React, { useState } from 'react';

const REQUIRED_VARS = [
  { name: 'VITE_FIREBASE_API_KEY', desc: 'Firebase Web API Key', placeholder: 'AIzaSy...' },
  { name: 'VITE_FIREBASE_AUTH_DOMAIN', desc: 'Firebase Auth Domain', placeholder: 'your-app.firebaseapp.com' },
  { name: 'VITE_FIREBASE_PROJECT_ID', desc: 'Firebase Project ID', placeholder: 'your-app' },
  { name: 'VITE_FIREBASE_STORAGE_BUCKET', desc: 'Firebase Storage Bucket', placeholder: 'your-app.appspot.com' },
  { name: 'VITE_FIREBASE_MESSAGING_SENDER_ID', desc: 'Firebase Messaging Sender ID', placeholder: '1234567890' },
  { name: 'VITE_FIREBASE_APP_ID', desc: 'Firebase Application ID', placeholder: '1:1234:web:abcd' },
];

export default function SetupGuide({ error }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const envTemplate = REQUIRED_VARS.map(v => `${v.name}=your_value_here`).join('\n');

  const handleCopySingle = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="min-h-screen w-screen bg-[#0b0f19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0b0f19] to-black text-slate-100 flex flex-col justify-center items-center p-6 font-['Poppins',sans-serif]">
      <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-6 relative z-10">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Firebase Configuration Missing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your application database and auth services cannot be initialized. Please configure the required environment variables.
            </p>
          </div>
        </div>

        {/* System Error Detail */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 mb-6 text-xs font-mono text-red-450 relative z-10 flex flex-col gap-1">
            <span className="font-bold text-red-300">System Error Log:</span>
            <span>{error.message || String(error)}</span>
          </div>
        )}

        {/* Tab / Sections */}
        <div className="space-y-6 relative z-10">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
              Step 1: Set up Environment Variables
            </h2>
            <div className="bg-black/40 border border-slate-800/60 rounded-xl overflow-hidden divide-y divide-slate-900">
              {REQUIRED_VARS.map((v, i) => (
                <div key={v.name} className="p-3 flex items-center justify-between gap-4 group hover:bg-slate-800/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-semibold text-violet-400 select-all">{v.name}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{v.desc}</span>
                  </div>
                  <button
                    onClick={() => handleCopySingle(v.name, i)}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-450 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5 shrink-0"
                    title="Copy variable name"
                  >
                    {copiedIndex === i ? 'Copied' : 'Copy Key'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Step 2: Deployment Guide (Vercel)
              </h2>
              <button
                onClick={handleCopyAll}
                className="text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                {copiedAll ? '✓ Copied template' : 'Copy .env template'}
              </button>
            </div>
            <div className="space-y-3 text-sm text-slate-455 leading-relaxed font-light">
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] flex items-center justify-center font-bold text-slate-300 shrink-0 mt-0.5">1</span>
                <p>
                  Log in to your <span className="text-white font-normal">Vercel Dashboard</span> and select your attendance portal project.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] flex items-center justify-center font-bold text-slate-300 shrink-0 mt-0.5">2</span>
                <p>
                  Go to <span className="text-white font-normal">Settings</span> &gt; <span className="text-white font-normal">Environment Variables</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] flex items-center justify-center font-bold text-slate-300 shrink-0 mt-0.5">3</span>
                <p>
                  Add each environment variable name above along with its corresponding value from your Firebase console, or paste the entire <span className="text-white font-normal">.env template</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] flex items-center justify-center font-bold text-slate-300 shrink-0 mt-0.5">4</span>
                <p>
                  Go to the <span className="text-white font-normal">Deployments</span> tab and click <span className="text-white font-normal">Redeploy</span> to apply the configuration.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500 relative z-10">
          <span>Attendance Portal Setup Assistant</span>
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 transition-colors font-medium flex items-center gap-1"
          >
            Firebase Console
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
