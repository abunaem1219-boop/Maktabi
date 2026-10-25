import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'page-break-node my-6 border-b-2 border-dashed border-teal-500/50 flex items-center justify-center relative select-none print:break-before-page',
      }),
      [
        'span',
        {
          class: 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-700 uppercase tracking-wider font-medium select-none shadow-xs',
        },
        'পেজ ব্রেক (Page Break)',
      ],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) => {
          return chain().insertContent({ type: this.name }).run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    };
  },
});
