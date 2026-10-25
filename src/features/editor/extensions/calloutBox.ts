import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBox: {
      setCalloutBox: (attrs?: { color?: string }) => ReturnType;
      toggleCalloutBox: () => ReturnType;
    };
  }
}

export const CalloutBox = Node.create({
  name: 'calloutBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: {
        default: 'teal',
        parseHTML: (element) => element.getAttribute('data-color') || 'teal',
        renderHTML: (attributes) => ({
          'data-color': attributes.color,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout-box"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const color = node.attrs.color || 'teal';
    let colorClasses = 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700/60 text-teal-950 dark:text-teal-100';
    if (color === 'amber') {
      colorClasses = 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100';
    } else if (color === 'blue') {
      colorClasses = 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/60 text-blue-950 dark:text-blue-100';
    } else if (color === 'rose') {
      colorClasses = 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-100';
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout-box',
        class: `callout-box my-4 p-4 rounded-xl border ${colorClasses} transition-colors shadow-xs`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCalloutBox:
        (attrs) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attrs);
        },
      toggleCalloutBox:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
    };
  },
});
