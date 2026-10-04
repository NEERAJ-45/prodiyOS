import { Loader2, Search, GitBranch, BookOpen, Code2, ListChecks, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PatternsView = "patterns" | "striver" | "custom" | "companies" | "neetcode";

const TABS: { view: PatternsView; label: string; icon: typeof GitBranch; clearsSearch: boolean }[] = [
  { view: "patterns", label: "Patterns", icon: GitBranch, clearsSearch: false },
  { view: "striver", label: "Striver Sheet", icon: BookOpen, clearsSearch: true },
  { view: "neetcode", label: "NeetCode 150", icon: Code2, clearsSearch: true },
  { view: "custom", label: "Custom", icon: ListChecks, clearsSearch: true },
  { view: "companies", label: "Companies", icon: Building2, clearsSearch: true },
];

const PLACEHOLDERS: Record<PatternsView, string> = {
  patterns: "Search patterns...",
  striver: "Search topics...",
  neetcode: "",
  custom: "Search roadmaps...",
  companies: "Search companies...",
};

interface PatternsTabsProps {
  view: PatternsView;
  onSelect: (view: PatternsView) => void;
  search: string;
  onSearch: (value: string) => void;
  isFetching?: boolean;
}

export function PatternsTabs({ view, onSelect, search, onSearch, isFetching }: PatternsTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex max-w-full overflow-x-auto rounded-lg border border-border bg-muted/40 p-0.5">
        {TABS.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
              view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {view !== "neetcode" && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 transition-all duration-200 focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 flex-1 max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={PLACEHOLDERS[view]}
            className="w-full bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {isFetching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
