import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import type { QuestionItem } from "@/components/roadmaps/QuestionsTable";
import type { CustomRoadmapRecord } from "@/lib/services/custom-roadmaps";

const QuestionsTable = dynamic(() => import("@/components/roadmaps/QuestionsTable"), { ssr: false });

interface CustomRoadmapViewProps {
  roadmap: CustomRoadmapRecord;
  onBack: () => void;
}

export function CustomRoadmapView({ roadmap, onBack }: CustomRoadmapViewProps) {
  const questions: QuestionItem[] = roadmap.questions.map((q) => ({
    id: q.id,
    title: q.title,
    difficulty: q.difficulty,
    link: q.link,
  }));

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft size={14} />
          Back to Custom
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{roadmap.title}</h1>
        {roadmap.description && (
          <p className="mt-1 text-sm text-muted-foreground">{roadmap.description}</p>
        )}
      </div>
      <QuestionsTable
        questions={questions}
        storagePrefix={roadmap.storageKey}
        searchPlaceholder="Search questions..."
      />
    </div>
  );
}
