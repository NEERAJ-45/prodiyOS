'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, ChevronRight, Cpu, ShieldAlert, Lock, ArrowLeft, Eye, EyeOff,
} from 'lucide-react';

// ─── Decrypted text effect ────────────────────────────────────────────────────
function DecryptedText({ text, delay = 100 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$&*';

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      let iterations = 0;
      const interval = setInterval(() => {
        if (!active) return;
        setDisplayText(
          text.split('').map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        if (iterations >= text.length) clearInterval(interval);
        iterations += 0.5;
      }, 25);
    }, delay);
    return () => { active = false; clearTimeout(timeout); };
  }, [text, delay]);

  return <span>{displayText || text}</span>;
}

type Stage = 'email' | 'login' | 'reset-request' | 'reset-pin';

export default function LoginPage() {
  const router     = useRouter();
  const params     = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const [stage,           setStage]         = useState<Stage>('email');
  const [emailInput,      setEmailInput]     = useState('');
  const [passwordInput,   setPasswordInput]  = useState('');
  const [showPassword,    setShowPassword]   = useState(false);
  const [pinInput,        setPinInput]       = useState('');
  const [newPassword,     setNewPassword]    = useState('');
  const [showNewPassword, setShowNewPassword]= useState(false);
  const [isLoading,       setIsLoading]      = useState(false);
  const [error,           setError]          = useState('');
  const [success,         setSuccess]        = useState('');
  const [attemptsLeft,    setAttemptsLeft]   = useState<number | null>(null);
  const [isCheckingEmail, setIsCheckingEmail]= useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) { setError('Email is required.'); return; }
    setIsCheckingEmail(true); setError('');
    try {
      const res  = await fetch(`/api/db/profile?email=${encodeURIComponent(emailInput.trim())}&check=true`);
      const data = await res.json();
      if (data.exists) {
        setStage('login');
      } else {
        // Not registered — redirect to register
        router.push(`/register?email=${encodeURIComponent(emailInput.trim())}`);
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) { setError('Password is required.'); return; }
    setIsLoading(true); setError('');
    const result = await signIn('credentials', {
      email: emailInput.trim(),
      password: passwordInput,
      redirect: false,
    });
    setIsLoading(false);

    if (result?.error === 'LOCKED') {
      setError('Account locked — too many failed attempts. Wait 15 minutes and try again.');
      setAttemptsLeft(0);
    } else if (result?.error) {
      setError('Incorrect password. Please try again.');
      setAttemptsLeft((p) => (p !== null ? Math.max(0, p - 1) : 4));
    } else {
      router.push(callbackUrl);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput || !newPassword) { setError('All fields are required.'); return; }
    setIsLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), pin: pinInput, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); }
      else {
        setSuccess('Password updated! Signing you in…');
        await signIn('credentials', { email: emailInput.trim(), password: newPassword, redirect: false });
        router.push(callbackUrl);
      }
    } catch {
      setError('Server error. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = stage === 'login'         ? 'SIGN IN'
               : stage === 'reset-request' ? 'RESET PASSWORD'
               : stage === 'reset-pin'     ? 'ENTER NEW PASSWORD'
               : 'GET STARTED';

  const subtitle = stage === 'login'         ? 'Enter your password to access your workspace.'
                 : stage === 'reset-request' ? 'Enter your reset PIN and new password.'
                 : 'Enter your email to continue.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="w-full max-w-lg my-8"
    >
      <div className="relative border border-zinc-800 bg-zinc-950 p-8 md:p-10 rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mx-auto h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4"
          >
            <Monitor className="h-5 w-5 text-indigo-400" />
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
            <DecryptedText text={title} delay={50} />
          </h1>
          <p className="text-xs text-zinc-400 mt-2.5 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
        </div>

        {/* Error / Success */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-xs text-red-400 flex items-center gap-2"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
              {attemptsLeft !== null && attemptsLeft > 0 && (
                <span className="ml-auto font-bold text-red-300">{attemptsLeft} left</span>
              )}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-5 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-400"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Email Stage ───────────────────────────────────────────── */}
        {stage === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 text-sm font-semibold">@</span>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setError(''); }}
                  placeholder="user@domain.com"
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500/60 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <button
              id="email-continue-btn"
              type="submit"
              disabled={isCheckingEmail}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCheckingEmail ? <Cpu className="h-4 w-4 animate-spin" /> : null}
              {isCheckingEmail ? 'Checking…' : 'Continue'}
              {!isCheckingEmail && <ChevronRight className="h-4 w-4" />}
            </button>
            <p className="text-center text-xs text-zinc-500 mt-4">
              Don&apos;t have an account?{' '}
              <a href="/register" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">Register here</a>
            </p>
          </form>
        )}

        {/* ── Login Stage ───────────────────────────────────────────── */}
        {stage === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500/60 rounded-xl pl-10 pr-10 py-3 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setStage('email'); setPasswordInput(''); setError(''); }}
                className="flex-1 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                id="login-btn"
                type="submit"
                disabled={isLoading}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {isLoading ? <Cpu className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {isLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setStage('reset-request'); setError(''); }}
              className="w-full text-xs text-zinc-500 hover:text-indigo-400 mt-1 transition-colors"
            >
              Forgot password? Reset with your PIN →
            </button>
          </form>
        )}

        {/* ── Reset Stage ───────────────────────────────────────────── */}
        {(stage === 'reset-request') && (
          <form onSubmit={handleResetRequest} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Reset PIN <span className="text-red-500">*</span></label>
              <input
                id="pin-input"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setError(''); }}
                placeholder="4-6 digit PIN"
                className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500/20 tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">New Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-zinc-900/40 border border-zinc-800 focus:border-indigo-500/60 rounded-xl px-4 pr-10 py-3 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500/20"
                />
                <button type="button" onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setStage('login'); setError(''); }}
                className="flex-1 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-300 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button id="reset-btn" type="submit" disabled={isLoading}
                className="flex-[2] bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all">
                {isLoading ? <Cpu className="h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}
