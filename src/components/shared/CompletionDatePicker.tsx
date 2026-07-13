'use client';

interface CompletionDatePickerProps {
  dateStr: string | undefined;
  onChange: (isoDate: string | null) => void;
}

export function CompletionDatePicker({ dateStr, onChange }: CompletionDatePickerProps) {
  const inputValue = dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val ? new Date(val).toISOString() : null);
  };

  return (
    <div className="flex items-center gap-1.5 justify-center">
      <input
        type="date"
        value={inputValue}
        onChange={handleChange}
        className="bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/30 rounded px-1.5 py-0.5 text-xs text-zinc-300 outline-none focus:border-primary/50 transition-colors cursor-pointer scheme-dark"
      />
    </div>
  );
}
