import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../utils/uploadAvatar';
import Avatar from './Avatar';

const AvatarUpload = ({ size = 48, status = null }) => {
  const { user, updateAvatar } = useAuth();
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadAvatar(file);
      updateAvatar(url);
      setAlert({ type: 'success', message: 'Photo updated' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
      e.target.value = ''; // allows re-picking the same file
    }
  };

  return (
    <>
      <label
        className={`relative block group ${busy ? 'cursor-wait' : 'cursor-pointer'}`}
        title="Change photo"
      >
        <Avatar user={user} size={size} status={status} />

        {/* Hover / uploading overlay */}
        <span
          className={`absolute inset-0 rounded-xl bg-ink/60 flex items-center justify-center
                      transition-opacity duration-200 ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-surface/40 border-t-white animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-white" />
          )}
        </span>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={busy}
        />
      </label>

      {/* Toast Alert Notification (Bottom Left Corner) */}
      {alert && (
        <div className="fixed bottom-6 left-6 z-[999] w-[calc(100%-3rem)] max-w-sm sm:max-w-md animate-slide-in-bottom-left">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 border-slate-900 shadow-[0_5px_0_0_#0f172a,0_12px_24px_rgba(0,0,0,0.1)] ${alert.type === 'error'
            ? 'bg-rose-50 text-slate-900'
            : 'bg-emerald-50 text-slate-900'
            }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${alert.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-[#b4f481] text-slate-950 border-[#9fe466]'
              }`}>
              {alert.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4 font-bold" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.type === 'error'
                  ? 'bg-rose-200/80 text-rose-800'
                  : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                  {alert.type === 'error' ? 'Notice' : 'Success'}
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed break-words">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;
