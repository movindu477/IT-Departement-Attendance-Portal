import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadAvatar } from '../../utils/uploadAvatar';
import Avatar from './Avatar';

// High-resolution portrait fallback matching the reference design when a user
// has not uploaded a custom photo yet (or still has the old 100px seed URL).
const DEFAULT_PORTRAIT =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85';

export function resolveUserPortrait(input) {
  const avatarUrl =
    typeof input === 'string'
      ? input
      : input && typeof input === 'object'
        ? input.avatar || input.photoURL || ''
        : '';
  if (!avatarUrl || typeof avatarUrl !== 'string') return DEFAULT_PORTRAIT;
  // Upgrade low-res w=100 Unsplash seed URLs from registration to high-res w=600
  if (avatarUrl.includes('images.unsplash.com') && avatarUrl.includes('w=100')) {
    return avatarUrl.replace('w=100', 'w=600');
  }
  return avatarUrl;
}

const AvatarUpload = ({ size = 40, status = null, variant = 'compact', className = '' }) => {
  const { user, updateAvatar } = useAuth();
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadAvatar(file);
      setImgError(false);
      updateAvatar(url);
      setAlert({ type: 'success', message: 'Photo updated' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
      e.target.value = ''; // allows re-picking the same file
    }
  };

  const portraitSrc = imgError ? DEFAULT_PORTRAIT : resolveUserPortrait(user?.avatar);

  return (
    <>
      {variant === 'hero' ? (
        <label
          className={`relative block group select-none ${busy ? 'cursor-wait' : 'cursor-pointer'} ${className}`}
          title="Click to change your profile photo"
        >
          {/* Large user portrait with 10px border radius */}
          <div className="relative w-[150px] sm:w-[168px] h-[188px] sm:h-[202px] rounded-[10px] overflow-hidden shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
            <img
              src={portraitSrc}
              alt={user?.name || 'User portrait'}
              onError={() => setImgError(true)}
              className="w-full h-full rounded-[10px] object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          {/* Subtle camera pill on hover / busy spinner */}
          <span
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full
                        bg-[#141619]/75 backdrop-blur-xs text-white text-[11px] font-medium
                        flex items-center gap-1.5 shadow-sm transition-opacity duration-200 ${
                          busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
          >
            {busy ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Photo</span>
              </>
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
      ) : (
        <label
          className={`relative block group ${busy ? 'cursor-wait' : 'cursor-pointer'} ${className}`}
          title="Change photo"
          style={{ width: size, height: size }}
        >
          <div className="w-full h-full rounded-[10px] overflow-hidden bg-[#8EC5FC] border border-white/80 shadow-xs">
            {user?.avatar && !imgError ? (
              <img
                src={resolveUserPortrait(user.avatar)}
                alt={user?.name || 'User avatar'}
                onError={() => setImgError(true)}
                className="w-full h-full rounded-[10px] object-cover object-top"
              />
            ) : (
              <Avatar user={user} size={size} status={status} />
            )}
          </div>

          {/* Hover / uploading overlay */}
          <span
            className={`absolute inset-0 rounded-[10px] bg-slate-900/55 flex items-center justify-center
                        transition-opacity duration-200 ${busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
      )}

      {/* Toast Alert Notification (Bottom Left Corner) */}
      {alert && (
        <div className="fixed bottom-6 left-6 z-[999] w-[calc(100%-3rem)] max-w-sm sm:max-w-md animate-slide-in-bottom-left">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] ${alert.type === 'error'
            ? 'border-rose-200 text-slate-900'
            : 'border-emerald-200 text-slate-900'
            }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${alert.type === 'error'
              ? 'bg-rose-500 text-white border-rose-600'
              : 'bg-emerald-500 text-white border-emerald-600'
              }`}>
              {alert.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4 font-bold" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.type === 'error'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-800'
                  }`}>
                  {alert.type === 'error' ? 'Notice' : 'Success'}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed break-words">{alert.message}</p>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-black/5 transition-colors cursor-pointer shrink-0"
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
