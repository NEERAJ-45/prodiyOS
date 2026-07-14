'use client';

import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Highlighter, Trash2 } from 'lucide-react';
import { useHighlightsQuery, useAddHighlight, useDeleteHighlight, type HighlightRect, type HighlightData } from '@/hooks/use-highlights';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const HIGHLIGHT_COLORS = ['#fbbf24', '#f97316', '#ef4444', '#a78bfa', '#60a5fa', '#34d399'];

interface PdfViewerProps {
  pdfUrl: string;
  pageNumber: number;
  scale: number;
  rotation: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  bookId?: string;
  onTextClick?: (text: string) => void;
}

interface ToolbarState {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
}

function normalizeRects(rects: DOMRect[], pageEl: HTMLElement, scale: number): HighlightRect[] {
  const pageRect = pageEl.getBoundingClientRect();
  return Array.from(rects).map((r) => ({
    top: (r.top - pageRect.top) / scale,
    left: (r.left - pageRect.left) / scale,
    width: r.width / scale,
    height: r.height / scale,
  }));
}

const HighlightOverlay = React.memo(function HighlightOverlay({
  highlights,
  scale,
  onDelete,
}: {
  highlights: HighlightData[];
  scale: number;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {highlights.map((h) =>
        h.rects.map((rect, i) => (
          <div
            key={`${h.id}-${i}`}
            onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
            className="absolute cursor-pointer group/highlight"
            style={{
              top: rect.top * scale,
              left: rect.left * scale,
              width: rect.width * scale,
              height: rect.height * scale,
              backgroundColor: h.color,
              opacity: 0.35,
              mixBlendMode: 'multiply',
              pointerEvents: 'auto',
            }}
          >
            <div className="absolute -top-5 left-0 hidden group-hover/highlight:flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 z-50">
              <Trash2 className="h-3 w-3 text-red-400" />
            </div>
          </div>
        ))
      )}
    </>
  );
});

export default function PdfViewer({
  pdfUrl,
  pageNumber,
  scale,
  rotation,
  onLoadSuccess,
  bookId,
  onTextClick,
}: PdfViewerProps) {
  const options = React.useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    [],
  );

  const { data: highlights = [] } = useHighlightsQuery(bookId);
  const addHighlight = useAddHighlight();
  const deleteHighlight = useDeleteHighlight();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = React.useState<ToolbarState>({ visible: false, x: 0, y: 0, selectedText: '' });
  const [selectedColor, setSelectedColor] = React.useState(HIGHLIGHT_COLORS[0]);

  const pageHighlights = React.useMemo(
    () => highlights.filter((h) => h.pageNumber === pageNumber),
    [highlights, pageNumber]
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMouseUp(e: MouseEvent) {
      const container = containerRef.current;
      if (!container) return;

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setToolbar((prev) => ({ ...prev, visible: false }));
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        setToolbar((prev) => ({ ...prev, visible: false }));
        return;
      }

      const cRect = container.getBoundingClientRect();
      setToolbar({
        visible: true,
        x: rect.left + rect.width / 2 - cRect.left,
        y: rect.top - cRect.top - 40,
        selectedText: sel.toString().trim(),
      });
    }

    function onMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-toolbar')) {
        setToolbar((prev) => ({ ...prev, visible: false }));
      }
    }

    el.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      el.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !onTextClick) return;

    function handleClick(e: MouseEvent) {
      const span = (e.target as HTMLElement)?.closest('.react-pdf__Page__textContent span');
      if (span?.textContent && onTextClick) {
        onTextClick(span.textContent.trim());
      }
    }

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [onTextClick]);

  function handleHighlight() {
    if (!toolbar.selectedText || !pageRef.current || !bookId) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const rawRects = range.getClientRects();
    const rects = normalizeRects(Array.from(rawRects) as DOMRect[], pageRef.current, scale);

    addHighlight.mutate({
      bookId,
      pageNumber,
      text: toolbar.selectedText,
      color: selectedColor,
      rects,
    });

    sel.removeAllRanges();
    setToolbar({ visible: false, x: 0, y: 0, selectedText: '' });
  }

  function handleDeleteHighlight(id: string) {
    if (!bookId) return;
    deleteHighlight.mutate({ id, bookId });
  }

  function onLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  return (
    <div className="relative">
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        options={options}
        loading={
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
              <p className="text-sm">Loading page {pageNumber}...</p>
            </div>
          </div>
        }
        error={
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-400">Failed to load PDF.</p>
          </div>
        }
      >
        <div ref={containerRef} className="overflow-y-auto min-h-0 max-h-full relative">
          <div ref={pageRef} className="relative">
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3 text-zinc-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
                    <p className="text-sm">Rendering page...</p>
                  </div>
                </div>
              }
              className="shadow-2xl"
            />
            <div className="absolute inset-0 pointer-events-none" style={{ top: 0, left: 0 }}>
              <HighlightOverlay
                highlights={pageHighlights}
                scale={scale}
                onDelete={handleDeleteHighlight}
              />
            </div>
          </div>
        </div>
      </Document>

      {toolbar.visible && (
        <div
          className="highlight-toolbar absolute z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl"
          style={{
            left: toolbar.x,
            top: toolbar.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-0.5 mr-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all',
                  selectedColor === color ? 'border-white scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="w-px h-4 bg-zinc-700 mx-0.5" />
          <button
            onClick={handleHighlight}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-amber-300 hover:bg-zinc-700 transition-colors"
          >
            <Highlighter className="h-3.5 w-3.5" />
            Highlight
          </button>
        </div>
      )}
    </div>
  );
}
