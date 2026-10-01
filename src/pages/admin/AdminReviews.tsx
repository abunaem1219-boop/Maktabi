import React, { useState, useEffect, useCallback } from 'react';
import { SubmissionRecord, AdminAuditLog } from '../../types/book';
import {
  getAllSubmissionsAdmin,
  getAdminAuditLogs,
} from '../../services/publishingService';
import { AdminReviewDetailModal } from './AdminReviewDetailModal';
import { formatBengaliDate, toBengaliNumerals } from '../../utils/formatters';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Send,
  Loader2,
  Layers,
  History,
  ShieldCheck,
  Eye,
  RotateCcw,
} from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'queue' vs 'audit'
  const [subTab, setSubTab] = useState<'queue' | 'audit'>('queue');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected submission for detail review modal
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [subs, logs] = await Promise.all([
        getAllSubmissionsAdmin(),
        getAdminAuditLogs(100),
      ]);
      setSubmissions(subs);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real counts
  const pendingCount = submissions.filter((s) => s.status === 'pending_review').length;
  const changesCount = submissions.filter((s) => s.status === 'changes_requested').length;
  const approvedCount = submissions.filter((s) => s.status === 'published' || s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = s.bookTitle.toLowerCase().includes(q);
      const matchAuthor = s.authorName.toLowerCase().includes(q);
      const matchId = s.submissionId.toLowerCase().includes(q) || s.bookId.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setSubTab('queue');
            setStatusFilter('pending_review');
          }}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            statusFilter === 'pending_review' && subTab === 'queue'
              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-700 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">রিভিউয়ের অপেক্ষায়</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-2">
            {toBengaliNumerals(pendingCount)}
          </p>
          <span className="text-[10px] text-stone-400">পর্যালোচনার অপেক্ষায়</span>
        </div>

        <div
          onClick={() => {
            setSubTab('queue');
            setStatusFilter('changes_requested');
          }}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            statusFilter === 'changes_requested' && subTab === 'queue'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">পরিবর্তন প্রয়োজন</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-2">
            {toBengaliNumerals(changesCount)}
          </p>
          <span className="text-[10px] text-stone-400">লেখককে নির্দেশনা পাঠানো</span>
        </div>

        <div
          onClick={() => {
            setSubTab('queue');
            setStatusFilter('published');
          }}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            statusFilter === 'published' && subTab === 'queue'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">অনুমোদিত ও প্রকাশিত</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
            {toBengaliNumerals(approvedCount)}
          </p>
          <span className="text-[10px] text-stone-400">লাইব্রেরিতে সক্রিয়</span>
        </div>

        <div
          onClick={() => {
            setSubTab('queue');
            setStatusFilter('rejected');
          }}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            statusFilter === 'rejected' && subTab === 'queue'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-700 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">প্রত্যাখ্যাত</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-2">
            {toBengaliNumerals(rejectedCount)}
          </p>
          <span className="text-[10px] text-stone-400">বাতিলকৃত কিতাব</span>
        </div>
      </div>

      {/* Main Switcher: Queue vs Audit Trail */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'queue'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>রিভিউ কিউ ({toBengaliNumerals(submissions.length)})</span>
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'audit'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>অ্যাডমিন অডিট লগ ({toBengaliNumerals(auditLogs.length)})</span>
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          title="রিফ্রেশ করুন"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: REVIEW QUEUE */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শিরোনাম বা লেখক দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                সব
              </button>
              <button
                onClick={() => setStatusFilter('pending_review')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === 'pending_review'
                    ? 'bg-purple-700 text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                রিভিউ বাকি
              </button>
              <button
                onClick={() => setStatusFilter('changes_requested')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === 'changes_requested'
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                পরিবর্তন বাকি
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === 'published'
                    ? 'bg-emerald-700 text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                প্রকাশিত
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === 'rejected'
                    ? 'bg-rose-700 text-white'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                প্রত্যাখ্যাত
              </button>
            </div>
          </div>

          {/* Submissions List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-stone-500 gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="text-xs font-semibold">সাবমিশন তালিকা লোড হচ্ছে...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
              <Clock className="w-10 h-10 text-stone-400 mx-auto" />
              <h4 className="text-base font-bold text-stone-800 dark:text-stone-200">
                বর্তমানে কোনো কিতাব রিভিউয়ের অপেক্ষায় নেই
              </h4>
              <p className="text-xs text-stone-400">
                নতুন কোনো লেখক কিতাব জমা দিলে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.submissionId}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-800 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {sub.coverUrl ? (
                      <img
                        src={sub.coverUrl}
                        alt={sub.bookTitle}
                        className="w-14 h-20 object-cover rounded-xl shadow-xs shrink-0 border border-stone-200 dark:border-stone-800"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                          {sub.bookTitle}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
                          {sub.revisionId}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        লেখক: <span className="font-semibold text-stone-800 dark:text-stone-200">{sub.authorName}</span>{' '}
                        | ক্যাটাগরি: {sub.categoryName || sub.categoryId}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-stone-400 pt-1 flex-wrap">
                        <span>জমা: {formatBengaliDate(sub.submittedAt)}</span>
                        <span>•</span>
                        <span>{toBengaliNumerals(sub.totalChapters)} অধ্যায় ({toBengaliNumerals(sub.totalWords)} শব্দ)</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Review CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : sub.status === 'changes_requested'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}
                    >
                      {sub.status === 'published'
                        ? 'প্রকাশিত'
                        : sub.status === 'changes_requested'
                        ? 'পরিবর্তন প্রয়োজন'
                        : sub.status === 'rejected'
                        ? 'প্রত্যাখ্যাত'
                        : 'রিভিউয়ের অপেক্ষায়'}
                    </span>

                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>রিভিউ করুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {subTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              প্রশাসনিক সমস্ত অনুমোদন, প্রত্যাখ্যান, পরিবর্তন অনুরোধ ও আনপাবলিশ করার স্থায়ী অপরিবর্তনযোগ্য অডিট হিস্টোরি।
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-xs text-stone-400">
              কোনো অডিট লগ রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md uppercase text-[10px] ${
                          log.action === 'APPROVE' || log.action === 'PUBLISH'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.action === 'REQUEST_CHANGES'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {log.bookTitle || log.bookId}
                      </span>
                    </div>
                    {log.note && <p className="text-stone-500 italic">নোট: "{log.note}"</p>}
                  </div>

                  <div className="text-[11px] text-stone-400 shrink-0">
                    {formatBengaliDate(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Review Detail Modal */}
      {selectedSubmission && (
        <AdminReviewDetailModal
          isOpen={true}
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onDecisionApplied={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
