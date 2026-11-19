'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { STORAGE_KEYS } from '@/lib/storage-keys';

import { BoltLoader } from '@/components/shared/BoltLoader';

const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })));

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
const BOOT_STAGES = [
  'Initializing ProdigyOS',
  'Connecting to Atlas',
  'Loading session',
  'Ready',
];

function BootScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const progress = Math.min(100, Math.round(((step + 1) / BOOT_STAGES.length) * 100));

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, BOOT_STAGES.length - 1));
    }, 420);
    const done = setTimeout(onDone, BOOT_STAGES.length * 420 + 380);
    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[100]"
    >
      <BoltLoader
        label="Launching ProdigyOS"
        stage={BOOT_STAGES[Math.min(step, BOOT_STAGES.length - 1)]}
        progress={progress}
      />
    </motion.div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [booting,    setBooting]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [onboarding, setOnboarding] = useState<'checking' | 'needed' | 'done'>('checking');

  useEffect(() => { setMounted(true); }, []);

  const handleBootDone = () => setBooting(false);

  // Check onboarding status when session is ready
  useEffect(() => {
    if (status !== 'authenticated' || booting) return;

    const checkOnboarding = async () => {
      // Quick local check first
      const local = localStorage.getItem(STORAGE_KEYS.ONBOARDED);
      if (local === 'true') {
        setOnboarding('done');
        return;
      }

      try {
        const email = session?.user?.email;
        if (!email) { setOnboarding('done'); return; }

        const res = await fetch(`/api/db/onboarding?email=${encodeURIComponent(email)}`);
        if (!res.ok) { setOnboarding('done'); return; }

        const data = await res.json();
        if (data.onboarded) {
          localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
          setOnboarding('done');
        } else {
          setOnboarding('needed');
        }
      } catch {
        setOnboarding('done');
      }
    };

    checkOnboarding();
  }, [status, session, booting]);

  const handleOnboardingComplete = () => {
    setOnboarding('done');
  };

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
  const userRole  = (session?.user as { role?: string } | undefined)?.role ?? 'User';

  if (!mounted) return <div className="min-h-screen bg-zinc-950" />;

  return (
    <ProfileContext.Provider value={{ userEmail, userName, userRole, customDbUrl: '', dbConnected: false, logout, updateEmail }}>
      <AnimatePresence>
        {booting && <BootScreen onDone={handleBootDone} />}
      </AnimatePresence>

      {/* Show children only after boot + session loaded */}
      {!booting && status !== 'loading' && children}

      {/* Onboarding wizard for first-time users (lazy loaded) */}
      {!booting && status === 'authenticated' && onboarding === 'needed' && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        }>
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        </Suspense>
      )}
    </ProfileContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
