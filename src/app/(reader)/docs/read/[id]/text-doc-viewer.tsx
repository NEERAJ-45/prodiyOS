'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlighter, Trash2 } from 'lucide-react';
import {
  useHighlightsQuery,
  useAddHighlight,
  useDeleteHighlight,
  type HighlightData,
} from '@/hooks/use-highlights';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = ['#fbbf24', '#f97316', '#ef4444', '#a78bfa', '#60a5fa', '#34d399'];

interface MatchRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function collectTextNodes(root: HTMLElement): { nodes: Text[]; full: string } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes: Text[] = [];
  const parts: string[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.textContent) continue;
    nodes.push(node);
    parts.push(node.textContent);
  }
  return { nodes, full: parts.join('') };
}

function findRanges(root: HTMLElement, query: string): Range[] {
  if (!query.trim()) return [];
  const { nodes, full } = collectTextNodes(root);
  const lowerFull = full.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: Range[] = [];
  let from = 0;

  while (from < lowerFull.length) {
    const pos = lowerFull.indexOf(lowerQuery, from);
    if (pos === -1) break;
    const end = pos + lowerQuery.length;

    let charCount = 0;
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;

    for (const node of nodes) {
      const len = node.textContent?.length || 0;
      const nodeStart = charCount;
      const nodeEnd = charCount + len;
      if (!startNode && pos < nodeEnd) {
        startNode = node;
        startOffset = pos - nodeStart;
      }
      if (!endNode && end <= nodeEnd) {
        endNode = node;
        endOffset = end - nodeStart;
        break;
      }
      charCount += len;
    }

    if (startNode && endNode) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      ranges.push(range);
    }
    from = end + 1;
  }

  return ranges;
}

function rangesToRects(ranges: Range[], container: HTMLElement): MatchRect[] {
  const containerRect = container.getBoundingClientRect();
  const rects: MatchRect[] = [];
  for (const range of ranges) {
    for (const r of Array.from(range.getClientRects())) {
      if (r.width === 0 || r.height === 0) continue;
      rects.push({
        top: r.top - containerRect.top,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height,
      });
    }
  }
  return rects;
}

function toAbsoluteRanges(root: HTMLElement, text: string): Range[] {
  return findRanges(root, text);
}

interface TextDocViewerProps {
  docId: string;
  contentUrl: string;
  searchQuery?: string;
  currentMatch?: number;
  onSearchResults?: (count: number) => void;
  highlightKey?: number;
}

interface ToolbarState {
  visible: boolean;
  x: number;
  y: number;
  selectedText: string;
}

export default function TextDocViewer({
  docId,
  contentUrl,
  searchQuery = '',
  currentMatch = 0,
  onSearchResults,
  highlightKey,
}: TextDocViewerProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [content, setContent] = React.useState<{ type: string; html?: string; text?: string } | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [toolbar, setToolbar] = React.useState<ToolbarState>({ visible: false, x: 0, y: 0, selectedText: '' });
  const [selectedColor, setSelectedColor] = React.useState(HIGHLIGHT_COLORS[0]);
  const [searchRects, setSearchRects] = React.useState<MatchRect[]>([]);
  const [highlightRects, setHighlightRects] = React.useState<{ id: string; color: string; rects: MatchRect[] }[]>([]);
  const [contentKey, setContentKey] = React.useState(0);

  const { data: highlights = [] } = useHighlightsQuery(docId);
  const addHighlight = useAddHighlight();
  const deleteHighlight = useDeleteHighlight();

  React.useEffect(() => {
    let cancelled = false;
    fetch(contentUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load content');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message || 'Failed to load content');
      });
    return () => { cancelled = true; };
  }, [contentUrl]);

  React.useEffect(() => {
    setContentKey((k) => k + 1);
  }, [content]);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    function onPointerUp(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (!el!.contains(target) && !target.closest('.highlight-toolbar')) {
        setToolbar((p) => ({ ...p, visible: false }));
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setToolbar((p) => ({ ...p, visible: false }));
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setToolbar((p) => ({ ...p, visible: false }));
        return;
      }
      setToolbar({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 44,
        selectedText: sel.toString().trim(),
      });
    }

    function onPointerDown(e: PointerEvent) {
      if (!(e.target as HTMLElement).closest('.highlight-toolbar')) {
        setToolbar((p) => ({ ...p, visible: false }));
      }
    }

    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [contentKey]);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (!searchQuery) {
      setSearchRects([]);
      onSearchResults?.(0);
      return;
    }

    const ranges = toAbsoluteRanges(el, searchQuery);
    setSearchRects(rangesToRects(ranges, el));
    onSearchResults?.(ranges.length);
  }, [searchQuery, contentKey, onSearchResults]);

  React.useEffect(() => {
    if (!searchRects.length) return;
    const idx = Math.min(currentMatch ?? 0, searchRects.length - 1);
    const rect = searchRects[idx];
    const el = contentRef.current;
    if (!el || !rect) return;
    const scroller = el.closest('[data-doc-scroller]');
    if (!scroller) return;
    const elRect = el.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const top = elRect.top - scrollerRect.top + scroller.scrollTop + rect.top - scroller.clientHeight / 3;
    scroller.scrollTo({ top, behavior: 'smooth' });
  }, [currentMatch, searchRects]);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const mapped = highlights
      .filter((h) => h.text)
      .map((h) => {
        const ranges = toAbsoluteRanges(el, h.text);
        return { id: h.id, color: h.color, rects: rangesToRects(ranges, el) };
      })
      .filter((m) => m.rects.length > 0);
    setHighlightRects(mapped);
  }, [highlights, contentKey]);

  React.useEffect(() => {
    if (!highlightKey) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    addHighlight.mutate({
      bookId: docId,
      pageNumber: 0,
      text: sel.toString().trim(),
      color: HIGHLIGHT_COLORS[0],
      rects: [],
    });
    sel.removeAllRanges();
  }, [highlightKey, docId, addHighlight]);

  function handleHighlight() {
    if (!toolbar.selectedText) return;
    addHighlight.mutate({
      bookId: docId,
      pageNumber: 0,
      text: toolbar.selectedText,
      color: selectedColor,
      rects: [],
    });
    window.getSelection()?.removeAllRanges();
    setToolbar({ visible: false, x: 0, y: 0, selectedText: '' });
  }

  function handleDeleteHighlight(id: string) {
    deleteHighlight.mutate({ id, bookId: docId });
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">{loadError}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
          <p className="text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-3xl mx-auto px-6 py-8">
      <div ref={contentRef} className="relative text-zinc-200 leading-relaxed text-sm">
        {content.type === 'docx' ? (
          <div
            className="prose-docx [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-zinc-100 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-zinc-100 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-zinc-100 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-zinc-700 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-zinc-900 [&_td]:border [&_td]:border-zinc-700 [&_td]:px-2 [&_td]:py-1 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:text-zinc-400 [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded"
            dangerouslySetInnerHTML={{ __html: content.html || '' }}
          />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.text || ''}</ReactMarkdown>
        )}

        {highlightRects.map((h) =>
          h.rects.map((rect, i) => (
            <div
              key={`${h.id}-${i}`}
              onClick={(e) => { e.stopPropagation(); handleDeleteHighlight(h.id); }}
              className="absolute cursor-pointer group/highlight pointer-events-auto"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: h.color,
                opacity: 0.35,
                mixBlendMode: 'multiply',
              }}
            >
              <div className="absolute -top-5 left-0 hidden group-hover/highlight:flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 z-50">
                <Trash2 className="h-3 w-3 text-red-400" />
              </div>
            </div>
          ))
        )}

        {searchQuery &&
          searchRects.map((rect, idx) => (
            <div
              key={`match-${idx}`}
              className="absolute pointer-events-none"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: idx === currentMatch ? 'rgba(250, 204, 21, 0.5)' : 'rgba(250, 204, 21, 0.25)',
                border: idx === currentMatch ? '2px solid rgb(250, 204, 21)' : 'none',
                borderRadius: '1px',
              }}
            />
          ))}
      </div>

      {toolbar.visible && (
        <div
          className="highlight-toolbar fixed z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl"
          style={{ left: toolbar.x, top: toolbar.y, transform: 'translateX(-50%)' }}
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

export type { HighlightData };
