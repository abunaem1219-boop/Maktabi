import { Extension } from '@tiptap/core';

export type Direction = 'auto' | 'ltr' | 'rtl';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textDirection: {
      setTextDirection: (direction: Direction) => ReturnType;
      unsetTextDirection: () => ReturnType;
    };
  }
}

export const TextDirection = Extension.create({
  name: 'textDirection',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'listItem'],
      defaultDirection: 'auto',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: this.options.defaultDirection,
            parseHTML: (element) => element.getAttribute('dir') || this.options.defaultDirection,
            renderHTML: (attributes) => {
              if (!attributes.dir || attributes.dir === 'auto') {
                return { dir: 'auto' };
              }
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: Direction) =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.updateAttributes(type, { dir: direction })
          );
        },
      unsetTextDirection:
        () =>
        ({ commands }) => {
          return this.options.types.every((type: string) =>
            commands.resetAttributes(type, 'dir')
          );
        },
    };
  },
});
