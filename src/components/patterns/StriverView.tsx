import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ListOrdered } from "lucide-react";
import { striverSheet, striverTotalProblems } from "@/data/striver-sheet";

function countSolved(): number {
  if (typeof window === "undefined") return 0;
  let solved = 0;
  for (const day of striverSheet) {
    try {
      const raw = localStorage.getItem(`completed-striver-${day.key}`);
      if (raw) solved += Object.keys(JSON.parse(raw) as Record<string, string>).length;
    } catch {}
  }
  return solved;
}

interface StriverViewProps {
  search: string;
  onSelectDay: (key: string) => void;
}

export function StriverView({ search, onSelectDay }: StriverViewProps) {
  const totalSolved = useMemo(() => countSolved(), []);

  const filteredDays = useMemo(() => {
    if (!search.trim()) return striverSheet;
    const q = search.toLowerCase();
    return striverSheet.filter((d) =>
      d.topic.toLowerCase().includes(q) || `day ${d.day}`.includes(q)
    );
  }, [search]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Striver SDE Sheet
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {striverSheet.length} days &middot; {striverTotalProblems} problems &middot; {totalSolved} solved
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border relative">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center" style={{ width: 44 }}>#</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left">Topic</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Day</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Easy</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Medium</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Hard</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredDays.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={7} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ListOrdered className="h-8 w-8" />
                      <p className="text-sm">No topics match your search</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                filteredDays.map((day, i) => {
                  const easy = day.problems.easy.length;
                  const medium = day.problems.medium.length;
                  const hard = day.problems.hard.length;
                  const total = easy + medium + hard;
                  return (
                    <motion.tr
                      key={day.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
                      className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer last:border-0"
                      onClick={() => onSelectDay(day.key)}
                    >
                      <td className="px-4 py-2.5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5 text-left">
                        <span className="font-medium text-foreground text-sm">{day.topic}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">Day {day.day}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-emerald-400 font-medium">{easy}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-amber-400 font-medium">{medium}</td>
                      <td className="px-4 py-2.5 text-center text-xs text-red-400 font-medium">{hard}</td>
                      <td className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">{total}</td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
