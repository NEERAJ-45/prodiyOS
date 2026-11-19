'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { FileUp, FileArchive, FileText, X } from 'lucide-react';
import type { AppProcess, ProcessKind } from './processes';

const KIND_ICON: Record<ProcessKind, React.ReactNode> = {
  upload: <FileUp size={15} />,
  zip: <FileArchive size={15} />,
  pdf: <FileText size={15} />,
};

function elapsed(startedAt: number, now: number) {
  const seconds = Math.max(0, Math.round((now - startedAt) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const STATUS_COLOR: Record<AppProcess['status'], string> = {
  running: '#e95420',
  done: '#57e389',
  error: '#e01b24',
  canceled: '#9a9996',
};

export function ProcessPanel({
  processes,
  onCancel,
  onRemove,
  onClearFinished,
  onClose,
}: {
  processes: AppProcess[];
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onClearFinished: () => void;
  onClose: () => void;
}) {
  const [now, setNow] = React.useState(() => Date.now());
  const hasRunning = processes.some((p) => p.status === 'running');

  React.useEffect(() => {
    if (!hasRunning) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasRunning]);

  const ordered = React.useMemo(
    () => [...processes].sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running')),
    [processes]
  );

  return (
    <Paper
      elevation={10}
      sx={{
        position: 'absolute',
        right: 16,
        bottom: 40,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: '55vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#303030',
        border: '1px solid #1b1b1b',
        zIndex: 30,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75 }}>
        <Typography sx={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Background tasks</Typography>
        {processes.some((p) => p.status !== 'running') ? (
          <Button size="small" onClick={onClearFinished} sx={{ fontSize: 11, minWidth: 0, px: 1 }}>
            Clear finished
          </Button>
        ) : null}
        <IconButton size="small" onClick={onClose} aria-label="Close task panel">
          <X size={14} />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {processes.length === 0 ? (
          <Typography sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>
            No background tasks.
          </Typography>
        ) : (
          ordered.map((process) => (
            <Box
              key={process.id}
              sx={{
                px: 1.5,
                py: 1,
                borderBottom: '1px solid rgba(27,27,27,0.6)',
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', color: 'text.secondary' }}>{KIND_ICON[process.kind]}</Box>
                <Typography noWrap title={process.name} sx={{ flex: 1, fontSize: 12 }}>
                  {process.name}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: STATUS_COLOR[process.status] }}>
                  {process.status === 'running'
                    ? elapsed(process.startedAt, now)
                    : process.status}
                </Typography>
                {process.status === 'running' ? (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onCancel(process.id)}
                    sx={{ fontSize: 10.5, minWidth: 0, px: 0.75, py: 0 }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <IconButton size="small" onClick={() => onRemove(process.id)} aria-label="Dismiss task">
                    <X size={12} />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress
                  variant={
                    process.kind === 'zip' && process.status === 'running'
                      ? 'indeterminate'
                      : 'determinate'
                  }
                  value={process.progress ?? 0}
                  color={
                    process.status === 'error'
                      ? 'error'
                      : process.status === 'done'
                        ? 'success'
                        : 'primary'
                  }
                  sx={{ flex: 1, height: 3, borderRadius: 2 }}
                />
              </Box>
              {process.detail || process.progress != null ? (
                <Typography sx={{ mt: 0.5, fontSize: 10.5, color: 'text.secondary' }} noWrap>
                  {process.detail ?? ''}
                  {process.progress != null && process.status === 'running' ? ` ${process.progress}%` : ''}
                </Typography>
              ) : null}
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}
