import mammoth from 'mammoth';
import { Project } from '../../types';
import { createDefaultPageSetup } from '../../utils/units';

export async function importFile(
  file: File
): Promise<{ title: string; html?: string; text?: string; project?: Project }> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // 1. Project Backup (.json)
  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed.id && parsed.title) {
      return { title: parsed.title, project: parsed as Project };
    }
    throw new Error('অবৈধ ব্যাকআপ ফাইল।');
  }

  // 2. Microsoft Word (.docx)
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const title = file.name.replace(/\.docx$/i, '');
    return { title, html: result.value };
  }

  // 3. HTML (.html, .htm)
  if (extension === 'html' || extension === 'htm') {
    const text = await file.text();
    const title = file.name.replace(/\.html?$/i, '');
    return { title, html: text };
  }

  // 4. TXT / Markdown (.txt, .md)
  const text = await file.text();
  const title = file.name.replace(/\.[^/.]+$/, '');
  return { title, text };
}
