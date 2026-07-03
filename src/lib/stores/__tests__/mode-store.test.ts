import { describe, it, expect, beforeEach } from 'vitest';
import { useModeStore } from '@/lib/stores/mode-store';

describe('mode-store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/');
    });
    useModeStore.setState({ mode: 'HOME' });
  });

  it('defaults to HOME', () => {
    const { mode } = useModeStore.getState();
    expect(mode).toBe('HOME');
  });

  it('toggles to OFFICE', () => {
    useModeStore.getState().toggleMode();
    expect(useModeStore.getState().mode).toBe('OFFICE');
  });

  it('toggles back to HOME', () => {
    useModeStore.getState().toggleMode();
    useModeStore.getState().toggleMode();
    expect(useModeStore.getState().mode).toBe('HOME');
  });

  it('setMode sets the mode', () => {
    useModeStore.getState().setMode('OFFICE');
    expect(useModeStore.getState().mode).toBe('OFFICE');
    useModeStore.getState().setMode('HOME');
    expect(useModeStore.getState().mode).toBe('HOME');
  });

  it('persists to localStorage', () => {
    useModeStore.getState().setMode('OFFICE');
    expect(localStorage.getItem('app-mode')).toBe('OFFICE');
  });

  it('toggleSidebar flips sidebarCollapsed', () => {
    expect(useModeStore.getState().sidebarCollapsed).toBe(false);
    useModeStore.getState().toggleSidebar();
    expect(useModeStore.getState().sidebarCollapsed).toBe(true);
    useModeStore.getState().toggleSidebar();
    expect(useModeStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setSidebarCollapsed sets it explicitly', () => {
    useModeStore.getState().setSidebarCollapsed(true);
    expect(useModeStore.getState().sidebarCollapsed).toBe(true);
  });
});
