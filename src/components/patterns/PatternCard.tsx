"use client";

import { cn } from "@/lib/utils";

interface PatternCardProps {
  name: string;
  total: number;
  selected: boolean;
  onSelect: () => void;
}

export function PatternCard({
  name,
  total,
  selected,
  onSelect,
}: PatternCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-lg border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {total}
        </span>
      </div>
    </button>
  );
}
