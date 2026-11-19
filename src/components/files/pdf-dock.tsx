'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
  X,
} from 'lucide-react';

const PdfViewer = dynamic(() => import('../../app/(reader)/books/[slug]/pdf-viewer'), {
  ssr: false,
});

const MIN_WIDTH = 400;
const MAX_WIDTH = 900;

export function PdfDock({
  node,
  onClose,
  onExpand,
  onLoaded,
}: {
  node: { id: string; title: string };
  onClose: () => void;
  onExpand: () => void;
  onLoaded: (pages: number) => void;
}) {
  const [width, setWidth] = React.useState(() => {
    if (typeof window === 'undefined') return 560;
    const stored = Number(window.sessionStorage.getItem('pdf-dock-width'));
    return stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : 560;
  });
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(0);
  const [scale, setScale] = React.useState(1);

  function startResize(event: React.PointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const move = (e: PointerEvent) => {
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth - (e.clientX - startX))));
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      setWidth((w) => {
        window.sessionStorage.setItem('pdf-dock-width', String(w));
        return w;
      });
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  return (
    <Box
      sx={{
        width: { xs: '100%', md: width },
        flexShrink: 0,
        position: { xs: 'fixed', md: 'relative' },
        top: { xs: 56, md: 'auto' },
        right: { xs: 0, md: 'auto' },
        bottom: { xs: 0, md: 'auto' },
        left: { xs: 0, md: 'auto' },
        zIndex: { xs: 40, md: 'auto' },
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        bgcolor: '#1a1a1a',
        borderLeft: { xs: 'none', md: '1px solid #101010' },
      }}
    >
      <Box
        onPointerDown={startResize}
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute',
          left: -3,
          top: 0,
          bottom: 0,
          width: 6,
          cursor: 'col-resize',
          zIndex: 2,
          '&:hover': { bgcolor: 'rgba(233,84,32,0.5)' },
        }}
      />

      <Box
        sx={{
          height: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          borderBottom: '1px solid #101010',
        }}
      >
        <Typography noWrap title={node.title} sx={{ flex: 1, fontSize: 12 }}>
          {node.title}
        </Typography>
        <IconButton
          size="small"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </IconButton>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', minWidth: 48, textAlign: 'center' }}>
          {page} / {pages || '–'}
        </Typography>
        <IconButton
          size="small"
          disabled={pages === 0 || page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </IconButton>
        <IconButton size="small" onClick={() => setScale((s) => Math.max(0.5, s - 0.15))} aria-label="Zoom out">
          <Minus size={13} />
        </IconButton>
        <Typography sx={{ fontSize: 10.5, color: 'text.secondary', minWidth: 30, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </Typography>
        <IconButton size="small" onClick={() => setScale((s) => Math.min(3, s + 0.15))} aria-label="Zoom in">
          <Plus size={13} />
        </IconButton>
        <IconButton size="small" onClick={onExpand} aria-label="Open full preview">
          <Maximize2 size={13} />
        </IconButton>
        <IconButton size="small" onClick={onClose} aria-label="Close PDF">
          <X size={14} />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: '#1e1e1e', p: 1 }}>
        <PdfViewer
          pdfUrl={`/api/docs/read/${node.id}`}
          pageNumber={page}
          scale={scale}
          rotation={0}
          onLoadSuccess={({ numPages }: { numPages: number }) => {
            setPages(numPages);
            onLoaded(numPages);
          }}
        />
      </Box>
    </Box>
  );
}
