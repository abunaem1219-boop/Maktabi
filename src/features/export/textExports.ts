import { Project } from '../../types';
import { shareOrSaveFile } from './pdf';

/**
 * Escape HTML characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Export to clean, standalone, UTF-8 HTML document with Bengali font styling
 */
export async function exportToHtml(project: Project, htmlContent: string): Promise<void> {
  const safeTitle = escapeHtml(project.title || 'মুক্তলিপি ডকুমেন্ট');
  const safeAuthor = project.author ? escapeHtml(project.author) : '';
  const safeSubtitle = project.subtitle ? escapeHtml(project.subtitle) : '';

  const fullHtml = `<!DOCTYPE html>
<html lang="bn" dir="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="generator" content="মুক্তলিপি (Muktolipi)">
  ${safeAuthor ? `<meta name="author" content="${safeAuthor}">` : ''}
  <style>
    :root {
      color-scheme: light dark;
    }
    body {
      font-family: system-ui, -apple-system, 'Kalpurush', 'SolaimanLipi', sans-serif;
      line-height: 1.7;
      max-width: 840px;
      margin: 40px auto;
      padding: 24px;
      color: #0f172a;
      background-color: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #0f172a;
        color: #f1f5f9;
      }
      h1, h2, h3, h4 { color: #ffffff !important; }
      th, td { border-color: #334155 !important; }
      th { background-color: #1e293b !important; }
      blockquote { border-color: #14b8a6 !important; color: #cbd5e1 !important; }
      .callout-box { background-color: #134e4a !important; border-color: #2dd4bf !important; }
    }
    h1.doc-title {
      font-size: 2.25rem;
      font-weight: 800;
      text-align: center;
      margin-bottom: 0.5rem;
      color: #0f172a;
    }
    .doc-meta {
      text-align: center;
      color: #64748b;
      font-size: 0.95rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    h1, h2, h3, h4 { color: #0f172a; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-top: 0; margin-bottom: 1em; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; overflow-x: auto; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background-color: #f8fafc; font-weight: 600; }
    blockquote {
      border-left: 4px solid #0d9488;
      margin: 1.5em 0;
      padding: 8px 16px;
      color: #475569;
      font-style: italic;
      background: rgba(13, 148, 136, 0.05);
      border-radius: 0 8px 8px 0;
    }
    .callout-box {
      background: #f0fdfa;
      border: 1px solid #5eead4;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 1.5em 0;
    }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em auto; display: block; }
    .page-break-node { border-top: 2px dashed #94a3b8; margin: 2em 0; }
  </style>
</head>
<body>
  <h1 class="doc-title">${safeTitle}</h1>
  ${safeSubtitle || safeAuthor ? `<div class="doc-meta">${[safeSubtitle, safeAuthor ? `লেখক: ${safeAuthor}` : ''].filter(Boolean).join(' · ')}</div>` : ''}
  <main>
    ${htmlContent}
  </main>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  await shareOrSaveFile(blob, `${project.title || 'document'}.html`, 'text/html');
}

/**
 * Export to plain text (.txt)
 */
export async function exportToTxt(project: Project, textContent: string): Promise<void> {
  const title = project.title || 'মুক্তলিপি ডকুমেন্ট';
  const divider = '='.repeat(Math.max(20, Math.min(60, title.length)));
  const meta = [project.subtitle, project.author ? `লেখক: ${project.author}` : '']
    .filter(Boolean)
    .join(' | ');

  const fullText = `${title}\n${divider}\n${meta ? `${meta}\n\n` : '\n'}${textContent}\n`;
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  await shareOrSaveFile(blob, `${project.title || 'document'}.txt`, 'text/plain');
}

/**
 * Convert Tiptap JSON node recursively to authentic Markdown syntax
 */
function nodeToMarkdown(node: any): string {
  if (!node) return '';

  switch (node.type) {
    case 'doc':
      return (node.content || []).map(nodeToMarkdown).join('\n\n');

    case 'heading': {
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level) + ' ';
      const text = (node.content || []).map(nodeToMarkdown).join('');
      return `${prefix}${text}`;
    }

    case 'paragraph': {
      return (node.content || []).map(nodeToMarkdown).join('');
    }

    case 'text': {
      let t = node.text || '';
      const marks = node.marks || [];
      for (const mark of marks) {
        if (mark.type === 'bold') t = `**${t}**`;
        else if (mark.type === 'italic') t = `*${t}*`;
        else if (mark.type === 'strike') t = `~~${t}~~`;
        else if (mark.type === 'code') t = `\`${t}\``;
        else if (mark.type === 'link') t = `[${t}](${mark.attrs?.href || ''})`;
      }
      return t;
    }

    case 'bulletList': {
      return (node.content || [])
        .map((item: any) => `- ${(item.content || []).map(nodeToMarkdown).join('\n  ')}`)
        .join('\n');
    }

    case 'orderedList': {
      return (node.content || [])
        .map(
          (item: any, idx: number) =>
            `${idx + 1}. ${(item.content || []).map(nodeToMarkdown).join('\n   ')}`
        )
        .join('\n');
    }

    case 'blockquote':
    case 'calloutBox': {
      const inner = (node.content || []).map(nodeToMarkdown).join('\n> ');
      return `> ${inner}`;
    }

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((c: any) => c.text || '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'image': {
      const alt = node.attrs?.alt || 'ছবি';
      const src = node.attrs?.src || '';
      return `![${alt}](${src})`;
    }

    case 'horizontalRule':
    case 'pageBreak':
      return '---';

    case 'table': {
      const rows = node.content || [];
      if (rows.length === 0) return '';
      const mdRows: string[] = [];
      let colCount = 0;

      rows.forEach((r: any, rIdx: number) => {
        const cells = (r.content || []).map((c: any) =>
          (c.content || []).map(nodeToMarkdown).join(' ').replace(/\|/g, '\\|').trim()
        );
        colCount = Math.max(colCount, cells.length);
        mdRows.push(`| ${cells.join(' | ')} |`);

        if (rIdx === 0) {
          const sep = Array(colCount).fill('---').join(' | ');
          mdRows.push(`| ${sep} |`);
        }
      });
      return mdRows.join('\n');
    }

    default:
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(nodeToMarkdown).join('');
      }
      return '';
  }
}

/**
 * Export to Markdown (.md)
 */
export async function exportToMarkdown(project: Project, fallbackText?: string): Promise<void> {
  let mdContent = '';
  if (project.content && project.content.content) {
    mdContent = nodeToMarkdown(project.content);
  } else {
    mdContent = fallbackText || '';
  }

  const metaHeader = [
    `# ${project.title}`,
    project.subtitle ? `> *${project.subtitle}*` : '',
    project.author ? `**লেখক:** ${project.author}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const fullMd = `${metaHeader}\n\n---\n\n${mdContent}\n`;
  const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
  await shareOrSaveFile(blob, `${project.title || 'document'}.md`, 'text/markdown');
}

/**
 * Export full project backup in JSON format
 */
export async function exportProjectBackupJson(project: Project): Promise<void> {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  await shareOrSaveFile(blob, `${project.title || 'project'}_backup.json`, 'application/json');
}
