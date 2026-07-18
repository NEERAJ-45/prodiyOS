'use client';

import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfData: string;
  fileName?: string;
}

function dataUrlToBlobUrl(url: string): string {
  const [header, base64] = url.split(',', 2);
  const mime = header?.split(':')[1]?.split(';')[0] || 'application/pdf';
  const raw = atob(base64 || '');
  const buf = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const blob = new Blob([buf], { type: mime });
  return URL.createObjectURL(blob);
}

export function PdfPreviewDialog({ open, onOpenChange, pdfData, fileName }: PdfPreviewDialogProps) {
  const [numPages, setNumPages] = React.useState(0);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    if (!open || !pdfData) return;
    setLoadError(false);
    setNumPages(0);
    if (pdfData.startsWith('data:')) {
      const url = dataUrlToBlobUrl(pdfData);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBlobUrl(pdfData);
  }, [open, pdfData]);

  const options = React.useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  }), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 text-sm truncate">
            {fileName || 'Resume Preview'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto flex flex-col items-center py-4">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-red-400">Failed to load PDF.</p>
            </div>
          ) : blobUrl ? (
            <Document
              file={blobUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setLoadError(true)}
              options={options}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-sm text-red-400">Failed to load PDF.</p>
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  scale={1.0}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="mb-4 shadow-2xl last:mb-0"
                  loading={
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                  }
                />
              ))}
            </Document>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          )}
        </div>

        {numPages > 0 && !loadError && (
          <div className="flex items-center justify-center py-2 text-xs text-zinc-500 border-t border-zinc-800">
            <span>{numPages} page{numPages !== 1 ? 's' : ''}</span>
          </div>
        )}

        <DialogFooter className="border-t border-zinc-800 pt-3">
          <div className="flex gap-2 w-full justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const a = document.createElement('a');
                a.href = pdfData;
                a.download = fileName || 'resume.pdf';
                a.click();
              }}
            >
              <FileDown className="h-3.5 w-3.5" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
