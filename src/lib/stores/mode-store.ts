import { create } from 'zustand';

export type Mode = 'HOME' | 'OFFICE';

interface ModeState {
  mode: Mode;
  sidebarCollapsed: boolean;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  hydrated: boolean;
}

function getInitialMode(): Mode {
  if (typeof window === 'undefined') return 'HOME';
  try {
    const stored = localStorage.getItem('app-mode');
    if (stored === 'HOME' || stored === 'OFFICE') return stored;
  } catch {}
  return 'HOME';
}

function persistMode(mode: Mode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('app-mode', mode);
    document.cookie = `mode=${mode};path=/;max-age=86400;SameSite=Lax`;
  } catch {}
}

export const useModeStore = create<ModeState>((set) => {
  const initial = getInitialMode();
  if (typeof document !== 'undefined') {
    document.cookie = `mode=${initial};path=/;max-age=86400;SameSite=Lax`;
  }
  return {
    mode: initial,
    sidebarCollapsed: false,
    hydrated: true,
    setMode: (mode) => {
      persistMode(mode);
      set({ mode });
    },
    toggleMode: () =>
      set((state) => {
        const next = state.mode === 'HOME' ? 'OFFICE' : 'HOME';
        persistMode(next);
        return { mode: next };
      }),
    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  };
});
