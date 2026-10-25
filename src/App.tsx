/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabaseWithSample, getSettings, updateSettings } from './db';
import { Project, AppSettings } from './types';
import { LibraryScreen } from './features/library/LibraryScreen';
import { EditorCanvas } from './features/editor/EditorCanvas';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'library' | 'editor' | 'settings'>('library');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize DB and sample on mount
  useEffect(() => {
    async function setup() {
      await initDatabaseWithSample();
      const currentSettings = await getSettings();
      setSettings(currentSettings);
      setIsDbReady(true);

      // Register PWA service worker
      if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
    setup();
  }, []);

  // Dexie live queries
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [], []);

  // Theme application
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark =
      settings.theme === 'dark' ||
      settings.theme === 'amoled' ||
      (settings.theme === 'system' && prefersDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.theme === 'amoled') {
      root.classList.add('amoled-mode');
    } else {
      root.classList.remove('amoled-mode');
    }
  }, [settings]);

  // Android Back button / History API integration
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (currentScreen === 'editor' || currentScreen === 'settings') {
        setCurrentScreen('library');
        setActiveProjectId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  // Navigate to editor
  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentScreen('editor');
    window.history.pushState({ screen: 'editor', id }, '');
  };

  // Navigate to settings
  const handleOpenSettings = () => {
    setCurrentScreen('settings');
    window.history.pushState({ screen: 'settings' }, '');
  };

  // Back to library
  const handleBackToLibrary = () => {
    setCurrentScreen('library');
    setActiveProjectId(null);
    window.history.pushState({ screen: 'library' }, '');
  };

  // Database mutations
  const handleCreateProject = async (newProject: Project) => {
    await db.projects.put(newProject);
    handleOpenProject(newProject.id);
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!activeProjectId) return;
    await db.projects.update(activeProjectId, {
      ...updates,
      updatedAt: Date.now(),
    });
  };

  const handleDuplicateProject = async (orig: Project) => {
    const dup: Project = {
      ...orig,
      id: `proj-${Date.now()}`,
      title: `${orig.title} (অনুলিপি)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.projects.put(dup);
  };

  const handleRenameProject = async (id: string, newTitle: string) => {
    await db.projects.update(id, {
      title: newTitle,
      updatedAt: Date.now(),
    });
  };

  const handleDeleteProject = async (id: string) => {
    await db.projects.delete(id);
  };

  const handleRestoreProject = async (proj: Project) => {
    await db.projects.put(proj);
  };

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    const updated = await updateSettings(updates);
    setSettings(updated);
  };

  const handleClearAllData = async () => {
    await db.projects.clear();
    await db.versions.clear();
    await initDatabaseWithSample();
    handleBackToLibrary();
  };

  if (!isDbReady || !settings) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            মুক্তলিপি লোড হচ্ছে…
          </span>
        </div>
      </div>
    );
  }

  const activeProject = projects?.find((p) => p.id === activeProjectId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {currentScreen === 'library' && (
        <LibraryScreen
          projects={projects || []}
          settings={settings}
          language={settings.language || 'bn'}
          onOpenProject={handleOpenProject}
          onCreateProject={handleCreateProject}
          onDuplicateProject={handleDuplicateProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          onRestoreProject={handleRestoreProject}
          onOpenSettings={handleOpenSettings}
          installPromptComponent={<PWAInstallButton />}
        />
      )}

      {currentScreen === 'editor' && activeProject && (
        <EditorCanvas
          project={activeProject}
          settings={settings}
          language={settings.language || 'bn'}
          onUpdateProject={handleUpdateProject}
          onBackToLibrary={handleBackToLibrary}
        />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen
          settings={settings}
          language={settings.language || 'bn'}
          onUpdateSettings={handleUpdateSettings}
          onClearAllData={handleClearAllData}
          onBack={handleBackToLibrary}
        />
      )}
    </div>
  );
}
