import React, { useState } from 'react';
import { sendPasswordReset, getFriendlyAuthErrorMessage } from '../../firebase/auth';
import { useToast } from '../../context/ToastContext';
import { Mail, KeyRound, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordFormProps {
  onNavigate: (view: string) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('অনুগ্রহ করে আপনার ইমেইল প্রদান করুন।', 'warning');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSubmitted(true);
      showToast('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।', 'success');
    } catch (err: any) {
      const msg = getFriendlyAuthErrorMessage(err);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-stone-900 rounded-3xl shadow-xl shadow-stone-950/5 border border-stone-200 dark:border-stone-800">
      <button
        onClick={() => onNavigate('login')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>লগইন-এ ফিরে যান</span>
      </button>

      {submitted ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-2">
            ইমেইল পাঠানো হয়েছে
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
            আমরা <strong>{email}</strong> ঠিকানায় পাসওয়ার্ড রিসেট করার নির্দেশনা পাঠিয়েছি। আপনার ইনবক্স অথবা স্প্যাম ফোল্ডার চেক করুন।
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-medium text-sm transition-all shadow-md shadow-amber-900/20"
          >
            লগইন পেজে যান
          </button>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
              পাসওয়ার্ড ভুলে গেছেন?
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              আপনার নিবন্ধিত ইমেইল ঠিকানা দিলে আমরা পাসওয়ার্ড রিসেট লিংক পাঠাব
            </p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-900/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <span>রিসেট লিংক পাঠান</span>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
