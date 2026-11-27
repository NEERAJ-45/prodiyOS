'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage, metaApi } from './client';
import type { Instance, Meta, Runtime, Task, TaskDetail, Workspace } from './types';

const POLL_MS = 2500;

export function useProdigy() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [offline, setOffline] = useState(false);
  const [offlineError, setOfflineError] = useState('');
  const [error, setError] = useState('');

  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const loadMeta = useCallback(async () => {
    try {
      setMeta(await metaApi.get());
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [nextRuntime, nextWorkspaces, nextInstances, nextTasks] = await Promise.all([
        api.runtime(),
        api.workspaces(),
        api.instances(),
        api.tasks(),
      ]);
      setRuntime(nextRuntime);
      setWorkspaces(nextWorkspaces);
      setInstances(nextInstances);
      setTasks(nextTasks);
      setOffline(false);
      setOfflineError('');
      if (activeRef.current) {
        api.task(activeRef.current).then(setDetail).catch(() => {});
      }
    } catch (caught) {
      setOffline(true);
      setOfflineError(errorMessage(caught));
    }
  }, []);

  const retry = useCallback(async () => {
    setError('');
    await Promise.allSettled([loadMeta(), refresh()]);
  }, [loadMeta, refresh]);

  useEffect(() => {
    void loadMeta();
    void refresh();
  }, [loadMeta, refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => void (offline ? retry() : refresh()), offline ? 5000 : POLL_MS);
    return () => window.clearInterval(timer);
  }, [offline, refresh, retry]);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    void api.task(activeId).then(setDetail).catch(() => {});
  }, [activeId]);

  return {
    meta,
    runtime,
    workspaces,
    instances,
    tasks,
    detail,
    activeId,
    setActiveId,
    offline,
    offlineError,
    error,
    setError,
    refresh,
    retry,
  };
}
