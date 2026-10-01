/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { SplashScreen } from './components/common/SplashScreen';
import { AppLayout } from './components/layout/AppLayout';

import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Library } from './pages/Library';
import { WritingCenter } from './pages/WritingCenter';
import { Writer } from './pages/Writer';
import { WriterEditor } from './pages/WriterEditor';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { BookDetails } from './pages/BookDetails';
import { BookReader } from './pages/BookReader';
import { AuthorProfile } from './pages/AuthorProfile';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { AdminLayout } from './pages/admin/AdminLayout';

function MainRouter() {
  const { loading } = useAuth();

  // Parse view, parameter, and sub-parameter from window.location.hash
  const parseHash = (): { view: string; param?: string; subParam?: string } => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw) return { view: 'home' };

    const [pathPart] = raw.split('?');
    const parts = pathPart.split('/');
    let view = parts[0].toLowerCase();
    const param = parts[1];
    const subParam = parts[3]; // Supports #writer/{bookId}/chapter/{chapterId}

    if (view === 'write') {
      view = 'writer';
    }

    const validViews = [
      'home',
      'search',
      'library',
      'writer',
      'profile',
      'settings',
      'login',
      'register',
      'forgot-password',
      'admin',
      'book',
      'reader',
      'author',
    ];

    if (!validViews.includes(view)) {
      return { view: 'home' };
    }

    return { view, param, subParam };
  };

  const [route, setRoute] = useState<{ view: string; param?: string; subParam?: string }>(parseHash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string, param?: string, subParam?: string) => {
    let hash = `#${view}`;
    if (param && subParam) {
      hash = `#${view}/${param}/chapter/${subParam}`;
    } else if (param) {
      hash = `#${view}/${param}`;
    }
    window.location.hash = hash;
    setRoute({ view, param, subParam });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // While Firebase authentication is initializing, show branded Splash
  if (loading) {
    return <SplashScreen />;
  }

  // Auth pages view wrapper
  const renderAuthPage = () => {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-8">
        {route.view === 'login' && <LoginForm onNavigate={navigateTo} />}
        {route.view === 'register' && <RegisterForm onNavigate={navigateTo} />}
        {route.view === 'forgot-password' && <ForgotPasswordForm onNavigate={navigateTo} />}
      </div>
    );
  };

  // Main view content resolver
  const renderContent = () => {
    switch (route.view) {
      case 'home':
        return <Home onNavigate={navigateTo} />;
      case 'search':
        return <Search initialCategoryId={route.param} onNavigate={navigateTo} />;
      case 'library':
        return <Library onNavigate={navigateTo} />;
      case 'writer':
        return (
          <Writer
            onNavigate={navigateTo}
            openNewBookInitially={route.param === 'new'}
          />
        );
      case 'profile':
        return <Profile onNavigate={navigateTo} />;
      case 'settings':
        return <Settings />;
      case 'book':
        return route.param ? (
          <BookDetails bookId={route.param} onNavigate={navigateTo} />
        ) : (
          <Home onNavigate={navigateTo} />
        );
      case 'reader':
        return route.param ? (
          <BookReader bookId={route.param} onNavigate={navigateTo} />
        ) : (
          <Home onNavigate={navigateTo} />
        );
      case 'author':
        return route.param ? (
          <AuthorProfile authorIdOrName={route.param} onNavigate={navigateTo} />
        ) : (
          <Search onNavigate={navigateTo} />
        );
      case 'admin':
        return <AdminLayout onNavigate={navigateTo} />;
      case 'login':
      case 'register':
      case 'forgot-password':
        return renderAuthPage();
      default:
        return <Home onNavigate={navigateTo} />;
    }
  };

  // If in Reader view, use dedicated reader layout without global navigation
  if (route.view === 'reader' && route.param) {
    return <BookReader bookId={route.param} onNavigate={navigateTo} />;
  }

  // If in Writer Studio Editor view, use dedicated writer layout without global navigation
  if (route.view === 'writer' && route.param && route.param !== 'new') {
    return (
      <WriterEditor
        bookId={route.param}
        initialChapterId={route.subParam}
        onNavigate={navigateTo}
      />
    );
  }

  return (
    <AppLayout currentView={route.view} onNavigate={navigateTo}>
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ToastContainer />
          <MainRouter />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
