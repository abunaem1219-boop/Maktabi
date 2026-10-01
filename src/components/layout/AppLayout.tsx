import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: string, param?: string, subParam?: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const { showLogoutModal, closeLogoutModal, handleLogout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      {/* Top sticky navigation */}
      <Header currentView={currentView} onNavigate={onNavigate} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <DesktopSidebar currentView={currentView} onNavigate={onNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-20 md:pb-12 px-4 sm:px-6 lg:px-8 pt-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentView={currentView} onNavigate={onNavigate} />

      {/* Global Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="লগআউট নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত যে আপনি কিতাবখানা থেকে লগআউট করতে চান? আপনার স্থানীয় লেখার খসড়া সুরক্ষিত থাকবে।"
        confirmLabel="লগআউট করুন"
        cancelLabel="ফিরে যান"
        isDestructive={true}
        onConfirm={handleLogout}
        onCancel={closeLogoutModal}
      />
    </div>
  );
};
