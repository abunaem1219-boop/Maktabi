import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas';
import { Project } from '../../types';
import { mmToPx } from '../../utils/units';

export interface PdfExportProgressCallback {
  (progress: number, statusText: string): void;
}

/**
 * Capture an element using html-to-image toCanvas with fallback to html2canvas
 */
async function captureToCanvas(
  element: HTMLElement,
  scale: number,
  backgroundColor: string = '#ffffff'
): Promise<HTMLCanvasElement> {
  try {
    const canvas = await toCanvas(element, {
      pixelRatio: scale,
      backgroundColor,
      cacheBust: true,
      skipFonts: false,
    });
    return canvas;
  } catch (err) {
    console.warn('html-to-image capture failed, falling back to html2canvas:', err);
    return await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor,
      logging: false,
    });
  }
}

/**
 * Export document to crisp image-based PDF.
 * Uses exact aspect-ratio slicing to prevent 1-page cramming and enforce white-theme export.
 */
export async function exportToImageBasedPdf(
  pagesContainer: HTMLElement,
  project: Project,
  onProgress?: PdfExportProgressCallback
): Promise<Blob> {
  onProgress?.(5, 'ডকুমেন্ট প্রস্তুত করা হচ্ছে…');

  const { widthMm, heightMm, orientation } = project.pageSetup;
  const pageW = mmToPx(widthMm);
  const pageH = mmToPx(heightMm);

  // Locate the page sheet element
  const sheetElement = pagesContainer.querySelector<HTMLElement>('.muktolipi-page-sheet');
  if (!sheetElement) {
    throw new Error('পৃষ্ঠা খুঁজে পাওয়া যায়নি');
  }

  // Measure total content height
  const totalSheetHeight = sheetElement.scrollHeight || sheetElement.offsetHeight;
  const totalPages = Math.max(1, Math.ceil(totalSheetHeight / pageH));

  // Determine dynamic scale resolution to prevent mobile out-of-memory crashes
  let scale = 2.0;
  if (totalPages > 100) {
    scale = 1.25;
  } else if (totalPages > 30) {
    scale = 1.5;
  }

  onProgress?.(10, `মোট ${totalPages} পেজ রেন্ডার করা হচ্ছে (স্কেল ${scale}x)…`);

  // Initialize jsPDF with exact mm dimensions
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  // Create an offscreen isolation container for clean white-mode rendering
  const isolateContainer = document.createElement('div');
  isolateContainer.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: ${pageW}px;
    background: #ffffff !important;
    color: #0f172a !important;
    z-index: -9999;
    pointer-events: none;
    overflow: hidden;
  `;

  // Clone the sheet element
  const clonedSheet = sheetElement.cloneNode(true) as HTMLElement;
  clonedSheet.style.transform = 'none';
  clonedSheet.style.margin = '0';
  clonedSheet.style.boxShadow = 'none';
  clonedSheet.style.border = 'none';
  clonedSheet.style.backgroundColor = '#ffffff';
  clonedSheet.style.color = '#0f172a';

  // Hide page break gaps in cloned sheet so continuous pages line up seamlessly
  const gaps = clonedSheet.querySelectorAll<HTMLElement>('.muktolipi-page-gap');
  gaps.forEach((g) => {
    g.style.display = 'none';
  });

  // Ensure all prose elements have white-mode colors
  clonedSheet.classList.remove('dark');
  clonedSheet.querySelectorAll('.dark').forEach((el) => el.classList.remove('dark'));

  isolateContainer.appendChild(clonedSheet);
  document.body.appendChild(isolateContainer);

  try {
    // Single page capture wrapper of exact page dimensions
    const pageFrame = document.createElement('div');
    pageFrame.style.cssText = `
      position: relative;
      width: ${pageW}px;
      height: ${pageH}px;
      overflow: hidden;
      background: #ffffff;
    `;

    // Process each page individually
    for (let i = 0; i < totalPages; i++) {
      const pct = Math.round(15 + ((i + 1) / totalPages) * 75);
      onProgress?.(pct, `পেজ ${i + 1}/${totalPages} ক্যাপচার করা হচ্ছে…`);

      // Position cloned sheet inside page frame
      pageFrame.innerHTML = '';
      const pageInner = clonedSheet.cloneNode(true) as HTMLElement;
      pageInner.style.position = 'absolute';
      pageInner.style.top = `-${i * pageH}px`;
      pageInner.style.left = '0px';
      pageInner.style.width = `${pageW}px`;
      pageFrame.appendChild(pageInner);
      isolateContainer.innerHTML = '';
      isolateContainer.appendChild(pageFrame);

      // Brief delay for DOM reflow
      await new Promise((resolve) => setTimeout(resolve, 30));

      const pageCanvas = await captureToCanvas(pageFrame, scale, '#ffffff');
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage([widthMm, heightMm], orientation);
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
    }
  } finally {
    // Always clean up isolated container
    if (document.body.contains(isolateContainer)) {
      document.body.removeChild(isolateContainer);
    }
  }

  // Set document metadata
  pdf.setProperties({
    title: project.title,
    author: project.author || 'মুক্তলিপি',
    creator: 'মুক্তলিপি (Muktolipi)',
    subject: project.subtitle || '',
  });

  onProgress?.(98, 'PDF ফাইল সম্পন্ন করা হচ্ছে…');
  return pdf.output('blob');
}

/**
 * Print document or save as vector PDF using hidden iframe with exact @page CSS
 */
export function printDocument(project: Project, htmlContent?: string): void {
  const { widthMm, heightMm, margins } = project.pageSetup;

  // Create isolated hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `
    position: fixed;
    right: 0;
    bottom: 0;
    width: 0;
    height: 0;
    border: 0;
    visibility: hidden;
  `;
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  const title = project.title || 'মুক্তলিপি ডকুমেন্ট';
  const author = project.author || '';

  // Copy font styles from parent document
  const headElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${headElements}
      <style>
        @page {
          size: ${widthMm}mm ${heightMm}mm;
          margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, 'Kalpurush', 'SolaimanLipi', sans-serif;
          font-size: 11pt;
          line-height: 1.6;
        }
        .print-header {
          position: running(header);
          font-size: 9pt;
          color: #64748b;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 4px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
        }
        .print-footer {
          position: running(footer);
          font-size: 9pt;
          color: #64748b;
          border-top: 1px solid #cbd5e1;
          padding-top: 4px;
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
        }
        .print-title {
          font-size: 22pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #0f172a;
        }
        .print-author {
          font-size: 12pt;
          text-align: center;
          color: #475569;
          margin-bottom: 24px;
        }
        h1 { font-size: 18pt; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.4em; }
        h2 { font-size: 15pt; font-weight: bold; margin-top: 1em; margin-bottom: 0.3em; }
        h3 { font-size: 13pt; font-weight: bold; margin-top: 0.8em; margin-bottom: 0.25em; }
        p { margin-top: 0; margin-bottom: 0.8em; }
        table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        th, td { border: 1px solid #94a3b8; padding: 6px 10px; font-size: 10pt; }
        th { background: #f1f5f9; font-weight: bold; }
        blockquote { border-left: 3px solid #0d9488; margin: 1em 0; padding-left: 12px; color: #334155; }
        img { max-width: 100%; height: auto; }
        .page-break-node { page-break-after: always; break-after: page; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <span>${title}</span>
        <span>${project.headerText || ''}</span>
      </div>
      <div class="print-title">${title}</div>
      ${author ? `<div class="print-author">লেখক: ${author}</div>` : ''}
      <div class="print-content">
        ${htmlContent || ''}
      </div>
      <div class="print-footer">
        <span>${project.footerText || ''}</span>
        <span>মুক্তলিপি</span>
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for fonts and content to render inside iframe
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Iframe print error:', e);
      window.print();
    } finally {
      // Remove iframe after print dialog completes
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 60000);
    }
  }, 400);
}

/**
 * Share file using Web Share API on Android/iOS, falling back to browser download
 */
export async function shareOrSaveFile(blob: Blob, filename: string, mimeType: string): Promise<boolean> {
  const file = new File([blob], filename, { type: mimeType });

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return true; // User cancelled
    }
  }

  // Fallback download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
  return false;
}
