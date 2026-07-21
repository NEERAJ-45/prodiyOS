'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, BookOpen, ArrowLeft, Search, X, ChevronUp, ChevronDown, Bookmark, BookmarkCheck, Highlighter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useBookmarksQuery, useAddBookmark, useDeleteBookmark } from '@/hooks/use-bookmarks';
import { cn } from '@/lib/utils';
import type { BookEntry } from '@/data/books';

const PdfViewer = dynamic(() => import('./pdf-viewer'), {
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

interface BookReaderClientProps {
  book?: BookEntry;
  title?: string;
  pdfUrl?: string;
  bookId?: string;
}

export function BookReaderClient({ book, title: propTitle, pdfUrl: propPdfUrl, bookId: propBookId }: BookReaderClientProps) {
  const { userEmail } = useProfile();
  const [numPages, setNumPages] = React.useState(0);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchMatches, setSearchMatches] = React.useState<{ page: number; index: number }[]>([]);
  const [currentMatch, setCurrentMatch] = React.useState(0);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [bookmarkOpen, setBookmarkOpen] = React.useState(false);
  const [highlightKey, setHighlightKey] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const displayTitle = book?.title || propTitle || 'Reader';
  const pdfUrl = propPdfUrl || (book ? `/api/books/${book.slug}` : '');
  const bookId = propBookId || book?.slug || '';

  const { data: bookmarks = [] } = useBookmarksQuery(bookId);
  const addBookmark = useAddBookmark();
  const deleteBookmark = useDeleteBookmark();
  const isBookmarked = bookmarks.some((b) => b.pageNumber === pageNumber);
  const currentBookmarkId = bookmarks.find((b) => b.pageNumber === pageNumber)?.id;

  React.useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (ticking) return;
      ticking = true;

      setPageNumber((p) => {
        const next = e.deltaY > 0 ? p + 1 : p - 1;
        return Math.max(1, Math.min(numPages || 1, next));
      });

      requestAnimationFrame(() => { ticking = false; });
    }

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [numPages]);

  React.useEffect(() => {
    if (!userEmail || !book) return;
    fetch('/api/db/activity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail, text: `Opened book "${displayTitle}"` }),
    }).catch(() => {});
  }, [userEmail, book, displayTitle]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function onLoadSuccess({ numPages: pages }: { numPages: number }) {
    setNumPages(pages);
  }

  function goToPrevPage() {
    setPageNumber((p) => Math.max(1, p - 1));
  }

  function goToNextPage() {
    setPageNumber((p) => Math.min(numPages, p + 1));
  }

  function zoomIn() {
    setScale((s) => Math.min(3, s + 0.25));
  }

  function zoomOut() {
    setScale((s) => Math.max(0.5, s - 0.25));
  }

  function rotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function handlePageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (val >= 1 && val <= numPages) setPageNumber(val);
  }

  function handleClearSearch() {
    setSearchQuery('');
    setSearchMatches([]);
    setCurrentMatch(0);
  }

  function handlePrevMatch() {
    setCurrentMatch((i) => Math.max(0, i - 1));
    setPageNumber((p) => searchMatches[Math.max(0, currentMatch - 1)]?.page ?? p);
  }

  function handleNextMatch() {
    setCurrentMatch((i) => Math.min(searchMatches.length - 1, i + 1));
    setPageNumber((p) => searchMatches[Math.min(searchMatches.length - 1, currentMatch + 1)]?.page ?? p);
  }

  function toggleBookmark() {
    if (!bookId) return;
    if (isBookmarked && currentBookmarkId) {
      deleteBookmark.mutate({ id: currentBookmarkId, bookId });
    } else {
      addBookmark.mutate({ bookId, pageNumber });
    }
  }

  function goToBookmarkPage(page: number) {
    setPageNumber(page);
    setBookmarkOpen(false);
  }

  function handleHighlightClick() {
    setHighlightKey((k) => k + 1);
  }

  function toggleSearch() {
    setSearchOpen(!searchOpen);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  return (
    <div ref={viewerRef} className="flex flex-col h-full">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/books"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Library
            </Link>
            <div className="w-px h-4 bg-zinc-800 shrink-0" />
            <BookOpen className="h-4 w-4 text-zinc-500 shrink-0" />
            <h1 className="text-sm font-medium text-zinc-200 truncate">{displayTitle}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-zinc-400 w-10 text-center shrink-0">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 3}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-zinc-800 shrink-0" />
            <Button variant="outline" size="icon" onClick={rotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-zinc-800 shrink-0" />
            <div className="flex items-center gap-0">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleBookmark}
                className={cn(isBookmarked ? 'text-amber-400 border-amber-700/50 hover:text-amber-300 rounded-r-none' : 'rounded-r-none')}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              {bookmarks.length > 0 ? (
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
                  <span>{bookmarks.length}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <div className="px-1" />
              )}
            </div>
            <div className="w-px h-5 bg-zinc-800 shrink-0" />
            <Button variant="outline" size="icon" onClick={handleHighlightClick} title="Highlight selected text">
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
            <div className="w-px h-5 bg-zinc-800 shrink-0" />
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
              <input
                type="number"
                value={pageNumber}
                onChange={handlePageInput}
                className="w-10 bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-center text-zinc-200 text-xs outline-none"
                min={1}
                max={numPages || 1}
              />
              <span>/ {numPages}</span>
            </div>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {numPages > 1 && (
              <div className="hidden sm:flex items-center w-24">
                <input
                  type="range"
                  min={1}
                  max={numPages}
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value, 10))}
                  className="w-full h-1 appearance-none cursor-pointer rounded-full bg-zinc-800 accent-zinc-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-400 [&::-webkit-slider-thumb]:shadow-sm"
                />
              </div>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in book..."
                className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
              />
              {searchQuery && (
                <button onClick={handleClearSearch} className="text-zinc-500 hover:text-zinc-300">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {searchMatches.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-zinc-500 w-14 text-center">{currentMatch + 1}{'/'}{searchMatches.length}</span>
                <button
                  onClick={handlePrevMatch}
                  disabled={currentMatch <= 0}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleNextMatch}
                  disabled={currentMatch >= searchMatches.length - 1}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  onClick={() => goToBookmarkPage(bm.pageNumber)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                    bm.pageNumber === pageNumber
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-600/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700 hover:text-zinc-200'
                  )}
                >
                  <BookmarkCheck className="h-3 w-3 shrink-0" />
                  p.{bm.pageNumber}
                  {bm.note && <span className="text-zinc-500 truncate max-w-[100px] ml-1">— {bm.note}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-zinc-950">
        <div className="flex justify-center py-4">
          <PdfViewer
            pdfUrl={pdfUrl}
            pageNumber={pageNumber}
            scale={scale}
            rotation={rotation}
            onLoadSuccess={onLoadSuccess}
            bookId={bookId}
            searchQuery={searchQuery}
            onSearchResults={setSearchMatches}
            currentMatch={currentMatch}
            highlightKey={highlightKey}
          />
        </div>
      </div>
    </div>
  );
}
