'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FilePlus,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useFileTreeQuery, type FileNode, type FileView } from '@/hooks/use-files';

const HOVER = 'rgba(255,255,255,0.07)';
const SELECTED = 'rgba(233,84,32,0.25)';

export interface MenuItemSpec {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  shortcut?: string;
}

export function ContextMenu({
  position,
  items,
  onClose,
}: {
  position: { x: number; y: number } | null;
  items: MenuItemSpec[];
  onClose: () => void;
}) {
  return (
    <Menu
      open={!!position}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ? { top: position.y, left: position.x } : undefined}
      slotProps={{ paper: { sx: { minWidth: 220, py: 0.5 } } }}
    >
      {items.map((item) => (
        <Box key={item.label}>
          {item.divider ? <Divider sx={{ my: 0.5 }} /> : null}
          <MenuItem
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onClick();
            }}
            sx={{ gap: 1.25, color: item.danger ? 'error.main' : 'text.primary' }}
          >
            <Box sx={{ display: 'flex', width: 16, justifyContent: 'center' }}>{item.icon}</Box>
            <Box sx={{ flex: 1, fontSize: 13 }}>{item.label}</Box>
            {item.shortcut ? (
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.shortcut}</Typography>
            ) : null}
          </MenuItem>
        </Box>
      ))}
    </Menu>
  );
}

export function NameDialog({
  open,
  title,
  label,
  initialValue,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = React.useState(initialValue ?? '');

  React.useEffect(() => {
    if (open) setValue(initialValue ?? '');
  }, [open, initialValue]);

  function submit() {
    const name = value.trim();
    if (name) onConfirm(name);
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label={label}
          value={value}
          slotProps={{ htmlInput: { maxLength: 255 } }}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!value.trim() || pending} onClick={submit}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 13, color: 'text.secondary' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="contained" color="error" disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface TreeItemProps {
  folder: FileNode;
  level: number;
  currentFolderId: string | null;
  selectMode?: boolean;
  dropPrefix?: string;
  onNavigate?: (id: string) => void;
  onSelectFolder?: (id: string) => void;
}

function TreeItem({
  folder,
  level,
  currentFolderId,
  selectMode = false,
  dropPrefix = 'drop:',
  onNavigate,
  onSelectFolder,
}: TreeItemProps) {
  const [expanded, setExpanded] = React.useState(false);
  const { data: children = [], isFetching } = useFileTreeQuery(folder.id, expanded);
  const { setNodeRef, isOver } = useDroppable({
    id: selectMode ? `drop:none:${folder.id}` : `${dropPrefix}${folder.id}`,
    disabled: selectMode,
  });
  const active = currentFolderId === folder.id;

  return (
    <Box ref={setNodeRef}>
      <ListItemButton
        onClick={() => (selectMode ? onSelectFolder?.(folder.id) : onNavigate?.(folder.id))}
        selected={active}
        sx={{
          pl: 1.25 + level * 1.5,
          pr: 1,
          py: 0.5,
          borderRadius: 1,
          mx: 0.75,
          bgcolor: isOver ? 'rgba(233,84,32,0.2)' : undefined,
          '&.Mui-selected': { bgcolor: SELECTED },
          '&:hover': { bgcolor: HOVER },
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((open) => !open);
          }}
          sx={{ p: 0.25, mr: 0.25, color: 'text.secondary' }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </IconButton>
        <ListItemIcon sx={{ minWidth: 26 }}>
          <Folder size={16} color="#e95420" fill="#e95420" fillOpacity={0.25} />
        </ListItemIcon>
        <ListItemText
          primary={folder.title}
          slotProps={{
            primary: { noWrap: true, sx: { fontSize: 12.5, color: 'text.primary' } },
          }}
        />
        {isFetching ? <CircularProgress size={10} /> : null}
      </ListItemButton>
      {expanded
        ? children.map((child) => (
            <TreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              selectMode={selectMode}
              dropPrefix={dropPrefix}
              onNavigate={onNavigate}
              onSelectFolder={onSelectFolder}
            />
          ))
        : null}
    </Box>
  );
}

export function FolderPickerDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: (folderId: string | null) => void;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const { data: roots = [] } = useFileTreeQuery(null, open);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ p: 1, minHeight: 220 }}>
        <List dense disablePadding>
          <ListItemButton
            selected={selected === null}
            onClick={() => setSelected(null)}
            sx={{ borderRadius: 1, mx: 0.5, '&.Mui-selected': { bgcolor: SELECTED } }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Home size={16} />
            </ListItemIcon>
            <ListItemText primary="Home" slotProps={{ primary: { sx: { fontSize: 13 } } }} />
          </ListItemButton>
          {roots.map((folder) => (
            <TreeItem
              key={folder.id}
              folder={folder}
              level={0}
              currentFolderId={selected}
              selectMode
              onSelectFolder={setSelected}
            />
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onConfirm(selected)}>
          Move here
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function Headerbar({
  path,
  onNavigate,
  onBack,
  onForward,
  canBack,
  canForward,
  searchQuery,
  onSearchChange,
  searchResults,
  searchLoading,
  onSearchSelect,
  view,
  onViewChange,
  onNewFolder,
  onNewFile,
  onUpload,
  onRefresh,
  trash,
  onOpenTrash,
  onExitTrash,
}: {
  path: { id: string | null; title: string }[];
  onNavigate: (id: string | null) => void;
  onBack: () => void;
  onForward: () => void;
  canBack: boolean;
  canForward: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchResults: FileNode[];
  searchLoading: boolean;
  onSearchSelect: (node: FileNode) => void;
  view: FileView;
  onViewChange: (view: FileView) => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onUpload: (files: File[]) => void;
  onRefresh: () => void;
  trash: boolean;
  onOpenTrash: () => void;
  onExitTrash: () => void;
}) {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = React.useState<HTMLElement | null>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const showResults = searchFocused && searchQuery.trim().length > 0;

  return (
    <Box
      sx={{
        height: 48,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        bgcolor: '#303030',
        borderBottom: '1px solid #1b1b1b',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <IconButton size="small" disabled={!canBack} onClick={onBack} aria-label="Back">
        <ArrowLeft size={18} />
      </IconButton>
      <IconButton size="small" disabled={!canForward} onClick={onForward} aria-label="Forward">
        <ArrowRight size={18} />
      </IconButton>
      <IconButton size="small" onClick={onRefresh} aria-label="Refresh">
        <RefreshCw size={16} />
      </IconButton>

      <Breadcrumbs
        separator={<ChevronRight size={13} />}
        sx={{ flex: 1, minWidth: 0, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
      >
        <Button
          size="small"
          onClick={() => (trash ? onExitTrash() : onNavigate(null))}
          sx={{ color: trash ? 'text.secondary' : 'text.primary', minWidth: 0, px: 1, py: 0.25, fontSize: 13 }}
        >
          <Home size={14} style={{ marginRight: 4 }} />
          Home
        </Button>
        {trash ? (
          <Button size="small" sx={{ color: 'text.primary', fontSize: 13, px: 1, py: 0.25 }}>
            Trash
          </Button>
        ) : (
          path.slice(1).map((segment) => (
            <Button
              key={segment.id ?? 'root'}
              size="small"
              onClick={() => onNavigate(segment.id)}
              sx={{ color: 'text.primary', minWidth: 0, px: 1, py: 0.25, fontSize: 13, whiteSpace: 'nowrap' }}
            >
              {segment.title}
            </Button>
          ))
        )}
      </Breadcrumbs>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1,
          height: 32,
          width: { xs: 150, sm: 220 },
          bgcolor: '#262626',
          border: '1px solid #1b1b1b',
          borderRadius: 4,
          position: 'relative',
        }}
      >
        <Search size={14} color="#9a9996" />
        <InputBase
          value={searchQuery}
          placeholder="Search files…"
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          sx={{ flex: 1, fontSize: 12.5, '& input': { p: 0 } }}
        />
        {searchLoading ? <CircularProgress size={12} /> : null}
        {showResults ? (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: 36,
              left: 0,
              right: 0,
              maxHeight: 280,
              overflowY: 'auto',
              bgcolor: '#383838',
              border: '1px solid #1b1b1b',
              zIndex: 20,
            }}
          >
            {searchResults.length === 0 ? (
              <Typography sx={{ p: 1.5, fontSize: 12, color: 'text.secondary' }}>
                No matches
              </Typography>
            ) : (
              searchResults.map((node) => (
                <Box
                  key={node.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSearchSelect(node);
                    setSearchFocused(false);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: HOVER },
                  }}
                >
                  <Folder size={14} color={node.kind === 'folder' ? '#e95420' : '#9a9996'} />
                  <Typography noWrap sx={{ fontSize: 12.5 }}>
                    {node.title}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>
        ) : null}
      </Box>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={view}
        onChange={(_, next: FileView | null) => next && onViewChange(next)}
        sx={{ height: 32, '& .MuiToggleButton-root': { px: 1, border: '1px solid #1b1b1b' } }}
      >
        <ToggleButton value="grid" aria-label="Grid view">
          <LayoutGrid size={16} />
        </ToggleButton>
        <ToggleButton value="list" aria-label="List view">
          <ListIcon size={16} />
        </ToggleButton>
      </ToggleButtonGroup>

      {!trash ? (
        <>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Plus size={15} />}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ height: 32, borderColor: '#1b1b1b', color: 'text.primary', whiteSpace: 'nowrap' }}
          >
            New
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); onNewFolder(); }}>
              <FolderPlus size={15} style={{ marginRight: 10 }} /> New Folder
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); onNewFile(); }}>
              <FilePlus size={15} style={{ marginRight: 10 }} /> New File
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setMenuAnchor(null); fileInput.current?.click(); }}>
              <Upload size={15} style={{ marginRight: 10 }} /> Upload Files
            </MenuItem>
          </Menu>
        </>
      ) : null}

      <input
        id="file-manager-upload"
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onUpload(files);
          e.target.value = '';
        }}
      />

      <IconButton size="small" onClick={onOpenTrash} aria-label="Trash" disabled={trash}>
        <Trash2 size={16} />
      </IconButton>

      <IconButton
        size="small"
        onClick={(e) => setMoreAnchor(e.currentTarget)}
        aria-label="More options"
      >
        <MoreVertical size={16} />
      </IconButton>
      <Menu anchorEl={moreAnchor} open={!!moreAnchor} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={() => { setMoreAnchor(null); fileInput.current?.click(); }}>
          <Upload size={15} style={{ marginRight: 10 }} /> Upload Files
        </MenuItem>
        <MenuItem onClick={() => { setMoreAnchor(null); onRefresh(); }}>
          <RefreshCw size={15} style={{ marginRight: 10 }} /> Refresh
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setMoreAnchor(null); trash ? onExitTrash() : onOpenTrash(); }}>
          <Trash2 size={15} style={{ marginRight: 10 }} /> {trash ? 'Exit Trash' : 'Open Trash'}
        </MenuItem>
      </Menu>
    </Box>
  );
}

export function PlacesSidebar({
  currentFolderId,
  onNavigate,
  onOpenTrash,
  trash,
}: {
  currentFolderId: string | null;
  onNavigate: (id: string | null) => void;
  onOpenTrash: () => void;
  trash: boolean;
}) {
  const { data: roots = [], isFetching } = useFileTreeQuery(null);
  const { setNodeRef, isOver } = useDroppable({ id: 'drop:side:root' });

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        flexShrink: 0,
        bgcolor: '#262626',
        borderRight: '1px solid #1b1b1b',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <Typography sx={{ px: 2, py: 0.5, fontSize: 10.5, letterSpacing: 0.8, color: 'text.secondary' }}>
          PLACES
        </Typography>
        <List dense disablePadding>
          <Box ref={setNodeRef}>
            <ListItemButton
              onClick={() => onNavigate(null)}
              selected={!trash && currentFolderId === null}
              sx={{
                mx: 0.75,
                borderRadius: 1,
                py: 0.6,
                bgcolor: isOver ? 'rgba(233,84,32,0.2)' : undefined,
                '&.Mui-selected': { bgcolor: SELECTED },
                '&:hover': { bgcolor: HOVER },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Home size={16} />
              </ListItemIcon>
              <ListItemText primary="Home" slotProps={{ primary: { sx: { fontSize: 12.5 } } }} />
            </ListItemButton>
          </Box>

          <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: 10.5, letterSpacing: 0.8, color: 'text.secondary' }}>
            FOLDERS {isFetching ? '…' : ''}
          </Typography>
          {roots.map((folder) => (
            <TreeItem
              key={folder.id}
              folder={folder}
              level={0}
              currentFolderId={currentFolderId}
              dropPrefix="drop:side:"
              onNavigate={onNavigate}
            />
          ))}

          <Divider sx={{ my: 1 }} />
          <ListItemButton
            onClick={onOpenTrash}
            selected={trash}
            sx={{
              mx: 0.75,
              borderRadius: 1,
              py: 0.6,
              '&.Mui-selected': { bgcolor: SELECTED },
              '&:hover': { bgcolor: HOVER },
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              <Trash2 size={16} />
            </ListItemIcon>
            <ListItemText primary="Trash" slotProps={{ primary: { sx: { fontSize: 12.5 } } }} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );
}

export function StatusBar({
  items,
  selected,
  usedBytes,
  trash,
  processCount,
  onToggleProcesses,
}: {
  items: number;
  selected: number;
  usedBytes: number;
  trash: boolean;
  processCount: number;
  onToggleProcesses: () => void;
}) {
  return (
    <Box
      sx={{
        height: 28,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 1.5,
        bgcolor: '#303030',
        borderTop: '1px solid #1b1b1b',
        fontSize: 11.5,
        color: 'text.secondary',
      }}
    >
      <span>
        {items} item{items === 1 ? '' : 's'}
      </span>
      {selected > 0 ? <span>{selected} selected</span> : null}
      <Box sx={{ flex: 1 }} />
      {trash ? <span>Trash</span> : null}
      <Button
        size="small"
        onClick={onToggleProcesses}
        startIcon={<Activity size={12} />}
        sx={{ fontSize: 11.5, minWidth: 0, px: 0.75, py: 0, color: 'text.secondary', textTransform: 'none' }}
      >
        Tasks{processCount > 0 ? ` (${processCount})` : ''}
      </Button>
      <span>{(usedBytes / (1024 * 1024)).toFixed(1)} MB used</span>
    </Box>
  );
}
