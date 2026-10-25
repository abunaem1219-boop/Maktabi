import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageOrientation,
  Header,
  Footer,
} from 'docx';
import { Project } from '../../types';
import { shareOrSaveFile } from './pdf';

/**
 * Convert millimeters to Word twips (1 mm ≈ 56.6929 twips)
 */
function mmToTwip(mm: number): number {
  return Math.round(mm * 56.6929);
}

/**
 * Convert point font size (or px string) to Word half-points (e.g. 12pt = 24 half-points)
 */
function toHalfPoints(fontSize?: string | number): number {
  if (!fontSize) return 24; // 12pt default
  if (typeof fontSize === 'number') return Math.round(fontSize * 2);
  const parsed = parseInt(fontSize, 10);
  if (isNaN(parsed)) return 24;
  return Math.round(parsed * 2);
}

/**
 * Map Tiptap heading level to docx HeadingLevel
 */
function mapHeadingLevel(level?: number): (typeof HeadingLevel)[keyof typeof HeadingLevel] {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
}

/**
 * Map alignment string to docx AlignmentType
 */
function mapAlignment(align?: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Create TextRun with full complex script support for Bengali/Arabic
 */
function createTextRun(text: string, marks: any[] = []): TextRun {
  const isBold = marks.some((m) => m.type === 'bold');
  const isItalic = marks.some((m) => m.type === 'italic');
  const isUnderline = marks.some((m) => m.type === 'underline');
  const isStrike = marks.some((m) => m.type === 'strike');
  const isSubscript = marks.some((m) => m.type === 'subscript');
  const isSuperscript = marks.some((m) => m.type === 'superscript');

  const textStyleMark = marks.find((m) => m.type === 'textStyle');
  const colorMark = marks.find((m) => m.type === 'color');
  const highlightMark = marks.find((m) => m.type === 'highlight');

  const fontSize = toHalfPoints(textStyleMark?.attrs?.fontSize);
  const fontFamily = textStyleMark?.attrs?.fontFamily || 'Kalpurush';
  const color = colorMark?.attrs?.color ? colorMark.attrs.color.replace('#', '') : undefined;
  const highlight = highlightMark?.attrs?.color || undefined;

  return new TextRun({
    text,
    bold: isBold,
    boldComplexScript: isBold,
    italics: isItalic,
    italicsComplexScript: isItalic,
    strike: isStrike,
    subScript: isSubscript,
    superScript: isSuperscript,
    underline: isUnderline ? {} : undefined,
    color,
    highlight,
    size: fontSize,
    sizeComplexScript: fontSize,
    font: {
      name: fontFamily,
      hint: 'cs',
    },
    language: {
      value: 'bn-BD',
    },
  });
}

/**
 * Recursively parse Tiptap JSON node to docx Paragraphs or Tables
 */
function parseNode(node: any, listLevel: number = 0): (Paragraph | Table)[] {
  const results: (Paragraph | Table)[] = [];
  if (!node) return results;

  switch (node.type) {
    case 'heading': {
      const headingTextRuns: TextRun[] = [];
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === 'text') {
            headingTextRuns.push(createTextRun(child.text || '', child.marks));
          }
        }
      }
      results.push(
        new Paragraph({
          children: headingTextRuns,
          heading: mapHeadingLevel(node.attrs?.level),
          alignment: mapAlignment(node.attrs?.textAlign),
          spacing: { before: 240, after: 120 },
        })
      );
      break;
    }

    case 'paragraph': {
      const textRuns: TextRun[] = [];
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          if (child.type === 'text') {
            textRuns.push(createTextRun(child.text || '', child.marks));
          }
        }
      }
      results.push(
        new Paragraph({
          children: textRuns,
          alignment: mapAlignment(node.attrs?.textAlign),
          spacing: { after: 120, line: 276 },
        })
      );
      break;
    }

    case 'bulletList': {
      if (node.content && Array.isArray(node.content)) {
        for (const item of node.content) {
          if (item.type === 'listItem' && item.content) {
            for (const child of item.content) {
              const parsed = parseNode(child, listLevel);
              for (const p of parsed) {
                if (p instanceof Paragraph) {
                  results.push(
                    new Paragraph({
                      ...p,
                      bullet: { level: listLevel },
                      spacing: { after: 80 },
                    })
                  );
                } else {
                  results.push(p);
                }
              }
            }
          }
        }
      }
      break;
    }

    case 'orderedList': {
      if (node.content && Array.isArray(node.content)) {
        for (const item of node.content) {
          if (item.type === 'listItem' && item.content) {
            for (const child of item.content) {
              const parsed = parseNode(child, listLevel);
              for (const p of parsed) {
                if (p instanceof Paragraph) {
                  results.push(
                    new Paragraph({
                      ...p,
                      spacing: { after: 80 },
                    })
                  );
                } else {
                  results.push(p);
                }
              }
            }
          }
        }
      }
      break;
    }

    case 'blockquote':
    case 'calloutBox': {
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          const parsed = parseNode(child, listLevel);
          for (const p of parsed) {
            if (p instanceof Paragraph) {
              results.push(
                new Paragraph({
                  ...p,
                  border: {
                    left: {
                      color: '0d9488',
                      size: 24,
                      style: BorderStyle.SINGLE,
                    },
                  },
                  indent: { left: 400 },
                  spacing: { before: 100, after: 100 },
                })
              );
            } else {
              results.push(p);
            }
          }
        }
      }
      break;
    }

    case 'table': {
      const tableRows: TableRow[] = [];
      if (node.content && Array.isArray(node.content)) {
        for (const rowNode of node.content) {
          if (rowNode.type === 'tableRow' && rowNode.content) {
            const cells: TableCell[] = [];
            for (const cellNode of rowNode.content) {
              const cellParagraphs: Paragraph[] = [];
              if (cellNode.content && Array.isArray(cellNode.content)) {
                for (const cellChild of cellNode.content) {
                  const parsed = parseNode(cellChild);
                  for (const p of parsed) {
                    if (p instanceof Paragraph) cellParagraphs.push(p);
                  }
                }
              }
              if (cellParagraphs.length === 0) {
                cellParagraphs.push(new Paragraph({ text: '' }));
              }
              cells.push(
                new TableCell({
                  children: cellParagraphs,
                  width: { size: 100 / (rowNode.content.length || 1), type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: 'cbd5e1' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cbd5e1' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: 'cbd5e1' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: 'cbd5e1' },
                  },
                })
              );
            }
            tableRows.push(new TableRow({ children: cells }));
          }
        }
      }
      if (tableRows.length > 0) {
        results.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
      }
      break;
    }

    default:
      break;
  }

  return results;
}

/**
 * Export project to docx with full formatting and Bengali/Arabic complex script support
 */
export async function exportToDocx(project: Project): Promise<Blob> {
  const { widthMm, heightMm, orientation, margins } = project.pageSetup;
  const docChildren: (Paragraph | Table)[] = [];

  // Document Title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: project.title,
          bold: true,
          boldComplexScript: true,
          size: 48, // 24pt
          sizeComplexScript: 48,
          font: { name: 'Kalpurush', hint: 'cs' },
          language: { value: 'bn-BD' },
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Subtitle / Author
  if (project.subtitle || project.author) {
    const subText = [project.subtitle, project.author ? `লেখক: ${project.author}` : '']
      .filter(Boolean)
      .join(' · ');
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subText,
            italics: true,
            italicsComplexScript: true,
            size: 24, // 12pt
            sizeComplexScript: 24,
            font: { name: 'Kalpurush', hint: 'cs' },
            language: { value: 'bn-BD' },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Parse Tiptap JSON content
  const content = project.content;
  if (content && content.content && Array.isArray(content.content)) {
    for (const node of content.content) {
      const parsedElements = parseNode(node);
      docChildren.push(...parsedElements);
    }
  }

  const doc = new Document({
    creator: project.author || 'মুক্তলিপি',
    title: project.title,
    description: project.subtitle || '',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: mmToTwip(widthMm),
              height: mmToTwip(heightMm),
              orientation:
                orientation === 'landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: mmToTwip(margins.top),
              bottom: mmToTwip(margins.bottom),
              left: mmToTwip(margins.left),
              right: mmToTwip(margins.right),
            },
          },
        },
        headers: project.headerText
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    text: project.headerText,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            }
          : undefined,
        footers: project.footerText
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    text: project.footerText,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            }
          : undefined,
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  await shareOrSaveFile(blob, `${project.title || 'document'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  return blob;
}
