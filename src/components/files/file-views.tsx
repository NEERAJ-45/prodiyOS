'use client';

import * as React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  File as FileIconBase,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { formatBytes, formatModified } from '@/lib/files/format';
import type { FileNode, FileSort, FileView } from '@/hooks/use-files';

const ROW_HEIGHT = 34;

export function FileGlyph({ node, size = 18 }: { node: FileNode; size?: number }) {
  if (node.kind === 'folder') {
    return (
      <Folder
        size={size}
        color="#e95420"
        fill="#e95420"
        fillOpacity={0.25}
        style={{ flexShrink: 0 }}
      />
    );
  }
  const mime = node.mimeType || '';
  const props = { size, style: { flexShrink: 0 } } as const;
  if (mime.startsWith('image/')) return <FileImage {...props} />;
  if (mime.startsWith('video/')) return <FileVideo {...props} />;
  if (mime.startsWith('audio/')) return <FileAudio {...props} />;
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('gzip')) {
    return <FileArchive {...props} />;
  }
  if (mime.includes('spreadsheet') || node.fileType === 'csv' || node.fileType === 'xlsx') {
    return <FileSpreadsheet {...props} />;
  }
  if (
    mime.startsWith('text/') ||
    /^(js|ts|tsx|jsx|py|go|rs|java|c|cpp|h|sh|sql|json|xml|html|css)$/.test(node.fileType)
  ) {
    return <FileCode {...props} />;
  }
  if (
    mime === 'application/pdf' ||
    node.fileType === 'docx' ||
    node.fileType === 'doc' ||
    node.fileType === 'md'
  ) {
    return <FileText {...props} />;
  }
  return <FileIconBase {...props} />;
}

function useItemDrag(node: FileNode, dragIds: string[], disabled?: boolean) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    data: { node, ids: dragIds },
    disabled,
  });
  return { attributes, listeners, setNodeRef, isDragging };
}

function useFolderDrop(id: string, disabled = false) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  return { setNodeRef, isOver };
}

export function InlineRename({
  defaultValue,
  onCommit,
  onCancel,
}: {
  defaultValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const cancelled = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const dot = defaultValue.lastIndexOf('.');
    input.focus();
    input.setSelectionRange(0, dot > 0 ? dot : defaultValue.length);
  }, [defaultValue]);

  return (
    <TextField
      inputRef={inputRef}
      defaultValue={defaultValue}
      variant="outlined"
      size="small"
      fullWidth
      slotProps={{ htmlInput: { maxLength: 255 } }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          const value = e.currentTarget.querySelector('input')?.value.trim() ?? '';
          if (value) onCommit(value);
          else onCancel();
        } else if (e.key === 'Escape') {
          cancelled.current = true;
          onCancel();
        }
      }}
      onBlur={(e) => {
        if (cancelled.current) return;
        const value = e.target.value.trim();
        if (value && value !== defaultValue) onCommit(value);
        else onCancel();
      }}
      sx={{
        '& .MuiOutlinedInput-root': { height: 24, fontSize: 12, backgroundColor: '#1f1f1f' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e95420' },
        '& input': { padding: '2px 6px' },
      }}
    />
  );
}

interface ItemProps {
  node: FileNode;
  selected: boolean;
  renaming: boolean;
  dragIds: string[];
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onRenameCommit: (value: string) => void;
  onRenameCancel: () => void;
}

function FileTile(props: ItemProps) {
  const { node, selected, renaming, dragIds } = props;
  const drag = useItemDrag(node, dragIds, renaming);
  const isFolder = node.kind === 'folder';
  const drop = useFolderDrop(
    isFolder ? `drop:${node.id}` : `drop:none:${node.id}`,
    !isFolder
  );

  return (
    <Box
      ref={(el: HTMLElement | null) => {
        drag.setNodeRef(el);
        if (isFolder) drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...(renaming ? {} : drag.listeners)}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      onContextMenu={props.onContextMenu}
      sx={{
        width: 104,
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 1.25,
        borderRadius: 1,
        cursor: 'default',
        userSelect: 'none',
        opacity: drag.isDragging ? 0.4 : 1,
        bgcolor: selected ? 'rgba(233,84,32,0.25)' : 'transparent',
        boxShadow: selected
          ? 'inset 0 0 0 1px rgba(233,84,32,0.7)'
          : drop.isOver
            ? 'inset 0 0 0 2px #e95420'
            : 'none',
        '&:hover': { bgcolor: selected ? 'rgba(233,84,32,0.3)' : 'rgba(255,255,255,0.07)' },
      }}
    >
      {node.mimeType?.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/docs/read/${node.id}`}
          alt=""
          loading="lazy"
          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
        />
      ) : (
        <FileGlyph node={node} size={40} />
      )}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        {renaming ? (
          <InlineRename
            defaultValue={node.title}
            onCommit={props.onRenameCommit}
            onCancel={props.onRenameCancel}
          />
        ) : (
          <Typography
            variant="caption"
            title={node.title}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            {node.title}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function FileRow(props: ItemProps) {
  const { node, selected, renaming, dragIds } = props;
  const drag = useItemDrag(node, dragIds, renaming);
  const isFolder = node.kind === 'folder';
  const drop = useFolderDrop(
    isFolder ? `drop:${node.id}` : `drop:none:${node.id}`,
    !isFolder
  );
  const typeLabel = node.kind === 'folder' ? 'Folder' : (node.fileType || 'file').toUpperCase();

  return (
    <TableRow
      ref={(el: HTMLTableRowElement | null) => {
        drag.setNodeRef(el);
        if (isFolder) drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...(renaming ? {} : drag.listeners)}
      hover
      selected={selected}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      onContextMenu={props.onContextMenu}
      sx={{
        height: ROW_HEIGHT,
        cursor: 'default',
        userSelect: 'none',
        opacity: drag.isDragging ? 0.4 : 1,
        outline: drop.isOver ? '2px solid #e95420' : 'none',
        outlineOffset: -2,
        '&.Mui-selected': { bgcolor: 'rgba(233,84,32,0.25)' },
        '&.Mui-selected:hover': { bgcolor: 'rgba(233,84,32,0.3)' },
      }}
    >
      <TableCell sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <FileGlyph node={node} size={17} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {renaming ? (
              <InlineRename
                defaultValue={node.title}
                onCommit={props.onRenameCommit}
                onCancel={props.onRenameCancel}
              />
            ) : (
              <Typography noWrap sx={{ fontSize: 13, color: 'text.primary' }} title={node.title}>
                {node.title}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell align="right" sx={{ width: 90, fontSize: 12, color: 'text.secondary' }}>
        {node.kind === 'folder' ? '—' : formatBytes(node.size)}
      </TableCell>
      <TableCell sx={{ width: 110, fontSize: 12, color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
        {typeLabel}
      </TableCell>
      <TableCell align="right" sx={{ width: 140, fontSize: 12, color: 'text.secondary' }}>
        {formatModified(node.updatedAt)}
      </TableCell>
    </TableRow>
  );
}

interface ViewsProps {
  nodes: FileNode[];
  view: FileView;
  sort: FileSort;
  dir: 'asc' | 'desc';
  selected: Set<string>;
  renamingId: string | null;
  dragIds: string[];
  onSort: (field: FileSort) => void;
  onItemClick: (e: React.MouseEvent, node: FileNode) => void;
  onItemDoubleClick: (node: FileNode) => void;
  onItemContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onRenameCommit: (node: FileNode, value: string) => void;
  onRenameCancel: () => void;
  onEmptyContextMenu: (e: React.MouseEvent) => void;
  onEmptyClick: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loading: boolean;
  emptyLabel: string;
}

export function FileViews(props: ViewsProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const { hasMore, loading, onLoadMore } = props;

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onLoadMore();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const itemProps = (node: FileNode): ItemProps => ({
    node,
    selected: props.selected.has(node.id),
    renaming: props.renamingId === node.id,
    dragIds: props.selected.has(node.id) ? Array.from(props.selected) : [node.id],
    onClick: (e) => {
      e.stopPropagation();
      props.onItemClick(e, node);
    },
    onDoubleClick: () => props.onItemDoubleClick(node),
    onContextMenu: (e) => props.onItemContextMenu(e, node),
    onRenameCommit: (value) => props.onRenameCommit(node, value),
    onRenameCancel: props.onRenameCancel,
  });

  if (props.nodes.length === 0 && !props.loading) {
    return (
      <Box
        onClick={props.onEmptyClick}
        onContextMenu={props.onEmptyContextMenu}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 5,
          textAlign: 'center',
        }}
      >
        <FolderOpen size={48} color="#4a4a4a" />
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>{props.emptyLabel}</Typography>
        <Typography sx={{ fontSize: 12, color: '#6f6f6f' }}>
          Right-click for options, or drag files here
        </Typography>
      </Box>
    );
  }

  if (props.view === 'grid') {
    return (
      <Box
        onClick={props.onEmptyClick}
        onContextMenu={props.onEmptyContextMenu}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: 0.5,
        }}
      >
        {props.nodes.map((node) => (
          <FileTile key={node.id} {...itemProps(node)} />
        ))}
        <Box ref={sentinelRef} sx={{ height: 32, width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      onContextMenu={props.onEmptyContextMenu}
    >
      <Box sx={{ flex: 1, overflow: 'auto' }} onClick={props.onEmptyClick}>
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 11 }}>
                <TableSortLabel
                  active={props.sort === 'name'}
                  direction={props.sort === 'name' ? props.dir : 'asc'}
                  onClick={() => props.onSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: 11 }}>
                <TableSortLabel
                  active={props.sort === 'size'}
                  direction={props.sort === 'size' ? props.dir : 'asc'}
                  onClick={() => props.onSort('size')}
                >
                  Size
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontSize: 11, display: { xs: 'none', sm: 'table-cell' } }}>
                <TableSortLabel
                  active={props.sort === 'type'}
                  direction={props.sort === 'type' ? props.dir : 'asc'}
                  onClick={() => props.onSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: 11 }}>
                <TableSortLabel
                  active={props.sort === 'modified'}
                  direction={props.sort === 'modified' ? props.dir : 'asc'}
                  onClick={() => props.onSort('modified')}
                >
                  Modified
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.nodes.map((node) => (
              <FileRow key={node.id} {...itemProps(node)} />
            ))}
          </TableBody>
        </Table>
        <Box ref={sentinelRef} sx={{ height: 32 }} />
      </Box>
    </Box>
  );
}
