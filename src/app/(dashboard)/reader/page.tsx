'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useReadArticle,
  useReaderArticlesQuery,
  useReaderArticleQuery,
  getStoredKey,
  storeKey,
  ReaderError,
} from '@/hooks/use-reader';
import { highlightText, clearHighlights } from '@/lib/reader-highlight';

const ARTICLE_CSS = `
.reader-article { max-width: 680px; margin: 0 auto; font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; font-size: 1.05rem; color: #e7e7ea; }
.reader-article h2 { font-size: 1.45rem; font-weight: 700; margin: 1.8rem 0 0.8rem; line-height: 1.3; }
.reader-article h2:first-child { margin-top: 0; }
.reader-article p { margin: 0 0 1.15rem; }
.reader-article figure { margin: 1.6rem 0; }
.reader-article img { display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 0 auto; }
.reader-article mark[data-reader-mark] { background: #fde047; color: #111; border-radius: 2px; padding: 0 1px; }
@media (prefers-color-scheme: light) {
  .reader-article { color: #1f1f22; }
}
`;

type View = 'form' | 'article' | 'library';

export default function ReaderPage() {
  const [key, setKey] = useState('');
  const [url, setUrl] = useState('');
  const [view, setView] = useState<View>('form');
  const [article, setArticle] = useState<{ title: string; html: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [matchIdx, setMatchIdx] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [libraryQ, setLibraryQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const articleRef = useRef<HTMLDivElement>(null);

  const readMutation = useReadArticle();
  const libraryQuery = useReaderArticlesQuery(key, debouncedQ);
  const singleQuery = useReaderArticleQuery(key, openUrl);

  // sessionStorage is browser-only; read after mount to avoid hydration mismatch.
  useEffect(() => {
    setKey(getStoredKey());
  }, []);

  // Debounce library search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(libraryQ), 300);
    return () => clearTimeout(t);
  }, [libraryQ]);

  // Reset find state whenever the displayed article changes.
  useEffect(() => {
    setFindQuery('');
    setMatchCount(0);
    setMatchIdx(0);
  }, [article]);

  // A saved article was fetched → show it.
  useEffect(() => {
    if (openUrl && singleQuery.data?.article) {
      const a = singleQuery.data.article;
      setArticle({ title: a.title, html: a.html, url: a.url });
      setOpenUrl(null);
      setView('article');
    }
    if (singleQuery.isError && openUrl) {
      setError(singleQuery.error instanceof ReaderError ? singleQuery.error.message : 'Something went wrong');
      setOpenUrl(null);
    }
  }, [openUrl, singleQuery.data, singleQuery.isError, singleQuery.error]);

  function onRead(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    readMutation.mutate(
      { key, url },
      {
        onSuccess: (data) => {
          storeKey(key);
          setKey(key);
          setArticle({ title: data.title, html: data.html, url: data.url });
          setView('article');
          setNotice(data.saved ? '' : 'Read, but not saved (database unavailable).');
        },
        onError: (err) => {
          setError(err instanceof ReaderError ? err.message : 'Something went wrong');
        },
      }
    );
  }

  function applyFind(q: string) {
    setFindQuery(q);
    const root = articleRef.current;
    if (!root) return;
    const marks = highlightText(root, q);
    setMatchCount(marks.length);
    setMatchIdx(marks.length ? 1 : 0);
    if (marks.length) marks[0].scrollIntoView({ block: 'center' });
  }

  function stepFind(dir: 1 | -1) {
    const root = articleRef.current;
    if (!root || matchCount === 0) return;
    const next = (matchIdx - 1 + dir + matchCount) % matchCount;
    const marks = root.querySelectorAll('mark[data-reader-mark]');
    setMatchIdx(next + 1);
    marks[next]?.scrollIntoView({ block: 'center' });
  }

  function backToForm() {
    const root = articleRef.current;
    if (root) clearHighlights(root);
    setArticle(null);
    setError('');
    setNotice('');
    setView('form');
  }

  return (
    <div className="min-h-full bg-background">
      <style>{ARTICLE_CSS}</style>
      <div className="mx-auto w-full max-w-[720px] px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Reader&apos;s Corner</h1>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setView('form')}
              className={`rounded-md border px-3 py-1.5 ${view === 'form' ? 'bg-secondary' : 'border-border text-muted-foreground'}`}
            >
              Read
            </button>
            <button
              onClick={() => setView('library')}
              className={`rounded-md border px-3 py-1.5 ${view === 'library' ? 'bg-secondary' : 'border-border text-muted-foreground'}`}
            >
              Library
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {notice}
          </div>
        )}

        {view === 'form' && (
          <form onSubmit={onRead} className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <label htmlFor="reader-key" className="mb-1 block text-sm font-medium">
                Access key
              </label>
              <input
                id="reader-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="reader-url" className="mb-1 block text-sm font-medium">
                Medium article URL
              </label>
              <input
                id="reader-url"
                type="url"
                inputMode="url"
                placeholder="https://medium.com/@author/title-…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={readMutation.isPending}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {readMutation.isPending ? 'Reading…' : 'Read'}
            </button>
          </form>
        )}

        {view === 'article' && article && (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button onClick={backToForm} className="rounded-md border border-border px-3 py-1.5 text-sm">
                ← New article
              </button>
              <div className="ml-auto flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm">
                <input
                  type="search"
                  placeholder="Find in article…"
                  value={findQuery}
                  onChange={(e) => applyFind(e.target.value)}
                  className="w-36 bg-transparent outline-none"
                  aria-label="Find in article"
                />
                {matchCount > 0 && (
                  <>
                    <span className="px-1 text-xs text-muted-foreground">
                      {matchIdx}/{matchCount}
                    </span>
                    <button onClick={() => stepFind(-1)} aria-label="Previous match" className="px-1">
                      ↑
                    </button>
                    <button onClick={() => stepFind(1)} aria-label="Next match" className="px-1">
                      ↓
                    </button>
                  </>
                )}
              </div>
            </div>
            <article className="reader-article" ref={articleRef} dangerouslySetInnerHTML={{ __html: article.html }} />
            <p className="mt-8 text-center text-xs text-muted-foreground">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="underline">
                View original on Medium
              </a>
            </p>
          </div>
        )}

        {view === 'library' && (
          <div>
            <input
              type="search"
              placeholder="Search saved articles…"
              value={libraryQ}
              onChange={(e) => setLibraryQ(e.target.value)}
              className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search saved articles"
            />
            {!key && (
              <p className="text-sm text-muted-foreground">Enter your access key on the Read tab first.</p>
            )}
            {key && libraryQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {key && libraryQuery.data?.articles.length === 0 && (
              <p className="text-sm text-muted-foreground">No saved articles{debouncedQ ? ` matching “${debouncedQ}”` : ''}.</p>
            )}
            <ul className="space-y-2">
              {libraryQuery.data?.articles.map((a) => (
                <li key={a.url}>
                  <button
                    onClick={() => setOpenUrl(a.url)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-secondary/50"
                  >
                    <span className="block font-medium">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {a.url} · {new Date(a.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
