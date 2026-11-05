'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {
  Copy,
  Download,
  FolderInput,
  FolderOpen,
  FolderPlus,
  FilePlus,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useProfile } from '@/components/providers/ProfileProvider';
import { mimeForName } from '@/lib/files/mime';
import {
  useBulkNodeAction,
  useCreateNode,
  useDuplicateNode,
  useEmptyTrash,
  useFileNodeQuery,
  useFilesQuery,
  useNameSearchQuery,
  usePurgeNode,
  useRenameNode,
  type FileNode,
  type FileSort,
  type FileView,
} from '@/hooks/use-files';
import { useUploadFiles } from '@/hooks/use-upload';
import { useSelection } from '@/hooks/use-selection';
import { FileViews } from './file-views';
import {
  ConfirmDialog,
  ContextMenu,
  FolderPickerDialog,
  Headerbar,
  NameDialog,
  PlacesSidebar,
  StatusBar,
  type MenuItemSpec,
} from './file-chrome';
import { PdfDock } from './pdf-dock';
import { ProcessPanel } from './process-panel';
import { useProcesses } from './processes';
import { docsTheme } from './theme';

interface Params {
  folder: string | null;
  trash: boolean;
  view: FileView;
  sort: FileSort;
  dir: 'asc' | 'desc';
}

function buildUrl(pathname: string, p: Params) {
  const search = new URLSearchParams();
  if (p.folder) search.set('folder', p.folder);
  if (p.trash) search.set('trash', '1');
  if (p.view !== 'grid') search.set('view', p.view);
  if (p.sort !== 'name') search.set('sort', p.sort);
  if (p.dir !== 'asc') search.set('dir', p.dir);
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function itemSize(nodes: FileNode[]) {
  return nodes.reduce((total, node) => total + (node.kind === 'file' ? node.size || 0 : 0), 0);
}

export function FileManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { customDbUrl } = useProfile();

  const params: Params = {
    folder: searchParams.get('folder'),
    trash: searchParams.get('trash') === '1',
    view: searchParams.get('view') === 'list' ? 'list' : 'grid',
    sort: (['name', 'size', 'type', 'modified'].includes(searchParams.get('sort') ?? '')
      ? searchParams.get('sort')
      : 'name') as FileSort,
    dir: searchParams.get('dir') === 'desc' ? 'desc' : 'asc',
  };
  const { folder: folderId, trash, view, sort, dir } = params;

  const [history, setHistory] = React.useState(() => ({
    stack: [buildUrl(pathname, params)],
    index: 0,
  }));
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newDialog, setNewDialog] = React.useState<'folder' | 'file' | null>(null);
  const [moveIds, setMoveIds] = React.useState<string[] | null>(null);
  const [confirm, setConfirm] = React.useState<{
    title: string;
    message: string;
    label: string;
    onConfirm: () => void;
  } | null>(null);
  const [menu, setMenu] = React.useState<{
    x: number;
    y: number;
    node?: FileNode;
    ids: string[];
  } | null>(null);
  const [dragCount, setDragCount] = React.useState(0);
  const [pdfNode, setPdfNode] = React.useState<FileNode | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  const filesQuery = useFilesQuery({ parentId: folderId, sort, dir, trashed: trash });
  const nodes = React.useMemo(
    () => filesQuery.data?.pages.flatMap((page) => [...page.folders, ...page.files]) ?? [],
    [filesQuery.data]
  );
  const { data: folderData } = useFileNodeQuery(folderId);
  const { data: searchResults = [], isFetching: searchLoading } = useNameSearchQuery(debouncedSearch);

  const selection = useSelection(nodes.map((node) => node.id));

  const createNode = useCreateNode();
  const renameNode = useRenameNode();
  const bulkAction = useBulkNodeAction();
  const duplicateNode = useDuplicateNode();
  const purgeNode = usePurgeNode();
  const emptyTrash = useEmptyTrash();
  const {
    processes,
    startProcess,
    patchProcess,
    finishProcess,
    cancelProcess,
    removeProcess,
    clearFinished: clearProcesses,
  } = useProcesses();
  const { uploadFiles } = useUploadFiles({
    onStart: ({ id, name, abort }) => {
      setPanelOpen(true);
      startProcess({ id, kind: 'upload', name, abort, detail: 'Uploading…' });
    },
    onProgress: (id, progress) => patchProcess(id, { progress }),
    onFinish: (id, status, error) => finishProcess(id, status, error ?? (status === 'done' ? 'Uploaded' : undefined)),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    selection.clear();
    setRenamingId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, trash]);

  const path = React.useMemo(() => {
    const root = [{ id: null as string | null, title: 'Home' }];
    if (!folderId) return root;
    const ancestors = folderData?.path ?? [];
    const current = folderData?.doc ? [{ id: folderData.doc.id, title: folderData.doc.title }] : [];
    return [...root, ...ancestors, ...current];
  }, [folderId, folderData]);

  const parentFolderId = React.useMemo(() => {
    if (!folderId) return null;
    const idx = path.findIndex((segment) => segment.id === folderId);
    return idx > 0 ? path[idx - 1].id : null;
  }, [folderId, path]);

  function navigateTo(patch: Partial<Params>) {
    const next: Params = { ...params, ...patch };
    const url = buildUrl(pathname, next);
    if (url === buildUrl(pathname, params)) return;
    setHistory((h) => {
      const stack = [...h.stack.slice(0, h.index + 1), url];
      return { stack, index: stack.length - 1 };
    });
    router.replace(url, { scroll: false });
  }

  function goToIndex(index: number) {
    const url = history.stack[index];
    if (!url) return;
    setHistory((h) => ({ ...h, index }));
    router.replace(url, { scroll: false });
  }

  function openNode(node: FileNode) {
    if (node.kind === 'folder') {
      navigateTo({ folder: node.id, trash: false });
      return;
    }
    if (node.fileType === 'pdf' || node.mimeType === 'application/pdf') {
      openPdf(node);
      return;
    }
    router.push(`/docs/preview/${node.id}`);
  }

  function openPdf(node: FileNode) {
    setPdfNode(node);
    setPanelOpen(true);
    startProcess({
      id: `pdf-${node.id}`,
      kind: 'pdf',
      name: node.title,
      targetId: node.id,
      detail: 'Loading…',
      abort: () => setPdfNode(null),
    });
  }

  function closePdf() {
    if (pdfNode) finishProcess(`pdf-${pdfNode.id}`, 'done');
    setPdfNode(null);
  }

  function fail(title: string) {
    return (error: Error) => toast({ title, description: error.message, variant: 'error' });
  }

  function trashItems(ids: string[]) {
    bulkAction.mutate(
      { action: 'trash', ids },
      { onSuccess: () => selection.clear(), onError: fail('Could not move to trash') }
    );
  }

  function restoreItems(ids: string[]) {
    bulkAction.mutate(
      { action: 'restore', ids },
      { onSuccess: () => selection.clear(), onError: fail('Could not restore') }
    );
  }

  async function purgeItems(ids: string[]) {
    try {
      for (const id of ids) await purgeNode.mutateAsync({ id });
      selection.clear();
    } catch (error) {
      toast({
        title: 'Could not delete',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    }
  }

  function requestPurge(ids: string[]) {
    setConfirm({
      title: ids.length > 1 ? `Delete ${ids.length} items permanently?` : 'Delete permanently?',
      message: 'This action cannot be undone.',
      label: 'Delete',
      onConfirm: () => {
        setConfirm(null);
        void purgeItems(ids);
      },
    });
  }

  function requestEmptyTrash() {
    setConfirm({
      title: 'Empty trash?',
      message: 'All items in the trash will be deleted permanently. This cannot be undone.',
      label: 'Empty Trash',
      onConfirm: () => {
        setConfirm(null);
        emptyTrash.mutate(undefined, {
          onSuccess: () => selection.clear(),
          onError: fail('Could not empty trash'),
        });
      },
    });
  }

  async function duplicateItems(ids: string[]) {
    try {
      for (const id of ids) await duplicateNode.mutateAsync({ id, parentId: folderId });
    } catch (error) {
      toast({
        title: 'Could not duplicate',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    }
  }

  async function downloadItems(ids: string[]) {
    const single = ids.length === 1 ? nodes.find((n) => n.id === ids[0]) : undefined;
    if (single?.kind === 'file') {
      const anchor = document.createElement('a');
      anchor.href = `/api/docs/read/${single.id}?download=1`;
      anchor.download = single.title;
      anchor.click();
      return;
    }

    const processId = `zip-${ids[0] ?? 'root'}-${ids.length}`;
    const controller = new AbortController();
    setPanelOpen(true);
    startProcess({
      id: processId,
      kind: 'zip',
      name: single ? single.title : `${ids.length} items`,
      detail: 'Preparing archive…',
      abort: () => controller.abort(),
    });

    try {
      const res = await fetch('/api/docs/zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customDbUrl ? { 'x-mongodb-url': customDbUrl } : {}),
        },
        body: JSON.stringify({ ids }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'samundar-files.zip';
      anchor.click();
      URL.revokeObjectURL(url);
      finishProcess(processId, 'done', 'Downloaded');
    } catch (error) {
      if (controller.signal.aborted) {
        finishProcess(processId, 'canceled');
        return;
      }
      finishProcess(processId, 'error', error instanceof Error ? error.message : 'Download failed');
      toast({
        title: 'Could not download',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      });
    }
  }

  function onItemContextMenu(e: React.MouseEvent, node: FileNode) {
    e.preventDefault();
    e.stopPropagation();
    const wasSelected = selection.selected.has(node.id);
    if (!wasSelected) selection.only(node.id);
    setMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      ids: wasSelected ? selection.selectedIds : [node.id],
    });
  }

  function onEmptyContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, ids: [] });
  }

  function onItemClick(e: React.MouseEvent, node: FileNode) {
    selection.toggle(node.id, e.metaKey || e.ctrlKey, e.shiftKey);
  }

  function onDrop(event: DragEndEvent) {
    setDragCount(0);
    if (trash) return;
    const overId = String(event.over?.id ?? '');
    if (!overId.startsWith('drop:')) return;
    const raw = overId.slice(5);
    const target = raw.startsWith('side:') ? raw.slice(5) : raw;
    const targetId = target === 'root' ? null : target;
    const ids = (event.active.data.current?.ids as string[] | undefined) ?? [String(event.active.id)];
    if (targetId && ids.includes(targetId)) return;

    const dragged = nodes.filter((node) => ids.includes(node.id));
    const movable = dragged.filter((node) => node.parentId !== targetId && node.id !== targetId);
    if (movable.length === 0) return;

    bulkAction.mutate(
      { action: 'move', ids: movable.map((node) => node.id), parentId: targetId },
      { onSuccess: () => selection.clear(), onError: fail('Could not move') }
    );
  }

  function onDragStart(event: DragStartEvent) {
    const ids = (event.active.data.current?.ids as string[] | undefined) ?? [String(event.active.id)];
    setDragCount(ids.length);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      menu ||
      renamingId
    ) {
      return;
    }
    const count = selection.count;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      selection.selectAll();
      return;
    }
    if (e.key === 'Escape') {
      selection.clear();
      return;
    }
    if (e.key === 'F2' && count === 1) {
      e.preventDefault();
      setRenamingId(selection.selectedIds[0]);
      return;
    }
    if (e.key === 'Enter' && count === 1) {
      const node = nodes.find((n) => selection.selected.has(n.id));
      if (node) {
        e.preventDefault();
        openNode(node);
      }
      return;
    }
    if (e.key === 'Delete' && count > 0) {
      e.preventDefault();
      if (trash) requestPurge(selection.selectedIds);
      else trashItems(selection.selectedIds);
      return;
    }
    if (e.key === 'Backspace' && count === 0) {
      e.preventDefault();
      navigateTo({ folder: parentFolderId, trash: false });
    }
  }

  function menuItems(): MenuItemSpec[] {
    if (!menu) return [];
    if (trash) {
      if (!menu.node) {
        return [
          {
            label: 'Empty Trash',
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: requestEmptyTrash,
          },
          {
            label: 'Select All',
            onClick: selection.selectAll,
            shortcut: 'Ctrl+A',
            divider: true,
          },
          { label: 'Refresh', icon: <RefreshCw size={15} />, onClick: () => filesQuery.refetch() },
        ];
      }
      return [
        {
          label: menu.ids.length > 1 ? `Restore ${menu.ids.length} items` : 'Restore',
          icon: <RotateCcw size={15} />,
          onClick: () => restoreItems(menu.ids),
        },
        {
          label: menu.ids.length > 1 ? `Delete ${menu.ids.length} items permanently` : 'Delete permanently',
          icon: <Trash2 size={15} />,
          danger: true,
          divider: true,
          onClick: () => requestPurge(menu.ids),
        },
      ];
    }

    if (!menu.node) {
      return [
        { label: 'New Folder', icon: <FolderPlus size={15} />, onClick: () => setNewDialog('folder') },
        { label: 'New File', icon: <FilePlus size={15} />, onClick: () => setNewDialog('file') },
        {
          label: 'Upload Files',
          icon: <Upload size={15} />,
          onClick: () => document.getElementById('file-manager-upload')?.click(),
        },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          divider: true,
          onClick: selection.selectAll,
        },
        { label: 'Refresh', icon: <RefreshCw size={15} />, onClick: () => filesQuery.refetch() },
      ];
    }

    const single = menu.ids.length === 1;
    const node = menu.node;
    return [
      {
        label: 'Open',
        icon: <FolderOpen size={15} />,
        disabled: !single,
        onClick: () => openNode(node),
      },
      {
        label: 'Rename',
        icon: <Pencil size={15} />,
        shortcut: 'F2',
        disabled: !single,
        onClick: () => setRenamingId(node.id),
      },
      {
        label: 'Duplicate',
        icon: <Copy size={15} />,
        onClick: () => void duplicateItems(menu.ids),
      },
      {
        label: 'Move to…',
        icon: <FolderInput size={15} />,
        onClick: () => setMoveIds(menu.ids),
      },
      {
        label: node.kind === 'file' && single ? 'Download' : 'Download as ZIP',
        icon: <Download size={15} />,
        onClick: () => void downloadItems(menu.ids),
      },
      {
        label: menu.ids.length > 1 ? `Move ${menu.ids.length} items to Trash` : 'Move to Trash',
        icon: <Trash2 size={15} />,
        danger: true,
        divider: true,
        onClick: () => trashItems(menu.ids),
      },
    ];
  }

  const emptyLabel = trash
    ? 'Trash is empty'
    : debouncedSearch
      ? 'No results'
      : 'This folder is empty';

  return (
    <ThemeProvider theme={docsTheme}>
      <Box
        tabIndex={0}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          if (!trash && e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          if (trash || e.dataTransfer.files.length === 0) return;
          e.preventDefault();
          void uploadFiles(Array.from(e.dataTransfer.files), folderId);
        }}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#2b2b2b',
          color: 'text.primary',
          outline: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Headerbar
          path={path}
          onNavigate={(id) => navigateTo({ folder: id, trash: false })}
          onBack={() => goToIndex(history.index - 1)}
          onForward={() => goToIndex(history.index + 1)}
          canBack={history.index > 0}
          canForward={history.index < history.stack.length - 1}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onSearchSelect={(node) => {
            setSearchQuery('');
            openNode(node);
          }}
          view={view}
          onViewChange={(next) => navigateTo({ view: next })}
          onNewFolder={() => setNewDialog('folder')}
          onNewFile={() => setNewDialog('file')}
          onUpload={(files) => void uploadFiles(files, folderId)}
          onRefresh={() => void filesQuery.refetch()}
          trash={trash}
          onOpenTrash={() => navigateTo({ trash: true, folder: null })}
          onExitTrash={() => navigateTo({ trash: false })}
        />

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragEnd={onDrop}
            onDragCancel={() => setDragCount(0)}
          >
            <PlacesSidebar
              currentFolderId={folderId}
              onNavigate={(id) => navigateTo({ folder: id, trash: false })}
              onOpenTrash={() => navigateTo({ trash: true, folder: null })}
              trash={trash}
            />

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {trash ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderBottom: '1px solid #1b1b1b',
                    bgcolor: '#262626',
                  }}
                >
                  <Typography sx={{ flex: 1, fontSize: 12, color: 'text.secondary' }}>
                    Items in trash are deleted permanently when removed.
                  </Typography>
                  <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={requestEmptyTrash}>
                    Empty Trash
                  </Button>
                </Box>
              ) : selection.count > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderBottom: '1px solid #1b1b1b',
                    bgcolor: '#262626',
                  }}
                >
                  <Chip size="small" label={`${selection.count} selected`} sx={{ mr: 1 }} />
                  <Button size="small" startIcon={<FolderInput size={14} />} onClick={() => setMoveIds(selection.selectedIds)}>
                    Move
                  </Button>
                  <Button size="small" startIcon={<Download size={14} />} onClick={() => void downloadItems(selection.selectedIds)}>
                    Download
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Trash2 size={14} />}
                    onClick={() => trashItems(selection.selectedIds)}
                  >
                    Delete
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <IconButton size="small" onClick={selection.clear} aria-label="Clear selection">
                    <RefreshCw size={14} style={{ transform: 'rotate(45deg)' }} />
                  </IconButton>
                </Box>
              ) : null}

              <FileViews
                nodes={nodes}
                view={view}
                sort={sort}
                dir={dir}
                selected={selection.selected}
                renamingId={renamingId}
                dragIds={selection.selectedIds}
                onSort={(field) =>
                  navigateTo({ sort: field, dir: sort === field && dir === 'asc' ? 'desc' : 'asc' })
                }
                onItemClick={onItemClick}
                onItemDoubleClick={openNode}
                onItemContextMenu={onItemContextMenu}
                onRenameCommit={(node, title) => {
                  if (title === node.title) {
                    setRenamingId(null);
                    return;
                  }
                  renameNode.mutate(
                    { id: node.id, title },
                    {
                      onSettled: () => setRenamingId(null),
                      onError: fail('Could not rename'),
                    }
                  );
                }}
                onRenameCancel={() => setRenamingId(null)}
                onEmptyContextMenu={onEmptyContextMenu}
                onEmptyClick={selection.clear}
                hasMore={!!filesQuery.hasNextPage}
                onLoadMore={() => void filesQuery.fetchNextPage()}
                loading={filesQuery.isFetchingNextPage}
                emptyLabel={emptyLabel}
              />
            </Box>

            <DragOverlay dropAnimation={null}>
              {dragCount > 0 ? (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1,
                    bgcolor: '#383838',
                    border: '1px solid #e95420',
                    fontSize: 12,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
                  }}
                >
                  {dragCount > 1 ? `${dragCount} items` : 'Move item'}
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>

          {pdfNode ? (
            <PdfDock
              key={pdfNode.id}
              node={pdfNode}
              onClose={closePdf}
              onExpand={() => {
                closePdf();
                router.push(`/docs/preview/${pdfNode.id}`);
              }}
              onLoaded={(pages) =>
                patchProcess(`pdf-${pdfNode.id}`, { detail: `${pages} page${pages === 1 ? '' : 's'}` })
              }
            />
          ) : null}
        </Box>

        <StatusBar
          items={nodes.length}
          selected={selection.count}
          usedBytes={itemSize(nodes)}
          trash={trash}
          processCount={processes.length}
          onToggleProcesses={() => setPanelOpen((open) => !open)}
        />

        {panelOpen ? (
          <ProcessPanel
            processes={processes}
            onCancel={cancelProcess}
            onRemove={removeProcess}
            onClearFinished={clearProcesses}
            onClose={() => setPanelOpen(false)}
          />
        ) : null}

        <ContextMenu position={menu} items={menuItems()} onClose={() => setMenu(null)} />

        <NameDialog
          open={newDialog !== null}
          title={newDialog === 'folder' ? 'New Folder' : 'New File'}
          label={newDialog === 'folder' ? 'Folder name' : 'File name'}
          confirmLabel="Create"
          pending={createNode.isPending}
          onCancel={() => setNewDialog(null)}
          onConfirm={(title) => {
            const kind = newDialog === 'folder' ? 'folder' : 'text';
            createNode.mutate(
              {
                kind,
                title,
                parentId: folderId,
                content: kind === 'text' ? '' : undefined,
                mimeType: kind === 'text' ? mimeForName(title) : undefined,
              },
              {
                onSuccess: () => setNewDialog(null),
                onError: fail('Could not create'),
              }
            );
          }}
        />

        <FolderPickerDialog
          open={moveIds !== null}
          title={moveIds && moveIds.length > 1 ? `Move ${moveIds.length} items` : 'Move to folder'}
          onCancel={() => setMoveIds(null)}
          onConfirm={(targetId) => {
            const ids = moveIds ?? [];
            setMoveIds(null);
            bulkAction.mutate(
              { action: 'move', ids, parentId: targetId },
              { onSuccess: () => selection.clear(), onError: fail('Could not move') }
            );
          }}
        />

        <ConfirmDialog
          open={confirm !== null}
          title={confirm?.title ?? ''}
          message={confirm?.message ?? ''}
          confirmLabel={confirm?.label ?? 'Confirm'}
          pending={purgeNode.isPending || emptyTrash.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => confirm?.onConfirm()}
        />
      </Box>
    </ThemeProvider>
  );
}
