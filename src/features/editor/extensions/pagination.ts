import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { PageSetup, Project } from '../../../types';
import { mmToPx } from '../../../utils/units';
import { formatPageNumber, toBengaliNumber } from '../../../utils/bengali';

export const PaginationPluginKey = new PluginKey('muktolipi-pagination');

export interface PaginationOptions {
  pageSetup: PageSetup;
  project: Project;
  enabled: boolean;
  exportMode?: boolean;
  onPageCountChange?: (pageCount: number, currentPage: number) => void;
  onEditHeaderFooter?: () => void;
}

export const Pagination = Extension.create<PaginationOptions>({
  name: 'pagination',

  addOptions() {
    return {
      pageSetup: {
        size: 'A4',
        widthMm: 210,
        heightMm: 297,
        orientation: 'portrait',
        margins: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
        presetName: 'normal',
      },
      project: {} as Project,
      enabled: true,
      exportMode: false,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: PaginationPluginKey,
        state: {
          init() {
            return {
              decorations: DecorationSet.empty,
              pageCount: 1,
              currentPage: 1,
              breakPositions: [] as number[],
            };
          },
          apply(tr, prev, oldState, newState) {
            // Check if pagination options or doc changed
            const meta = tr.getMeta(PaginationPluginKey);
            if (meta) {
              return meta;
            }
            if (!extension.options.enabled) {
              return {
                decorations: DecorationSet.empty,
                pageCount: 1,
                currentPage: 1,
                breakPositions: [],
              };
            }
            // Map existing decorations on transaction
            const mappedDecos = prev.decorations.map(tr.mapping, tr.doc);
            
            // Calculate current page based on cursor position
            const selFrom = tr.selection.from;
            let curPage = 1;
            for (let i = 0; i < prev.breakPositions.length; i++) {
              if (selFrom >= prev.breakPositions[i]) {
                curPage = i + 2;
              } else {
                break;
              }
            }

            return {
              ...prev,
              decorations: mappedDecos,
              currentPage: Math.min(prev.pageCount, Math.max(1, curPage)),
            };
          },
        },
        props: {
          decorations(state) {
            if (!extension.options.enabled) return DecorationSet.empty;
            return this.getState(state)?.decorations || DecorationSet.empty;
          },
        },
        view(editorView) {
          let rafId: number | null = null;
          let isCalculating = false;

          const recalculate = () => {
            if (isCalculating || !extension.options.enabled) return;
            isCalculating = true;

            const { pageSetup, project, exportMode } = extension.options;
            const doc = editorView.state.doc;
            const dom = editorView.dom as HTMLElement;
            if (!dom || !dom.isConnected) {
              isCalculating = false;
              return;
            }

            const pageW = mmToPx(pageSetup.widthMm);
            const pageH = mmToPx(pageSetup.heightMm);
            const topMargin = mmToPx(pageSetup.margins.top);
            const bottomMargin = mmToPx(pageSetup.margins.bottom);
            const leftMargin = mmToPx(pageSetup.margins.left);
            const rightMargin = mmToPx(pageSetup.margins.right);
            const usableH = Math.max(200, pageH - topMargin - bottomMargin);

            const decos: Decoration[] = [];
            const breakPositions: number[] = [];

            // 1. Top Header Widget on Page 1
            const topHeaderWidget = createHeaderWidget(
              1,
              topMargin,
              pageW,
              leftMargin,
              rightMargin,
              project,
              extension.options.onEditHeaderFooter
            );
            decos.push(Decoration.widget(0, topHeaderWidget, { side: -1 }));

            // 2. Measure top-level blocks
            let currentPageIndex = 1;
            let currentUsableRemaining = usableH;
            const editorTop = dom.offsetTop || 0;

            doc.forEach((node, offset) => {
              const nodeStartPos = offset;
              const nodeEndPos = offset + node.nodeSize;

              // Check for manual hard page break node
              if (node.type.name === 'pageBreak') {
                currentPageIndex++;
                breakPositions.push(nodeEndPos);
                const breakWidget = createPageBreakWidget(
                  currentPageIndex - 1,
                  currentPageIndex,
                  pageW,
                  topMargin,
                  bottomMargin,
                  leftMargin,
                  rightMargin,
                  project,
                  exportMode,
                  extension.options.onEditHeaderFooter
                );
                decos.push(Decoration.widget(nodeEndPos, breakWidget, { side: 1 }));
                currentUsableRemaining = usableH;
                return;
              }

              // Measure node height in DOM using nodeDOM
              const nodeDom = editorView.nodeDOM(nodeStartPos) as HTMLElement | null;
              if (!nodeDom || typeof nodeDom.getBoundingClientRect !== 'function') return;

              const nodeHeight = nodeDom.offsetHeight || 28;

              // If node exceeds the remaining height of current page, insert page break before it
              if (nodeHeight > currentUsableRemaining && currentUsableRemaining < usableH - 40) {
                currentPageIndex++;
                breakPositions.push(nodeStartPos);
                const breakWidget = createPageBreakWidget(
                  currentPageIndex - 1,
                  currentPageIndex,
                  pageW,
                  topMargin,
                  bottomMargin,
                  leftMargin,
                  rightMargin,
                  project,
                  exportMode,
                  extension.options.onEditHeaderFooter
                );
                decos.push(Decoration.widget(nodeStartPos, breakWidget, { side: -1 }));
                currentUsableRemaining = usableH - nodeHeight;
              } else {
                currentUsableRemaining -= nodeHeight;
              }
            });

            // 3. Final Footer Widget on Last Page
            const finalFooterWidget = createFooterWidget(
              currentPageIndex,
              bottomMargin,
              pageW,
              leftMargin,
              rightMargin,
              project,
              extension.options.onEditHeaderFooter
            );
            decos.push(Decoration.widget(doc.content.size, finalFooterWidget, { side: 1 }));

            const totalPages = Math.max(1, currentPageIndex);

            // Calculate current page based on cursor
            const selFrom = editorView.state.selection.from;
            let curPage = 1;
            for (let i = 0; i < breakPositions.length; i++) {
              if (selFrom >= breakPositions[i]) {
                curPage = i + 2;
              } else {
                break;
              }
            }

            const tr = editorView.state.tr.setMeta(PaginationPluginKey, {
              decorations: DecorationSet.create(doc, decos),
              pageCount: totalPages,
              currentPage: Math.min(totalPages, Math.max(1, curPage)),
              breakPositions,
            });

            editorView.dispatch(tr);
            extension.options.onPageCountChange?.(totalPages, curPage);
            isCalculating = false;
          };

          const scheduleRecalculate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              recalculate();
            });
          };

          // Trigger on fonts ready, images load, resize
          if (typeof document !== 'undefined' && document.fonts) {
            document.fonts.ready.then(scheduleRecalculate);
          }
          window.addEventListener('resize', scheduleRecalculate);
          scheduleRecalculate();

          return {
            update() {
              scheduleRecalculate();
            },
            destroy() {
              if (rafId) cancelAnimationFrame(rafId);
              window.removeEventListener('resize', scheduleRecalculate);
            },
          };
        },
      }),
    ];
  },
});

// Helper: Page 1 Top Header DOM
function createHeaderWidget(
  pageIndex: number,
  heightPx: number,
  widthPx: number,
  leftMarginPx: number,
  rightMarginPx: number,
  project: Project,
  onEdit?: () => void
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'muktolipi-header-widget select-none print:hidden';
  el.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: ${heightPx}px;
    width: ${widthPx}px;
    margin-left: -${leftMarginPx}px;
    margin-right: -${rightMarginPx}px;
    padding-left: ${leftMarginPx}px;
    padding-right: ${rightMarginPx}px;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(148, 163, 184, 0.35);
    font-size: 11px;
    color: #64748b;
    cursor: pointer;
  `;

  if (onEdit) {
    el.addEventListener('click', onEdit);
  }

  const hideFirstPage = project.differentFirstPage && pageIndex === 1;
  const pageNumStr = formatPageNumber(pageIndex, project.numberingStyle || 'bengali');

  const titleSpan = document.createElement('span');
  titleSpan.className = 'truncate max-w-[65%] font-medium';
  titleSpan.textContent = hideFirstPage ? '' : (project.headerText || project.title || '');

  const numSpan = document.createElement('span');
  numSpan.className = 'font-mono tabular-nums opacity-80';
  numSpan.textContent = hideFirstPage ? '' : pageNumStr;

  el.appendChild(titleSpan);
  el.appendChild(numSpan);
  return el;
}

// Helper: Final Footer DOM
function createFooterWidget(
  pageIndex: number,
  heightPx: number,
  widthPx: number,
  leftMarginPx: number,
  rightMarginPx: number,
  project: Project,
  onEdit?: () => void
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'muktolipi-footer-widget select-none print:hidden';
  el.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: ${heightPx}px;
    width: ${widthPx}px;
    margin-left: -${leftMarginPx}px;
    margin-right: -${rightMarginPx}px;
    padding-left: ${leftMarginPx}px;
    padding-right: ${rightMarginPx}px;
    box-sizing: border-box;
    border-top: 1px solid rgba(148, 163, 184, 0.35);
    font-size: 11px;
    color: #64748b;
    cursor: pointer;
  `;

  if (onEdit) {
    el.addEventListener('click', onEdit);
  }

  const pageNumStr = formatPageNumber(pageIndex, project.numberingStyle || 'bengali');

  const textSpan = document.createElement('span');
  textSpan.className = 'truncate max-w-[60%]';
  textSpan.textContent = project.footerText || '';

  const numSpan = document.createElement('span');
  numSpan.className = 'font-mono tabular-nums font-semibold';
  numSpan.textContent = pageNumStr;

  el.appendChild(textSpan);
  el.appendChild(numSpan);
  return el;
}

// Helper: Page Break Widget between Page N and Page N+1
function createPageBreakWidget(
  prevPageIndex: number,
  nextPageIndex: number,
  widthPx: number,
  topMarginPx: number,
  bottomMarginPx: number,
  leftMarginPx: number,
  rightMarginPx: number,
  project: Project,
  exportMode: boolean = false,
  onEdit?: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'muktolipi-page-break-widget select-none';
  container.style.cssText = `
    display: block;
    width: ${widthPx}px;
    margin-left: -${leftMarginPx}px;
    margin-right: -${rightMarginPx}px;
    box-sizing: border-box;
  `;

  // 1. Previous Page Footer
  const footerEl = createFooterWidget(
    prevPageIndex,
    bottomMarginPx,
    widthPx,
    leftMarginPx,
    rightMarginPx,
    project,
    onEdit
  );
  // Remove negative margins because container already handles them
  footerEl.style.marginLeft = '0px';
  footerEl.style.marginRight = '0px';
  container.appendChild(footerEl);

  // 2. Realistic Page Gap between sheets
  const gapEl = document.createElement('div');
  gapEl.className = 'muktolipi-page-gap print:hidden';
  if (!exportMode) {
    gapEl.style.cssText = `
      height: 28px;
      background-color: var(--page-gap-bg, #cbd5e1);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12), inset 0 -2px 4px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    const label = document.createElement('span');
    label.style.cssText = `
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
      letter-spacing: 0.05em;
    `;
    label.textContent = `পেজ ${toBengaliNumber(nextPageIndex)}`;
    gapEl.appendChild(label);
  } else {
    // In export/print mode: 0 gap with explicit CSS page break
    gapEl.style.cssText = `
      height: 0px;
      page-break-before: always;
      break-before: page;
    `;
  }
  container.appendChild(gapEl);

  // 3. Next Page Header
  const headerEl = createHeaderWidget(
    nextPageIndex,
    topMarginPx,
    widthPx,
    leftMarginPx,
    rightMarginPx,
    project,
    onEdit
  );
  headerEl.style.marginLeft = '0px';
  headerEl.style.marginRight = '0px';
  container.appendChild(headerEl);

  return container;
}
