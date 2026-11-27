"use client";

import React, { useState } from 'react';
import { useProfile } from '@/components/providers/ProfileProvider';
import { signOut } from 'next-auth/react';
import { LogOut, User, X, CalendarDays, Flame, Wifi, WifiOff, Pencil, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addMonths, format, getDaysInMonth, isToday, startOfMonth, subMonths } from 'date-fns';
import { useSchedulePlansQuery } from '@/hooks/use-schedule-plans';
import { toast } from '@/components/ui/toast';
import { quotes } from '../../../quotes';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { NotificationsBell } from '@/components/layout/notifications-bell';
import { MusicPlayer } from '@/components/player/MusicPlayer';
import { AgentLauncher } from '@/components/agent/AgentLauncher';
import { useModeStore } from '@/lib/stores/mode-store';

export function Navbar({ global = false }: { global?: boolean }) {
  const { userEmail, userName, userRole, logout, updateEmail } = useProfile();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const router = useRouter();
  const { data: plansData } = useSchedulePlansQuery();
  const planDates = new Set((plansData?.plans ?? []).flatMap((plan) => plan.events.map((event) => event.date)));
  const { mode } = useModeStore();
  const isOffice = mode === 'OFFICE';

  const handleReset = () => {
    localStorage.removeItem(`samundar-command-center-${userEmail}`);
    localStorage.removeItem('samundar-command-center');
    setResetDialogOpen(false);
  };

  if (!global) return null;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full justify-center border-b border-border bg-background shrink-0">
        <div className="flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Current page label */}
          <div className="flex items-center text-xs font-medium text-zinc-400 min-w-0">
            <span className="truncate text-zinc-200 font-semibold">
          
            </span>
          </div>

          {/* Centered Search */}
          <div className="flex flex-1 max-w-xs mx-4 justify-center">
            <GlobalSearch />
          </div>

          {/* Database Status & User Badge */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Date Display + mini calendar */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setCalOpen((open) => !open)}
                aria-expanded={calOpen}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="font-medium text-zinc-300">{dateStr}</span>
              </button>
              {calOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCalOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-card p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <button onClick={() => setCalMonth((m) => subMonths(m, 1))} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Previous month">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-medium">{format(calMonth, 'MMMM yyyy')}</span>
                      <button onClick={() => setCalMonth((m) => addMonths(m, 1))} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Next month">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => <span key={i}>{label}</span>)}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {Array.from({ length: (startOfMonth(calMonth).getDay() + 6) % 7 }).map((_, i) => <span key={`blank-${i}`} />)}
                      {Array.from({ length: getDaysInMonth(calMonth) }, (_, i) => {
                        const day = new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1);
                        const key = format(day, 'yyyy-MM-dd');
                        return (
                          <button
                            key={key}
                            onClick={() => { setCalOpen(false); router.push(`/plan/calendar?date=${key}`); }}
                            className={`relative flex h-7 items-center justify-center rounded-md text-xs tabular-nums transition-colors hover:bg-accent ${isToday(day) ? 'bg-primary text-primary-foreground hover:bg-primary' : 'text-foreground/80'}`}
                          >
                            {i + 1}
                            {planDates.has(key) && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-current opacity-60" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">Dot marks days with planned events.</p>
                  </div>
                </>
              )}
            </div>

            {/* Mode Toggle */}
            <div className="hidden sm:flex items-center border-r border-border pr-3 mr-1">
              <ModeToggle />
            </div>

            {/* DB Status Badge - hidden on small mobile */}
            <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                isOffice
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
              title={isOffice ? "Office mode — local MongoDB" : "Home mode — Atlas cluster"}
            >
              {isOffice ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              <span>{isOffice ? "Office" : "Home"}</span>
            </div>

            {/* Agent */}
            <AgentLauncher />

            {/* Notifications */}
            <NotificationsBell />

            {/* Music */}
            <MusicPlayer />

            {/* Quote Button */}
            <button
              onClick={() => {
                const q = quotes[Math.floor(Math.random() * quotes.length)];
                toast({ title: q.text, description: `— ${q.author}` });
              }}
              className="flex items-center justify-center rounded-lg border border-border hover:border-amber-500/30 hover:bg-amber-500/5 p-1.5 text-muted-foreground hover:text-amber-400 transition-colors cursor-pointer"
              title="Inspire me"
            >
              <Flame className="h-3.5 w-3.5" />
            </button>

            {/* User Badge */}
            <button 
              onClick={() => setProfileOpen(true)}
              className="flex items-center justify-center rounded-lg bg-accent border border-border hover:bg-accent/80 p-1.5 transition-colors cursor-pointer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-600 text-zinc-300">
                <User className="h-3 w-3" />
              </div>
            </button>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="flex items-center justify-center rounded-lg border border-border hover:border-red-500/30 hover:bg-red-500/5 p-1.5 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Details Dialog */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 select-none"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              {/* Close Button */}
              <button 
          onClick={() => { setProfileOpen(false); setEditingEmail(false); }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-900 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-zinc-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-lg font-bold text-blue-400 border border-blue-500/20 uppercase">
                  {userName.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-200">{userName}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{userRole}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Email Scope</span>
                  {editingEmail ? (
                    <div className="space-y-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="New email"
                        className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 font-mono text-xs outline-none focus:border-zinc-500 transition-colors"
                      />
                      <input
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 font-mono text-xs outline-none focus:border-zinc-500 transition-colors"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={emailLoading}
                          onClick={async () => {
                            if (!newEmail || !emailPassword) return;
                            setEmailLoading(true);
                            const result = await updateEmail(userEmail, newEmail, emailPassword);
                            setEmailLoading(false);
                            if (result.success) {
                              toast({ title: 'Email updated — signing out' });
                              setProfileOpen(false);
                              setEditingEmail(false);
                              setTimeout(() => signOut({ callbackUrl: '/login' }), 1500);
                            } else {
                              toast({ variant: 'destructive', title: result.error || 'Failed to update email' });
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {emailLoading ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingEmail(false); setNewEmail(''); setEmailPassword(''); }}
                          className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-center justify-between bg-zinc-900 px-3 py-2.5 rounded-lg border border-zinc-800 text-zinc-300 font-mono select-text">
                      <span className="truncate">{userEmail}</span>
                      <button
                        onClick={() => { setEditingEmail(true); setNewEmail(userEmail); setEmailPassword(''); }}
                        className="ml-2 shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Change email"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Database Connection</span>
                  <div className={`flex items-center justify-between bg-zinc-900 px-3 py-2.5 rounded-lg border border-zinc-800 ${isOffice ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <div className="flex items-center gap-2">
                       {isOffice ? <WifiOff size={14} /> : <Wifi size={14} />}
                       <span>{isOffice ? "Office — Local MongoDB" : "Home — Atlas Cluster"}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold">
                      {isOffice ? "Local" : "Cloud"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-900 flex justify-between gap-2.5">
                <button
                  onClick={() => {
                    setResetDialogOpen(true);
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 hover:border-amber-500/30 hover:bg-amber-500/5 text-zinc-400 hover:text-amber-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Reset Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  <LogOut size={13} />
                  Reset Profile / Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Dashboard Dialog */}
      {resetDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm select-none"
          onClick={() => setResetDialogOpen(false)}
        >
          <div
            className="w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-zinc-100">Reset Dashboard</h3>
              <p className="text-sm text-zinc-400 py-2 mt-1">
                Clears cached dashboard data and reloads fresh stats.
              </p>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setResetDialogOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
