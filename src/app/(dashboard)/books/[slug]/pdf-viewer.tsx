'use client';

import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  pdfUrl: string;
  pageNumber: number;
  scale: number;
  rotation: number;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onTextClick?: (text: string) => void;
}

export default function PdfViewer({
  pdfUrl,
  pageNumber,
  scale,
  rotation,
  onLoadSuccess,
  onTextClick,
}: PdfViewerProps) {
  const options = React.useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    [],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !onTextClick) return;

    function handleClick(e: MouseEvent) {
      const span = (e.target as HTMLElement)?.closest('.react-pdf__Page__textContent span');
      if (span?.textContent) {
        onTextClick?.(span.textContent.trim());
      }
    }

    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [onTextClick]);

  function onLoadError(error: Error) {
    console.error('PDF load error:', error);
  }

  return (
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
      <div ref={containerRef} className="overflow-y-auto min-h-0 max-h-full">
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
      </div>
    </Document>
  );
}
