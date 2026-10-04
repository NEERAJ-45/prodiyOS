import { motion, AnimatePresence } from "framer-motion";
import { Building2, ListOrdered } from "lucide-react";
import { companies, companyQuestions } from "@/data/company-dsa";

interface CompaniesViewProps {
  search: string;
  onSelect: (slug: string) => void;
}

export function CompaniesView({ search, onSelect }: CompaniesViewProps) {
  const filtered = companies.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.tricks.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Company-wise DSA
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {companies.length} companies &middot; {companyQuestions.length} questions each
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border relative">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center" style={{ width: 44 }}>#</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left">Company</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left">Focus Areas</th>
              <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-center">Questions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={4} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ListOrdered className="h-8 w-8" />
                      <p className="text-sm">No companies match your search</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                filtered.map((company, i) => (
                  <motion.tr
                    key={company.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03, ease: "easeOut" }}
                    className="border-b border-border transition-colors hover:bg-muted/30 cursor-pointer last:border-0"
                    onClick={() => onSelect(company.slug)}
                  >
                    <td className="px-4 py-2.5 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2.5 text-left">
                      <span className="font-medium text-foreground text-sm">{company.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-left text-xs text-muted-foreground max-w-[420px] truncate">
                      {company.tricks}
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs font-semibold text-foreground">{companyQuestions.length}</td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
