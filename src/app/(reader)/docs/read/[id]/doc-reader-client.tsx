'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Highlighter,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBookmarksQuery, useAddBookmark, useDeleteBookmark } from '@/hooks/use-bookmarks';
import { useUpdateDoc, type DocData } from '@/hooks/use-docs';

const PdfViewer = dynamic(() => import('../../../books/[slug]/pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading PDF viewer...</p>
      </div>
    </div>
  ),
});

const TextDocViewer = dynamic(() => import('./text-doc-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading document...</p>
      </div>
    </div>
  ),
});

export function DocReaderClient({ doc }: { doc: DocData }) {
  const isPdf = doc.fileType === 'pdf';

  const [numPages, setNumPages] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [scale, setScale] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchCount, setSearchCount] = React.useState(0);
  const [currentMatch, setCurrentMatch] = React.useState(0);
  const [bookmarkOpen, setBookmarkOpen] = React.useState(false);
  const [scrollFraction, setScrollFraction] = React.useState(0);
  const [highlightKey, setHighlightKey] = React.useState(0);

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const progressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: bookmarks = [] } = useBookmarksQuery(doc.id);
  const addBookmark = useAddBookmark();
  const deleteBookmark = useDeleteBookmark();
  const updateDoc = useUpdateDoc();

  const bookmarkSlot = isPdf ? pageNumber : Math.round(scrollFraction * 100);
  const isBookmarked = bookmarks.some((b) => b.pageNumber === bookmarkSlot);
  const currentBookmarkId = bookmarks.find((b) => b.pageNumber === bookmarkSlot)?.id;

  React.useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const saveProgress = React.useCallback(
    (pct: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(pct)));
      if (clamped === doc.progress) return;
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      progressTimerRef.current = setTimeout(() => {
        updateDoc.mutate({ id: doc.id, progress: clamped });
      }, 1500);
    },
    [doc.id, doc.progress, updateDoc]
  );

  React.useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (isPdf && numPages) {
      saveProgress((pageNumber / numPages) * 100);
    }
  }, [isPdf, pageNumber, numPages, saveProgress]);

  function handleTextScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    const frac = max > 0 ? el.scrollTop / max : 0;
    setScrollFraction(frac);
    saveProgress(frac * 100);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function toggleBookmark() {
    if (isBookmarked && currentBookmarkId) {
      deleteBookmark.mutate({ id: currentBookmarkId, bookId: doc.id });
    } else {
      addBookmark.mutate({ bookId: doc.id, pageNumber: bookmarkSlot });
    }
  }

  function goToBookmark(slot: number) {
    setBookmarkOpen(false);
    if (isPdf) {
      setPageNumber(slot);
      return;
    }
    const scroller = document.querySelector('[data-doc-scroller]');
    if (scroller) {
      const max = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTo({ top: (slot / 100) * max, behavior: 'smooth' });
    }
  }

  function toggleSearch() {
    setSearchOpen(!searchOpen);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  if (isPdf) {
    return (
      <div className="flex flex-col h-full">
        <DocReaderToolbar
          title={doc.title}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          bookmarksCount={bookmarks.length}
          bookmarkOpen={bookmarkOpen}
          setBookmarkOpen={setBookmarkOpen}
          bookmarks={bookmarks}
          goToBookmark={goToBookmark}
          bookmarkSlot={bookmarkSlot}
          searchOpen={searchOpen}
          toggleSearch={toggleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchInputRef={searchInputRef}
          searchCount={searchCount}
          currentMatch={currentMatch}
          setCurrentMatch={setCurrentMatch}
          onHighlight={() => setHighlightKey((k) => k + 1)}
          pdfControls={
            <>
              <div className="flex items-center gap-0">
                <Button variant="outline" size="icon" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs text-zinc-400">{pageNumber}/{numPages || '?'}</span>
                <Button variant="outline" size="icon" onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-px h-5 bg-zinc-800 shrink-0" />
              <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-zinc-400 w-10 text-center shrink-0">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.25))} disabled={scale >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </>
          }
        />
        <div className="flex-1 overflow-auto bg-zinc-950">
          <div className="flex justify-center py-4">
            <PdfViewer
              pdfUrl={`/api/docs/read/${doc.id}`}
              pageNumber={pageNumber}
              scale={scale}
              rotation={0}
              onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
              bookId={doc.id}
              searchQuery={searchQuery}
              onSearchResults={(matches) => setSearchCount(matches.length)}
              currentMatch={currentMatch}
              highlightKey={highlightKey}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DocReaderToolbar
        title={doc.title}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isBookmarked={isBookmarked}
        toggleBookmark={toggleBookmark}
        bookmarksCount={bookmarks.length}
        bookmarkOpen={bookmarkOpen}
        setBookmarkOpen={setBookmarkOpen}
        bookmarks={bookmarks}
        goToBookmark={goToBookmark}
        bookmarkSlot={bookmarkSlot}
        searchOpen={searchOpen}
        toggleSearch={toggleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        searchCount={searchCount}
        currentMatch={currentMatch}
        setCurrentMatch={setCurrentMatch}
        onHighlight={() => setHighlightKey((k) => k + 1)}
      />
      <div data-doc-scroller onScroll={handleTextScroll} className="flex-1 overflow-auto bg-zinc-950">
        <TextDocViewer
          docId={doc.id}
          contentUrl={`/api/docs/content/${doc.id}`}
          searchQuery={searchQuery}
          currentMatch={currentMatch}
          onSearchResults={setSearchCount}
          highlightKey={highlightKey}
        />
      </div>
    </div>
  );
}

interface ToolbarProps {
  title: string;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isBookmarked: boolean;
  toggleBookmark: () => void;
  bookmarksCount: number;
  bookmarkOpen: boolean;
  setBookmarkOpen: (open: boolean) => void;
  bookmarks: { id: string; pageNumber: number; note?: string }[];
  goToBookmark: (slot: number) => void;
  bookmarkSlot: number;
  searchOpen: boolean;
  toggleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchCount: number;
  currentMatch: number;
  setCurrentMatch: (fn: (i: number) => number) => void;
  onHighlight: () => void;
  pdfControls?: React.ReactNode;
}

function DocReaderToolbar({
  title,
  isFullscreen,
  toggleFullscreen,
  isBookmarked,
  toggleBookmark,
  bookmarksCount,
  bookmarkOpen,
  setBookmarkOpen,
  bookmarks,
  goToBookmark,
  bookmarkSlot,
  searchOpen,
  toggleSearch,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  searchCount,
  currentMatch,
  setCurrentMatch,
  onHighlight,
  pdfControls,
}: ToolbarProps) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Docs
          </Link>
          <div className="w-px h-4 bg-zinc-800 shrink-0" />
          <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
          <h1 className="text-sm font-medium text-zinc-200 truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleBookmark}
              className={cn(isBookmarked ? 'text-amber-400 border-amber-700/50 hover:text-amber-300 rounded-r-none' : 'rounded-r-none')}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark here'}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            {bookmarksCount > 0 ? (
              <button
                onClick={() => setBookmarkOpen(!bookmarkOpen)}
                className={cn(
                  'flex items-center gap-1 px-1.5 h-9 border border-l-0 rounded-r-lg text-[11px] font-medium transition-colors',
                  isBookmarked
                    ? 'text-amber-400 border-amber-700/50 bg-zinc-800/50 hover:bg-zinc-700/50'
                    : 'text-zinc-400 border-zinc-700 bg-transparent hover:bg-zinc-800'
                )}
                title="View bookmarks"
              >
                <span>{bookmarksCount}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <div className="px-1" />
            )}
          </div>
          <div className="w-px h-5 bg-zinc-800 shrink-0" />
          <Button variant="outline" size="icon" onClick={onHighlight} title="Highlight selected text">
            <Highlighter className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-zinc-800 shrink-0" />
          <Button variant="outline" size="icon" onClick={toggleSearch}>
            <Search className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-zinc-800 shrink-0" />
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {pdfControls && (
            <>
              <div className="w-px h-5 bg-zinc-800 shrink-0" />
              {pdfControls}
            </>
          )}
        </div>
      </div>
      {searchOpen && (
        <div className="flex items-center gap-2 px-4 pb-2">
          <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatch(() => 0);
              }}
              placeholder="Search in doc..."
              className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {searchCount > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-zinc-500 w-14 text-center">{currentMatch + 1}/{searchCount}</span>
              <button
                onClick={() => setCurrentMatch((i) => Math.max(0, i - 1))}
                disabled={currentMatch <= 0}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentMatch((i) => Math.min(searchCount - 1, i + 1))}
                disabled={currentMatch >= searchCount - 1}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      {bookmarkOpen && bookmarks.length > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-900/80 px-4 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <BookmarkCheck className="h-3 w-3 text-zinc-500" />
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Bookmarks</span>
            <span className="text-[10px] text-zinc-600">({bookmarks.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {bookmarks.map((bm) => (
              <button
                key={bm.id}
                onClick={() => goToBookmark(bm.pageNumber)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                  bm.pageNumber === bookmarkSlot
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-600/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200'
                )}
              >
                <BookmarkCheck className="h-3 w-3 shrink-0" />
                {bm.note || `@${bm.pageNumber}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
