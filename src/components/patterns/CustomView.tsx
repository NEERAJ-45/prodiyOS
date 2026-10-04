import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Layers, Loader2, Trash2 } from "lucide-react";
import { AddRoadmapDialog } from "@/components/shared/AddRoadmapDialog";
import { ImportDialog } from "@/components/patterns/ImportDialog";
import type { CustomRoadmapRecord } from "@/lib/services/custom-roadmaps";

interface CustomViewProps {
  roadmaps: CustomRoadmapRecord[];
  loading: boolean;
  search: string;
  onSelect: (slug: string) => void;
  onDelete: (slug: string) => void;
}

export function CustomView({ roadmaps, loading, search, onSelect, onDelete }: CustomViewProps) {
  const filtered = roadmaps.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-foreground" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Custom Roadmaps
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {roadmaps.length} custom roadmap{roadmaps.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportDialog />
            <AddRoadmapDialog />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Layers className="h-8 w-8" />
          <p className="text-sm">No custom roadmaps yet. Click &quot;Add Roadmap&quot; to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border relative">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center" style={{ width: 44 }}>#</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left">Title</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left">Description</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Questions</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Difficulty</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Hours</th>
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center" style={{ width: 72 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((roadmap, i) => (
                  <motion.tr
                    key={roadmap.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
                    className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer last:border-0"
                    onClick={() => onSelect(roadmap.slug)}
                  >
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 text-left">
                      <span className="font-medium text-foreground text-sm">{roadmap.title}</span>
                    </td>
                    <td className="px-4 py-2.5 text-left text-xs text-muted-foreground max-w-[220px] truncate">
                      {roadmap.description || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">{roadmap.questions.length}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-xs font-medium text-zinc-300">{roadmap.difficulty}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">{roadmap.hours || "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelect(roadmap.slug); }}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          title="Open"
                        >
                          <BookOpen size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this custom roadmap?")) onDelete(roadmap.slug);
                          }}
                          className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
