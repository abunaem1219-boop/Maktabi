import React, { useState, useRef } from 'react';
import { Project, AppSettings } from '../../types';
import { translations, Language } from '../../utils/i18n';
import { ProjectCard } from './ProjectCard';
import { NewProjectDialog } from './NewProjectDialog';
import { RenameModal } from './RenameModal';
import { importFile } from '../export/import';
import { createDefaultPageSetup } from '../../utils/units';
import {
  Search, Plus, LayoutGrid, List, SlidersHorizontal,
  Upload, Settings as SettingsIcon, BookOpen, AlertCircle, RotateCcw
} from 'lucide-react';

interface LibraryScreenProps {
  projects: Project[];
  settings: AppSettings;
  language: Language;
  onOpenProject: (projectId: string) => void;
  onCreateProject: (project: Project) => void;
  onDuplicateProject: (project: Project) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRestoreProject: (project: Project) => void;
  onOpenSettings: () => void;
  installPromptComponent?: React.ReactNode;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  projects,
  settings,
  language,
  onOpenProject,
  onCreateProject,
  onDuplicateProject,
  onRenameProject,
  onDeleteProject,
  onRestoreProject,
  onOpenSettings,
  installPromptComponent,
}) => {
  const t = translations[language];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'document' | 'book'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'created'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);

  // Undo delete snackbar
  const [recentlyDeleted, setRecentlyDeleted] = useState<Project | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Import file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort projects
  const filteredProjects = projects
    .filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = p.title.toLowerCase().includes(q);
      let inContent = false;
      try {
        inContent = JSON.stringify(p.content).toLowerCase().includes(q);
      } catch (e) {}
      return inTitle || inContent;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'created') return b.createdAt - a.createdAt;
      return b.updatedAt - a.updatedAt;
    });

  // Handle delete with undo snackbar
  const handleDeleteWithUndo = (proj: Project) => {
    if (confirm(t.confirmDelete)) {
      onDeleteProject(proj.id);
      setRecentlyDeleted(proj);

      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setRecentlyDeleted(null);
      }, 5000);
    }
  };

  const handleUndoDelete = () => {
    if (recentlyDeleted) {
      onRestoreProject(recentlyDeleted);
      setRecentlyDeleted(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  // Handle file import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const imported = await importFile(file);
        if (imported.project) {
          // JSON Backup restore
          onCreateProject({
            ...imported.project,
            id: `proj-${Date.now()}`,
            updatedAt: Date.now(),
          });
        } else {
          // Document / DOCX / TXT / HTML import
          const newDoc: Project = {
            id: `proj-${Date.now()}`,
            title: imported.title || 'ইমপোর্টকৃত নথি',
            type: 'document',
            pageSetup: createDefaultPageSetup('A4', 'portrait'),
            content: imported.html
              ? { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: imported.text || file.name }] }] }
              : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: imported.text || '' }] }] },
            wordCount: imported.text ? imported.text.split(/\s+/).length : 50,
            charCount: imported.text ? imported.text.length : 300,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          onCreateProject(newDoc);
        }
      } catch (err: any) {
        alert(err.message || 'ফাইল ইমপোর্টে সমস্যা হয়েছে।');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.docx,.txt,.html,.md"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Top Bar Contract (1 line brand, nav controls, actions) */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Zone: 1 element */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            {t.appName}
          </span>
        </div>

        {/* Center / Action Zone */}
        <div className="flex items-center gap-2">
          {/* In-App PWA Install */}
          {installPromptComponent}

          {/* Import Backup / DOCX */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
            title="ব্যাকআপ বা Word ফাইল ইমপোর্ট করুন"
          >
            <Upload className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">{t.importBackup}</span>
          </button>

          {/* Settings Screen */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title={t.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Search, Filter, and View Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 shadow-xs"
            />
          </div>

          {/* Filter & Sort Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Filter buttons */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.allProjects}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('document')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === 'document'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.filterDocuments}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('book')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === 'book'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.filterBooks}
              </button>
            </div>

            {/* Sort Select */}
            <select
              aria-label="সর্টিং"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="updated">{t.sortLatest}</option>
              <option value="title">{t.sortTitle}</option>
              <option value="created">{t.sortCreated}</option>
            </select>

            {/* Grid vs List Toggle */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
                title="গ্রিড ভিউ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
                title="লিস্ট ভিউ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Cards Grid / List */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {t.emptyProjectsTitle}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {t.emptyProjectsDesc}
            </p>
            <button
              type="button"
              onClick={() => setShowNewDialog(true)}
              className="mt-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-2xl shadow-sm transition-all"
            >
              {t.newProject} তৈরি করুন
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {filteredProjects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                language={language}
                viewMode={viewMode}
                onOpen={() => onOpenProject(proj.id)}
                onDuplicate={() => onDuplicateProject(proj)}
                onRename={() => setRenamingProject(proj)}
                onDelete={() => handleDeleteWithUndo(proj)}
                useBengaliDigits={settings.useBengaliDigits}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Button for Mobile Thumb Zone */}
      <button
        type="button"
        onClick={() => setShowNewDialog(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-hidden focus:ring-4 focus:ring-teal-500/30"
        title={t.newProject}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 5-Second Undo Delete Snackbar */}
      {recentlyDeleted && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 animate-slide-up text-xs">
          <span>{t.deletedProject}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1 font-bold text-teal-400 hover:text-teal-300"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.undo}</span>
          </button>
        </div>
      )}

      {/* New Project Dialog */}
      {showNewDialog && (
        <NewProjectDialog
          language={language}
          onCreateProject={({ title, type, pageSize, orientation, margins, marginPresetName }) => {
            const newProj: Project = {
              id: `proj-${Date.now()}`,
              title,
              type,
              pageSetup: {
                size: pageSize,
                widthMm: 210,
                heightMm: 297,
                orientation,
                margins,
                presetName: marginPresetName,
              },
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: title }],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '' }],
                  },
                ],
              },
              chapters:
                type === 'book'
                  ? [{ id: 'ch-1', title: 'অধ্যায় ১', order: 1, wordCount: 0 }]
                  : undefined,
              wordCount: 0,
              charCount: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              headerText: title,
              numberingStyle: settings.useBengaliDigits ? 'bengali' : 'english',
              differentFirstPage: true,
            };
            onCreateProject(newProj);
            setShowNewDialog(false);
          }}
          onClose={() => setShowNewDialog(false)}
        />
      )}

      {/* Rename Modal */}
      {renamingProject && (
        <RenameModal
          initialTitle={renamingProject.title}
          onRename={(newTitle) => {
            onRenameProject(renamingProject.id, newTitle);
            setRenamingProject(null);
          }}
          onClose={() => setRenamingProject(null)}
        />
      )}
    </div>
  );
};
