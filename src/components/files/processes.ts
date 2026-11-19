'use client';

import { useCallback, useReducer } from 'react';

export type ProcessKind = 'upload' | 'zip' | 'pdf';
export type ProcessStatus = 'running' | 'done' | 'error' | 'canceled';

export interface AppProcess {
  id: string;
  kind: ProcessKind;
  name: string;
  status: ProcessStatus;
  progress?: number | null;
  detail?: string;
  startedAt: number;
  targetId?: string;
  abort?: () => void;
}

export type ProcessAction =
  | {
      type: 'start';
      process: Omit<AppProcess, 'startedAt' | 'status'> & { status?: ProcessStatus };
    }
  | { type: 'patch'; id: string; patch: Partial<AppProcess> }
  | { type: 'finish'; id: string; status: ProcessStatus; detail?: string }
  | { type: 'remove'; id: string }
  | { type: 'clearFinished' };

const MAX_PROCESSES = 50;

export function processReducer(state: AppProcess[], action: ProcessAction): AppProcess[] {
  switch (action.type) {
    case 'start': {
      const next: AppProcess = {
        ...action.process,
        status: action.process.status ?? 'running',
        startedAt: Date.now(),
      };
      return [next, ...state.filter((p) => p.id !== next.id)].slice(0, MAX_PROCESSES);
    }
    case 'patch':
      return state.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p));
    case 'finish':
      return state.map((p) =>
        p.id === action.id
          ? { ...p, status: action.status, detail: action.detail ?? p.detail, abort: undefined }
          : p
      );
    case 'remove':
      return state.filter((p) => p.id !== action.id);
    case 'clearFinished':
      return state.filter((p) => p.status === 'running');
    default:
      return state;
  }
}

export function useProcesses() {
  const [processes, dispatch] = useReducer(processReducer, []);

  const startProcess = useCallback(
    (process: Omit<AppProcess, 'startedAt' | 'status'>) => dispatch({ type: 'start', process }),
    []
  );
  const patchProcess = useCallback(
    (id: string, patch: Partial<AppProcess>) => dispatch({ type: 'patch', id, patch }),
    []
  );
  const finishProcess = useCallback(
    (id: string, status: ProcessStatus, detail?: string) =>
      dispatch({ type: 'finish', id, status, detail }),
    []
  );
  const cancelProcess = useCallback(
    (id: string) => {
      const process = processes.find((p) => p.id === id);
      process?.abort?.();
      dispatch({ type: 'finish', id, status: 'canceled' });
    },
    [processes]
  );
  const removeProcess = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const clearFinished = useCallback(() => dispatch({ type: 'clearFinished' }), []);

  const runningCount = processes.filter((p) => p.status === 'running').length;

  return {
    processes,
    runningCount,
    startProcess,
    patchProcess,
    finishProcess,
    cancelProcess,
    removeProcess,
    clearFinished,
  };
}
