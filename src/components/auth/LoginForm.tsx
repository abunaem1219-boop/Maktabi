import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle, getFriendlyAuthErrorMessage } from '../../firebase/auth';
import { useToast } from '../../context/ToastContext';
import { Eye, EyeOff, LogIn, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onNavigate: (view: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।', 'warning');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      showToast('স্বাগতম! সফলভাবে লগইন হয়েছে।', 'success');
      onNavigate('home');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      showToast('গুগল অ্যাকাউন্ট দিয়ে সফলভাবে প্রবেশ করেছেন।', 'success');
      onNavigate('home');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-stone-900 rounded-3xl shadow-xl shadow-stone-950/5 border border-stone-200 dark:border-stone-800">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
          প্রবেশ করুন
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          আপনার কিতাবখানা অ্যাকাউন্টে লগইন করুন
        </p>
      </div>

      {/* Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium text-stone-700 dark:text-stone-200 transition-all shadow-xs disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-amber-700 dark:text-amber-400" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>Continue with Google</span>
      </button>

      <div className="relative flex items-center justify-center my-6">
        <div className="w-full border-t border-stone-200 dark:border-stone-800" />
        <span className="absolute bg-white dark:bg-stone-900 px-3 text-xs text-stone-400 uppercase tracking-wider">
          অথবা ইমেইলে
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            ইমেইল ঠিকানা
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/50 dark:focus:ring-amber-500/50 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              পাসওয়ার্ড
            </label>
            <button
              type="button"
              onClick={() => onNavigate('forgot-password')}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-850 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/50 dark:focus:ring-amber-500/50 text-sm transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-900/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>প্রবেশ করা হচ্ছে...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>লগইন করুন</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center pt-4 border-t border-stone-200 dark:border-stone-800">
        <p className="text-sm text-stone-600 dark:text-stone-400">
          নতুন পাঠক?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="text-amber-700 dark:text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>নিবন্ধন করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </p>
      </div>
    </div>
  );
};
