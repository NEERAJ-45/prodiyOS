'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Download, Edit3, Eye, Loader2 } from 'lucide-react';
import { useFileNodeQuery, useSaveTextContent, useTextContentQuery } from '@/hooks/use-files';
import { formatBytes } from '@/lib/files/format';

const PdfViewer = dynamic(() => import('../../../books/[slug]/pdf-viewer'), {
  ssr: false,
  loading: () => <Center>Loading PDF…</Center>,
});

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-zinc-500">{children}</div>;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .slice(0, 1000)
    .map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '')));
}

export default function PreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, isLoading } = useFileNodeQuery(id ?? null);
  const doc = data?.doc ?? null;

  const mime = doc?.mimeType ?? '';
  const fileType = doc?.fileType ?? '';
  const isMarkdown = fileType === 'md' || mime === 'text/markdown';
  const isText =
    mime.startsWith('text/') ||
    isMarkdown ||
    ['json', 'csv', 'js', 'ts', 'tsx', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'sh', 'sql', 'xml', 'html', 'css'].includes(
      fileType
    );

  const { data: content } = useTextContentQuery(isText ? id : null);
  const saveContent = useSaveTextContent();
  const [text, setText] = React.useState('');
  const [dirty, setDirty] = React.useState(false);
  const [mode, setMode] = React.useState<'preview' | 'edit'>('preview');

  React.useEffect(() => {
    if (typeof content?.text === 'string') setText(content.text);
  }, [content?.text]);

  React.useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      saveContent.mutate(
        { id, content: text },
        { onSuccess: () => setDirty(false) }
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [dirty, id, saveContent, text]);

  const [numPages, setNumPages] = React.useState(0);

  if (isLoading) return <Center><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading file…</Center>;
  if (!doc) return <Center>File not found.</Center>;

  const downloadUrl = `/api/docs/read/${doc.id}?download=1`;

  return (
    <div className="flex h-dvh flex-col bg-[#1b1b1b] text-zinc-200">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-[#262626] px-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-zinc-700"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.title}</p>
          <p className="text-[11px] text-zinc-500">
            {fileType.toUpperCase() || 'FILE'} · {formatBytes(doc.size)}
            {saveContent.isPending ? ' · saving…' : dirty ? ' · unsaved' : ''}
          </p>
        </div>
        {isText && isMarkdown ? (
          <button
            onClick={() => setMode((m) => (m === 'preview' ? 'edit' : 'preview'))}
            className="flex h-8 items-center gap-1.5 rounded px-2 text-xs hover:bg-zinc-700"
          >
            {mode === 'preview' ? <Edit3 size={14} /> : <Eye size={14} />}
            {mode === 'preview' ? 'Edit' : 'Preview'}
          </button>
        ) : null}
        {isMarkdown || fileType === 'pdf' ? (
          <Link
            href={`/docs/read/${doc.id}`}
            className="flex h-8 items-center gap-1.5 rounded px-2 text-xs hover:bg-zinc-700"
          >
            <Eye size={14} /> Reader
          </Link>
        ) : null}
        <a
          href={downloadUrl}
          className="flex h-8 items-center gap-1.5 rounded px-2 text-xs hover:bg-zinc-700"
        >
          <Download size={14} /> Download
        </a>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        {mime.startsWith('image/') ? (
          <div className="flex h-full items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/docs/read/${doc.id}`} alt={doc.title} className="max-h-full max-w-full object-contain" />
          </div>
        ) : mime.startsWith('video/') ? (
          <div className="flex h-full items-center justify-center p-4">
            <video src={`/api/docs/read/${doc.id}`} controls className="max-h-full max-w-full" />
          </div>
        ) : mime.startsWith('audio/') ? (
          <div className="flex h-full items-center justify-center p-4">
            <audio src={`/api/docs/read/${doc.id}`} controls className="w-full max-w-lg" />
          </div>
        ) : fileType === 'pdf' ? (
          <PdfViewer
            pdfUrl={`/api/docs/read/${doc.id}`}
            pageNumber={1}
            scale={1.2}
            rotation={0}
            onLoadSuccess={({ numPages: pages }: { numPages: number }) => setNumPages(pages)}
          />
        ) : isText ? (
          fileType === 'csv' && mode === 'preview' ? (
            <div className="p-4">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {parseCsv(text).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'bg-zinc-800 font-semibold' : ''}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-zinc-800 px-2 py-1">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isMarkdown && mode === 'preview' ? (
            <div className="prose prose-invert mx-auto max-w-3xl p-6 text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setDirty(true);
              }}
              spellCheck={false}
              className="h-full w-full resize-none bg-[#1b1b1b] p-5 font-mono text-[13px] leading-6 text-zinc-200 outline-none"
            />
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-zinc-500">
            <p>No inline preview for this file type.</p>
            <a href={downloadUrl} className="rounded border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800">
              Download file
            </a>
          </div>
        )}
      </main>
      {fileType === 'pdf' && numPages > 0 ? (
        <footer className="h-7 shrink-0 border-t border-zinc-800 bg-[#262626] px-3 text-[11px] leading-7 text-zinc-500">
          {numPages} pages
        </footer>
      ) : null}
    </div>
  );
}
