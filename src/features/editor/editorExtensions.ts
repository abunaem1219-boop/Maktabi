import { Extensions } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';

import { FontSize } from './extensions/fontSize';
import { LineHeight } from './extensions/lineHeight';
import { Indent } from './extensions/indent';
import { PageBreak } from './extensions/pageBreak';
import { CalloutBox } from './extensions/calloutBox';
import { TextDirection } from './extensions/textDirection';
import { Pagination, PaginationOptions } from './extensions/pagination';
import { Project } from '../../types';

export interface EditorExtensionsConfig {
  project: Project;
  isPaginated: boolean;
  exportMode?: boolean;
  onPageCountChange?: (pageCount: number, currentPage: number) => void;
  onEditHeaderFooter?: () => void;
  placeholder?: string;
}

export function getMuktolipiEditorExtensions(config: EditorExtensionsConfig): Extensions {
  const {
    project,
    isPaginated,
    exportMode = false,
    onPageCountChange,
    onEditHeaderFooter,
    placeholder = 'এখানে লেখা শুরু করুন...',
  } = config;

  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      dropcursor: { color: '#0d9488', width: 2 },
    }),
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    FontFamily,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    TextDirection.configure({
      defaultDirection: 'auto',
    }),
    Subscript,
    Superscript,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-teal-600 dark:text-teal-400 underline hover:opacity-80' },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: { class: 'rounded-xl max-w-full h-auto mx-auto my-3 shadow-md' },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: 'border-collapse border border-slate-300 dark:border-slate-700 my-4 mx-auto' },
    }),
    TableRow,
    TableHeader.configure({
      HTMLAttributes: { class: 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 font-bold' },
    }),
    TableCell.configure({
      HTMLAttributes: { class: 'border border-slate-300 dark:border-slate-700 p-2 min-w-[80px]' },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    CharacterCount,
    FontSize,
    LineHeight,
    Indent,
    PageBreak,
    CalloutBox,
  ];

  if (isPaginated) {
    extensions.push(
      Pagination.configure({
        pageSetup: project.pageSetup,
        project,
        enabled: true,
        exportMode,
        onPageCountChange,
        onEditHeaderFooter,
      } as PaginationOptions)
    );
  }

  return extensions;
}
