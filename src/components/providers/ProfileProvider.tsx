'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu } from 'lucide-react';

// ─── Context ──────────────────────────────────────────────────────────────────
interface ProfileContextType {
  userEmail:    string;
  userName:     string;
  userRole:     string;
  customDbUrl:  string;   // always '' — shared Atlas connection used for all users
  dbConnected:  boolean;  // kept for backwards compat
  logout:       () => void;
  updateEmail:  (currentEmail: string, newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// ─── Boot Animation ───────────────────────────────────────────────────────────
const BOOT_LOGS = [
  'Initializing ProdigyOS v1.0.0…',
  'Core framework verified. (Next.js 16.2.9 & React 19.2.4)',
  'Establishing MongoDB Atlas connection…',
  'Loading session credentials…',
  'System startup complete.',
];

function BootScreen({ onDone }: { onDone: () => void }) {
  const [logs,     setLogs]     = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [line,     setLine]     = useState(0);

  useEffect(() => {
    if (line < BOOT_LOGS.length) {
      const t = setTimeout(() => {
        setLogs((p) => [...p, BOOT_LOGS[line]]);
        setProgress(((line + 1) / BOOT_LOGS.length) * 100);
        setLine((l) => l + 1);
      }, 420);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [line, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050507] p-6 select-none"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center space-y-6"
      >
        {/* Animated ring */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-indigo-500/20 border-b-indigo-500/10 border-l-indigo-500/40"
          />
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30"
          >
            <Cpu className="h-4 w-4 text-indigo-400" />
          </motion.div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-200">LAUNCHING PRODIGYOS</h3>
          <p className="text-[10px] tracking-widest text-indigo-400 font-bold uppercase">
            System Initializing • {Math.round(progress)}%
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] w-48 bg-zinc-900 overflow-hidden rounded-full relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Log lines */}
        <div className="w-64 space-y-1">
          {logs.map((log, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] text-zinc-500 font-mono"
            >
              <span className="text-indigo-500/70">›</span> {log}
            </motion.p>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [booting,  setBooting]  = useState(true);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleBootDone = () => setBooting(false);

  const logout = () => signOut({ callbackUrl: '/login' });

  const updateEmail = useCallback(async (currentEmail: string, newEmail: string, password: string) => {
    try {
      const res = await fetch('/api/profile/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEmail, newEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const userEmail = session?.user?.email ?? '';
  const userName  = session?.user?.name  ?? '';
  const userRole  = (session?.user as any)?.role ?? 'User';

  if (!mounted) return <div className="min-h-screen bg-zinc-950" />;

  return (
    <ProfileContext.Provider value={{ userEmail, userName, userRole, customDbUrl: '', dbConnected: false, logout, updateEmail }}>
      <AnimatePresence>
        {booting && <BootScreen onDone={handleBootDone} />}
      </AnimatePresence>

      {/* Show children only after boot + session loaded */}
      {!booting && status !== 'loading' && children}
    </ProfileContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
