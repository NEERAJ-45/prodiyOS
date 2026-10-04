import { ChevronLeft, Download } from "lucide-react";
import dynamic from "next/dynamic";
import { companyQuestions } from "@/data/company-dsa";
import type { CompanyDsa } from "@/data/company-dsa";
import type { QuestionItem } from "@/components/roadmaps/QuestionsTable";

const QuestionsTable = dynamic(() => import("@/components/roadmaps/QuestionsTable"), { ssr: false });

const companyQuestionItems: QuestionItem[] = companyQuestions.map((q) => ({
  id: q.id,
  title: q.title,
  difficulty: q.platform,
  link: q.link,
}));

interface CompanyViewProps {
  company: CompanyDsa;
  onBack: () => void;
}

export function CompanyView({ company, onBack }: CompanyViewProps) {
  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft size={14} />
          Back to Companies
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{company.name}</h1>
          <a
            href={company.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-border text-blue-400 bg-blue-950/40 hover:bg-blue-950/70 transition-colors"
          >
            DSA Drive <Download size={12} />
          </a>
        </div>
        {company.tricks && (
          <p className="mt-1 text-sm text-muted-foreground">{company.tricks}</p>
        )}
      </div>
      <QuestionsTable
        questions={companyQuestionItems}
        storagePrefix={`company-${company.slug}`}
        searchPlaceholder="Search questions..."
      />
    </div>
  );
}
