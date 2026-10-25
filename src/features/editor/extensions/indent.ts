import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType;
      decreaseIndent: () => ReturnType;
      setIndent: (indent: number) => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote'],
      minLevel: 0,
      maxLevel: 8,
      step: 24, // 24px per indent level
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const paddingLeft = element.style.paddingLeft;
              return paddingLeft ? parseInt(paddingLeft, 10) / this.options.step : 0;
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) {
                return {};
              }
              return {
                style: `padding-left: ${attributes.indent * this.options.step}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const nextIndent = Math.min(this.options.maxLevel, currentIndent + 1);
              if (dispatch) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: nextIndent,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },

      decreaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              const nextIndent = Math.max(this.options.minLevel, currentIndent - 1);
              if (dispatch) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: nextIndent,
                });
              }
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },

      setIndent:
        (indent: number) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          tr = tr.setSelection(selection);
          const { from, to } = selection;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              if (dispatch) {
                tr = tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: Math.max(this.options.minLevel, Math.min(this.options.maxLevel, indent)),
                });
              }
            }
          });

          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseIndent(),
      'Shift-Tab': () => this.editor.commands.decreaseIndent(),
    };
  },
});
