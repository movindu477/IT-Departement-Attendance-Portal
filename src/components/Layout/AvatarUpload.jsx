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
          className={`absolute inset-0 rounded-xl bg-slate-950/70 flex items-center justify-center
                      transition-opacity duration-200 ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 text-violet-200" />
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

      {/* Toast Alert Notification */}
      {alert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md animate-fade-in-up">
          <div className={`flex items-start gap-3 p-4 rounded-xl backdrop-blur-md shadow-xl border ${
            alert.type === 'error'
              ? 'bg-[#1a0e12]/90 border-l-4 border-rose-500 border-y-rose-500/20 border-r-rose-500/20 text-slate-200 shadow-[0_4px_20px_rgba(244,63,94,0.2)]'
              : 'bg-[#0f1d13]/90 border-l-4 border-[#C4FF36] border-y-[#C4FF36]/20 border-r-[#C4FF36]/20 text-slate-200 shadow-[0_4px_20px_rgba(196,255,54,0.2)]'
          }`}>
            {alert.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#C4FF36] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-left">
              <h4 className={`font-semibold text-xs uppercase tracking-wider mb-0.5 ${alert.type === 'error' ? 'text-rose-400' : 'text-[#C4FF36]'}`}>
                {alert.type === 'error' ? 'Error' : 'Success'}
              </h4>
              <p className="text-xs text-slate-200/90 font-light leading-relaxed">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                alert.type === 'error'
                  ? 'text-rose-400 hover:bg-rose-500/10 hover:text-white'
                  : 'text-[#C4FF36] hover:bg-[#C4FF36]/10 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;
