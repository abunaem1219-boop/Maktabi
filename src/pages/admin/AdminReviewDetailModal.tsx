import React, { useState } from 'react';
import { SubmissionRecord } from '../../types/book';
import {
  approveAndPublishBook,
  requestChangesBook,
  rejectSubmissionBook,
  unpublishBookAdmin,
  getSubmissionById,
} from '../../services/publishingService';
import { AdminReviewReader } from './AdminReviewReader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatBengaliDate, toBengaliNumerals } from '../../utils/formatters';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
  Clock,
  Tag,
  BookOpen,
  Send,
  Loader2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AdminReviewDetailModalProps {
  submission: SubmissionRecord;
  isOpen: boolean;
  onClose: () => void;
  onDecisionApplied: () => void;
}

export const AdminReviewDetailModal: React.FC<AdminReviewDetailModalProps> = ({
  submission,
  isOpen,
  onClose,
  onDecisionApplied,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'reader' | 'metadata'>('reader');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Sub-dialogs
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRequestChangesDialog, setShowRequestChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  // Inputs
  const [internalNote, setInternalNote] = useState('');
  const [authorMessage, setAuthorMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isOpen) return null;

  // Safe transaction check: verify status hasn't changed remotely
  const verifyCurrentStatus = async (): Promise<boolean> => {
    const current = await getSubmissionById(submission.submissionId);
    if (!current) {
      showToast('সাবমিশনটি আর ডাটাবেসে পাওয়া যায়নি।', 'error');
      return false;
    }
    if (current.status !== submission.status) {
      showToast('এই কিতাবের স্ট্যাটাস অন্য কেউ ইতোমধ্যে পরিবর্তন করেছেন। অনুগ্রহ করে রিফ্রেশ করুন।', 'warning');
      onDecisionApplied();
      return false;
    }
    return true;
  };

  // 1. Approve
  const handleApprove = async () => {
    if (!user) return;
    const ok = await verifyCurrentStatus();
    if (!ok) return;

    setLoadingAction('approve');
    try {
      await approveAndPublishBook(
        submission.submissionId,
        user.uid,
        internalNote.trim(),
        authorMessage.trim()
      );
      showToast('কিতাবটি সফলভাবে অনুমোদিত এবং লাইব্রেরিতে প্রকাশিত হয়েছে!', 'success');
      setShowApproveDialog(false);
      onDecisionApplied();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Request Changes
  const handleRequestChanges = async () => {
    if (!user) return;
    if (!authorMessage.trim()) {
      showToast('লেখককে কি কি পরিবর্তন করতে হবে তা লিখে জানানো আবশ্যক।', 'warning');
      return;
    }

    const ok = await verifyCurrentStatus();
    if (!ok) return;

    setLoadingAction('request_changes');
    try {
      await requestChangesBook(
        submission.submissionId,
        user.uid,
        authorMessage.trim(),
        internalNote.trim()
      );
      showToast('লেখকের কাছে পরিবর্তনের নির্দেশনা সফলভাবে পাঠানো হয়েছে।', 'info');
      setShowRequestChangesDialog(false);
      onDecisionApplied();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'পরিবর্তন অনুরোধ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Reject
  const handleReject = async () => {
    if (!user) return;
    if (!rejectionReason.trim()) {
      showToast('প্রত্যাখ্যানের নির্দিষ্ট কারণ উল্লেখ করা আবশ্যক।', 'warning');
      return;
    }

    const ok = await verifyCurrentStatus();
    if (!ok) return;

    setLoadingAction('reject');
    try {
      await rejectSubmissionBook(
        submission.submissionId,
        user.uid,
        rejectionReason.trim(),
        internalNote.trim()
      );
      showToast('কিতাবটি প্রত্যাখ্যাত হিসেবে চিহ্নিত করা হয়েছে।', 'info');
      setShowRejectDialog(false);
      onDecisionApplied();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'প্রত্যাখ্যান ব্যর্থ হয়েছে।', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Unpublish
  const handleUnpublish = async () => {
    if (!user) return;
    setLoadingAction('unpublish');
    try {
      await unpublishBookAdmin(submission.bookId, user.uid, internalNote.trim());
      showToast('কিতাবটি লাইব্রেরি থেকে আনপাবলিশ করা হয়েছে।', 'info');
      setShowUnpublishDialog(false);
      onDecisionApplied();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'আনপাবলিশ ব্যর্থ হয়েছে।', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50/80 dark:bg-stone-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                  {submission.bookTitle}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {submission.revisionId}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                লেখক: {submission.authorName} | জমা: {formatBengaliDate(submission.submittedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center px-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-semibold gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('reader')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'reader'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>সম্পূর্ণ পান্ডুলিপি পাঠ (Reader)</span>
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>মেটাডাটা ও বিশদ তথ্য</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'reader' ? (
            <AdminReviewReader bookId={submission.bookId} bookTitle={submission.bookTitle} />
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Cover & Metadata Card */}
              <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
                {submission.coverUrl ? (
                  <img
                    src={submission.coverUrl}
                    alt={submission.bookTitle}
                    className="w-36 h-48 object-cover rounded-2xl shadow-md border border-stone-200 dark:border-stone-700 shrink-0 mx-auto sm:mx-0"
                  />
                ) : (
                  <div className="w-36 h-48 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 mx-auto sm:mx-0 shrink-0">
                    <BookOpen className="w-10 h-10" />
                  </div>
                )}

                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                      {submission.bookTitle}
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-300 font-medium mt-0.5">
                      লেখক: {submission.authorName}
                      {submission.publisherName ? ` | প্রকাশনী: ${submission.publisherName}` : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-stone-400 block">ক্যাটাগরি</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {submission.categoryName || submission.categoryId}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                      <span className="text-stone-400 block">মোট কলেবর</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {toBengaliNumerals(submission.totalChapters)} অধ্যায় ({toBengaliNumerals(submission.totalWords)} শব্দ)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                      বিবরণ বা পরিচিতি
                    </span>
                    <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                      {submission.description || 'কোনো বিবরণ দেওয়া হয়নি।'}
                    </p>
                  </div>

                  {submission.tags && submission.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {submission.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Admin Feedback / Notes (If any) */}
              {(submission.authorMessage || submission.rejectionReason) && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">
                    পূর্ববর্তী পর্যালোচনার বার্তা (Previous Feedback)
                  </span>
                  <p className="text-stone-700 dark:text-stone-300">
                    {submission.authorMessage || submission.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Bar */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">বর্তমান স্ট্যাটাস:</span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                submission.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : submission.status === 'changes_requested'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : submission.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              }`}
            >
              {submission.status === 'published'
                ? 'প্রকাশিত'
                : submission.status === 'changes_requested'
                ? 'পরিবর্তন প্রয়োজন'
                : submission.status === 'rejected'
                ? 'প্রত্যাখ্যাত'
                : 'রিভিউয়ের অপেক্ষায়'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {submission.status === 'published' ? (
              <button
                onClick={() => setShowUnpublishDialog(true)}
                className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-colors"
              >
                আনপাবলিশ করুন
              </button>
            ) : (
              <>
                {/* Reject Button */}
                <button
                  onClick={() => setShowRejectDialog(true)}
                  className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                >
                  প্রত্যাখ্যান
                </button>

                {/* Request Changes Button */}
                <button
                  onClick={() => setShowRequestChangesDialog(true)}
                  className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold transition-colors"
                >
                  পরিবর্তন চাই
                </button>

                {/* Approve Button */}
                <button
                  onClick={() => setShowApproveDialog(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>অনুমোদন ও প্রকাশ</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 1. APPROVE CONFIRMATION DIALOG */}
        {showApproveDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-purple-300 dark:border-purple-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    প্রকাশনার জন্য অনুমোদন করবেন?
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    অনুমোদন করলে এটি পাবলিক লাইব্রেরিতে পাঠকদের জন্য উন্মুক্ত হবে।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  লেখকের জন্য অভিনন্দন বা বার্তা (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={authorMessage}
                  onChange={(e) => setAuthorMessage(e.target.value)}
                  placeholder="যেমন: অসাধারণ সাহিত্যকর্ম! কিতাবটি পাঠকদের জন্য উন্মুক্ত করা হলো।"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loadingAction === 'approve'}
                  onClick={() => setShowApproveDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={loadingAction === 'approve'}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {loadingAction === 'approve' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>হ্যাঁ, অনুমোদন ও প্রকাশ করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. REQUEST CHANGES DIALOG */}
        {showRequestChangesDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-amber-300 dark:border-amber-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    পরিবর্তনের জন্য নির্দেশনা দিন
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    লেখক আপনার নির্দেশনা অনুযায়ী লেখা সংশোধন করে পুনরায় জমা দিতে পারবেন।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  লেখকের জন্য সংশোধন বার্তা * (আবশ্যক)
                </label>
                <textarea
                  rows={3}
                  required
                  value={authorMessage}
                  onChange={(e) => setAuthorMessage(e.target.value)}
                  placeholder="যেমন: অধ্যায় ৩-এর তথ্যে কিছু অসঙ্গতি আছে, কভার ছবির রেজোলিউশন বৃদ্ধি করুন..."
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loadingAction === 'request_changes'}
                  onClick={() => setShowRequestChangesDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={loadingAction === 'request_changes' || !authorMessage.trim()}
                  onClick={handleRequestChanges}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md disabled:opacity-40"
                >
                  {loadingAction === 'request_changes' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>পরিবর্তনের বার্তা পাঠান</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. REJECT DIALOG */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-rose-300 dark:border-rose-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    কিতাব প্রত্যাখ্যান করবেন?
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    প্রত্যাখ্যান করার জন্য নির্দিষ্ট কারণ উল্লেখ করা আবশ্যক।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  প্রত্যাখ্যানের কারণ * (আবশ্যক)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="যেমন: এই কিতাবের বিষয়বস্তু আমাদের প্রকাশনা নীতিমালার সাথে সংগতিপূর্ণ নয়।"
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loadingAction === 'reject'}
                  onClick={() => setShowRejectDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={loadingAction === 'reject' || !rejectionReason.trim()}
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-40"
                >
                  {loadingAction === 'reject' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>প্রত্যাখ্যান নিশ্চিত করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. UNPUBLISH DIALOG */}
        {showUnpublishDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-rose-300 dark:border-rose-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    কিতাবটি লাইব্রেরি থেকে সরাবেন?
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    এটি লাইব্রেরি থেকে অপ্রকাশিত (Unpublished) করা হবে। লেখকের মূল লেখা মুছে যাবে না।
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loadingAction === 'unpublish'}
                  onClick={() => setShowUnpublishDialog(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={loadingAction === 'unpublish'}
                  onClick={handleUnpublish}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {loadingAction === 'unpublish' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>হ্যাঁ, আনপাবলিশ করুন</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
