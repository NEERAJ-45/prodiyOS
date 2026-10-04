import { Code2, ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { neetCode150, neetCodeCategories } from "@/data/neetcode-150";
import type { QuestionItem } from "@/components/roadmaps/QuestionsTable";

const QuestionsTable = dynamic(() => import("@/components/roadmaps/QuestionsTable"), { ssr: false });

const neetCodeItems: QuestionItem[] = neetCode150.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  difficulty: p.difficulty,
  link: p.link,
}));

interface NeetCodeViewProps {
  onBack: () => void;
}

export function NeetCodeView({ onBack }: NeetCodeViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            NeetCode 150
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {neetCode150.length} problems &middot; {neetCodeCategories.length} categories
        </p>
      </div>

      <QuestionsTable
        questions={neetCodeItems}
        storagePrefix="neetcode-150"
        searchPlaceholder="Search problems..."
      />
    </div>
  );
}
