'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, Check, ChevronRight, ChevronLeft, Brain, Server, Code2, Container, Layers,
  Cpu, GitBranch, Database, Calculator, Clock, BarChart3, Loader2,
  Pencil, CheckCircle2, RotateCcw,
} from 'lucide-react';
import { useProfile } from '@/components/providers/ProfileProvider';
import { useSaveOnboarding } from '@/hooks/use-onboarding';
import {
  ROLE_OPTIONS, HOURS_OPTIONS, EXPERIENCE_OPTIONS, INTEREST_CATEGORIES,
  generateScheduleDays, type RoleOption, type HoursOption, type ExperienceOption,
} from '@/data/onboarding';
import { cn } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/storage-keys';

const TOTAL_STEPS = 5;

const ICON_MAP: Record<string, React.ElementType> = {
  Code2, Server, Layers, Container, Brain,
  Cpu, GitBranch, Database, Calculator, Clock, BarChart3,
};

type OnboardingData = {
  role: RoleOption;
  hours: HoursOption;
  experience: ExperienceOption;
  interests: string[];
};

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { userEmail } = useProfile();
  const saveOnboarding = useSaveOnboarding();

  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState<OnboardingData>({
    role: 'fullstack',
    hours: '2-4',
    experience: 'intermediate',
    interests: [],
  });
  const [schedule, setSchedule] = React.useState<ReturnType<typeof generateScheduleDays>>([]);
  const [editingDay, setEditingDay] = React.useState<string | null>(null);
  const [editSlot, setEditSlot] = React.useState<{ day: string; slotIndex: number; topic: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const regenerateSchedule = React.useCallback(() => {
    setSchedule(generateScheduleDays(data.role, data.experience, data.hours, data.interests));
  }, [data]);

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      if (step + 1 === 5) {
        setSchedule(generateScheduleDays(data.role, data.experience, data.hours, data.interests));
      }
      setStep((s) => s + 1);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.role;
      case 2: return !!data.hours;
      case 3: return !!data.experience;
      case 4: return data.interests.length > 0;
      case 5: return schedule.length > 0;
      default: return false;
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!userEmail) return;
    setSaving(true);
    try {
      await saveOnboarding.mutateAsync({
        email: userEmail,
        onboardingData: {
          ...data,
          scheduleDays: schedule,
        },
      });
      localStorage.setItem(STORAGE_KEYS.DAILY_SCHEDULE_MODE, data.role === 'frontend' ? 'react' : data.role === 'backend' ? 'java' : data.role === 'devops' ? 'devops' : 'steady');
      onComplete();
    } catch {
      // error handled by react query
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (catId: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(catId)
        ? prev.interests.filter((i) => i !== catId)
        : [...prev.interests, catId],
    }));
  };

  const updateSlotTopic = (day: string, slotIndex: number, topic: string) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? { ...d, slots: d.slots.map((s, i) => (i === slotIndex ? { ...s, topic } : s)) }
          : d,
      ),
    );
    setEditSlot(null);
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800 bg-zinc-950 rounded-2xl shadow-2xl"
      >
        {/* Progress bar */}
        <div className="h-1 bg-zinc-900 rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Monitor className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Set Up Your Learning Plan</h2>
              <p className="text-[11px] text-zinc-500">Step {step} of {TOTAL_STEPS}</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <RoleStep data={data} setData={setData} />}
              {step === 2 && <HoursStep data={data} setData={setData} />}
              {step === 3 && <ExperienceStep data={data} setData={setData} />}
              {step === 4 && <InterestsStep data={data} toggleInterest={toggleInterest} />}
              {step === 5 && (
                <SchedulePreviewStep
                  schedule={schedule}
                  editingDay={editingDay}
                  setEditingDay={setEditingDay}
                  editSlot={editSlot}
                  setEditSlot={setEditSlot}
                  updateSlotTopic={updateSlotTopic}
                  regenerateSchedule={regenerateSchedule}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className={cn('flex items-center gap-3 mt-8', step === 1 ? 'justify-end' : 'justify-between')}>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-900"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl transition-all disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl transition-all disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                {saving ? 'Saving…' : 'Start Learning'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Step 1: Role ─────────────────────────────────────────────────────────────
function RoleStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">What&apos;s Your Focus?</h3>
        <p className="text-xs text-zinc-400 mt-1">Choose the area you want to prioritise in your preparation.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_OPTIONS.map((role) => {
          const Icon = ICON_MAP[role.icon] || Monitor;
          const selected = data.role === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setData({ ...data, role: role.id as RoleOption })}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                selected
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border',
                selected ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200">{role.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{role.description}</p>
              </div>
              {selected && (
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Hours ────────────────────────────────────────────────────────────
function HoursStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Study Time</h3>
        <p className="text-xs text-zinc-400 mt-1">How much time can you dedicate daily? This helps us pace your schedule.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOURS_OPTIONS.map((opt) => {
          const selected = data.hours === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setData({ ...data, hours: opt.id as HoursOption })}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                selected
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border',
                selected ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
              )}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-200">{opt.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {opt.slots === 1 ? '1 focus block per day' : `${opt.slots} study blocks per day`}
                </p>
              </div>
              {selected && <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Experience ───────────────────────────────────────────────────────
function ExperienceStep({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Experience Level</h3>
        <p className="text-xs text-zinc-400 mt-1">Where do you stand? We&apos;ll tailor the difficulty to match.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPERIENCE_OPTIONS.map((opt) => {
          const selected = data.experience === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setData({ ...data, experience: opt.id as ExperienceOption })}
              className={cn(
                'flex flex-col items-center text-center gap-2 p-5 rounded-xl border transition-all',
                selected
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center border',
                selected ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
              )}>
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{opt.label}</p>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{opt.description}</p>
              </div>
              {selected && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Interests ────────────────────────────────────────────────────────
function InterestsStep({ data, toggleInterest }: { data: OnboardingData; toggleInterest: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Pick Your Interests</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Select topics you want to focus on. We&apos;ll pre-fill your schedule with important ones.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEREST_CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Monitor;
          const selected = data.interests.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggleInterest(cat.id)}
              className={cn(
                'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all',
                selected
                  ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900',
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border',
                selected ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200">{cat.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{cat.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {cat.topics.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className={cn(
                'h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                selected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600',
              )}>
                {selected && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
      {data.interests.length === 0 && (
        <p className="text-xs text-amber-400/70 text-center">Select at least one category to continue</p>
      )}
    </div>
  );
}

// ─── Step 5: Schedule Preview ─────────────────────────────────────────────────
function SchedulePreviewStep({
  schedule, editingDay, setEditingDay, editSlot, setEditSlot, updateSlotTopic, regenerateSchedule,
}: {
  schedule: ReturnType<typeof generateScheduleDays>;
  editingDay: string | null;
  setEditingDay: (d: string | null) => void;
  editSlot: { day: string; slotIndex: number; topic: string } | null;
  setEditSlot: (s: typeof editSlot) => void;
  updateSlotTopic: (day: string, slotIndex: number, topic: string) => void;
  regenerateSchedule: () => void;
}) {
  const [customTopic, setCustomTopic] = React.useState('');

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Your Personalised Schedule</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Here&apos;s your weekly plan. Click any topic to customise it, or leave it as-is.
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {schedule.map((day) => (
          <div key={day.day} className="border border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setEditingDay(editingDay === day.day ? null : day.day)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 transition-colors"
            >
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{day.day}</span>
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-zinc-500 transition-transform',
                  editingDay === day.day && 'rotate-90',
                )}
              />
            </button>
            {editingDay === day.day && (
              <div className="px-4 py-3 space-y-2 border-t border-zinc-800">
                {day.slots.map((slot, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-28 shrink-0">{slot.period}</span>
                    {editSlot?.day === day.day && editSlot?.slotIndex === si ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customTopic.trim()) {
                              updateSlotTopic(day.day, si, customTopic.trim());
                              setCustomTopic('');
                            }
                            if (e.key === 'Escape') {
                              setEditSlot(null);
                              setCustomTopic('');
                            }
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/50"
                          autoFocus
                          placeholder="Type topic and press Enter"
                        />
                        <button
                          onClick={() => { setEditSlot(null); setCustomTopic(''); }}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditSlot({ day: day.day, slotIndex: si, topic: slot.topic }); setCustomTopic(slot.topic); }}
                        className="flex-1 flex items-center gap-1.5 group"
                      >
                        <span className="text-xs text-zinc-300 group-hover:text-indigo-400 transition-colors">{slot.topic}</span>
                        <Pencil className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <button
          onClick={regenerateSchedule}
          className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Schedule
        </button>
        <p className="text-[10px] text-zinc-600">
          Click any topic to edit
        </p>
      </div>
    </div>
  );
}
