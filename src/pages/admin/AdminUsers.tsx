import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../../firebase/database';
import { ADMIN_UID } from '../../firebase/config';
import { UserProfile } from '../../types/user';
import { formatBengaliDate, getInitials } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Users, Search, RefreshCw, ShieldCheck, Mail, Calendar, Loader2 } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            ব্যবহারকারী ব্যবস্থাপনা
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            প্ল্যাটফর্মে নিবন্ধিত সকল ব্যবহারকারীর তালিকা ও ভূমিকা
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>তাজা করুন</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/40"
        />
      </div>

      {/* Users Table / List */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-stone-400">ব্যবহারকারীদের তালিকা লোড করা হচ্ছে...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-10 h-10 text-stone-400 mx-auto" />
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              কোনো ব্যবহারকারী মেলেনি
            </h4>
            <p className="text-xs text-stone-400">
              {search ? 'অন্য কোনো নাম বা ইমেইল দিয়ে চেষ্টা করুন।' : 'এখনো কোনো ইউজার যুক্ত হয়নি।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 sm:px-6">ব্যবহারকারী</th>
                  <th className="py-3 px-4">ইমেইল</th>
                  <th className="py-3 px-4">ভূমিকা (Role)</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 sm:px-6">নিবন্ধন তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                {filteredUsers.map((u) => {
                  const isSuperAdmin = u.uid === ADMIN_UID || u.role === 'admin';
                  return (
                    <tr key={u.uid} className="hover:bg-stone-50/60 dark:hover:bg-stone-850/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold flex items-center justify-center shrink-0">
                              {getInitials(u.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold block truncate max-w-[150px] sm:max-w-none">
                              {u.name || 'বেনামী'}
                            </span>
                            <span className="text-[10px] text-stone-400 block font-mono">
                              UID: {u.uid.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-600 dark:text-stone-400">
                        {u.email || 'কোনো ইমেইল নেই'}
                      </td>

                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <Badge variant="admin">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Administrator</span>
                          </Badge>
                        ) : u.role === 'author' ? (
                          <Badge variant="author">লেখক</Badge>
                        ) : (
                          <Badge variant="secondary">সাধারণ পাঠক</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="success">সক্রিয়</Badge>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-stone-500 whitespace-nowrap">
                        {formatBengaliDate(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
