"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { ProblemsTable } from "@/components/patterns/ProblemsTable";
import { toast } from "@/components/ui/toast";
import { striverSheet } from "@/data/striver-sheet";
import { companies } from "@/data/company-dsa";
import { useCustomRoadmapsQuery, useDeleteCustomRoadmap } from "@/hooks/use-custom-roadmaps";
import { PatternsTabs, type PatternsView } from "@/components/patterns/PatternsTabs";
import { PatternsTableView, type PaginatedResponse } from "@/components/patterns/PatternsTableView";
import { StriverView } from "@/components/patterns/StriverView";
import { NeetCodeView } from "@/components/patterns/NeetCodeView";
import { CustomView } from "@/components/patterns/CustomView";
import { CompaniesView } from "@/components/patterns/CompaniesView";
import { CustomRoadmapView } from "@/components/patterns/CustomRoadmapView";
import { CompanyView } from "@/components/patterns/CompanyView";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function PatternsContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<PatternsView>("patterns");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCustomSlug, setSelectedCustomSlug] = useState<string | null>(null);
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });

  const { data: customRoadmapsData, isLoading: customLoading } = useCustomRoadmapsQuery();
  const deleteCustomRoadmap = useDeleteCustomRoadmap();

  const customRoadmaps = useMemo(() => customRoadmapsData?.data ?? [], [customRoadmapsData]);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching, error, refetch } = useQuery<PaginatedResponse>({
    queryKey: ["patterns", pagination.pageIndex, pagination.pageSize, debouncedSearch] as const,
    queryFn: async ({ queryKey: [, page, pageSize, search] }) => {
      const params = new URLSearchParams({
        page: String((page as number) + 1),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search as string);
      const res = await fetch(`/api/patterns?${params}`);
      if (!res.ok) throw new Error("Failed to fetch patterns");
      return res.json();
    },
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
    enabled: view === "patterns",
  });

  useEffect(() => {
    if (error) toast({ variant: "destructive", title: "Failed to load patterns" });
  }, [error]);

  const urlPattern = searchParams.get("pattern");
  useEffect(() => {
    if (urlPattern && data && !selectedKey && view === "patterns") {
      const found = data.patterns.find(
        (p) => p.key === urlPattern || p.name.toLowerCase().replace(/\s+/g, "-") === urlPattern
      );
      if (found) setSelectedKey(found.key);
    }
  }, [urlPattern, data, selectedKey, view]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch]);

  const handleTabSelect = (next: PatternsView) => {
    setView(next);
    setSelectedKey(null);
    setSelectedDay(null);
    setSelectedCustomSlug(null);
    setSelectedCompanySlug(null);
    if (next !== "patterns") setSearch("");
  };

  const striverDay = view === "striver" && selectedDay
    ? striverSheet.find((d) => d.key === selectedDay) ?? null
    : null;

  const selectedCustomRoadmap = view === "custom" && selectedCustomSlug
    ? customRoadmaps.find((r) => r.slug === selectedCustomSlug) ?? null
    : null;

  const selectedCompany = view === "companies" && selectedCompanySlug
    ? companies.find((c) => c.slug === selectedCompanySlug) ?? null
    : null;

  if (striverDay) {
    return (
      <div className="flex h-full flex-col p-4 md:p-6">
        <ProblemsTable
          patternName={`striver-${striverDay.key}`}
          easy={striverDay.problems.easy}
          medium={striverDay.problems.medium}
          hard={striverDay.problems.hard}
          onBack={() => setSelectedDay(null)}
          backLabel="Striver Sheet"
        />
      </div>
    );
  }

  if (selectedKey && view === "patterns") {
    return (
      <div className="flex h-full flex-col p-4 md:p-6">
        <ProblemsTable patternKey={selectedKey} onBack={() => setSelectedKey(null)} />
      </div>
    );
  }

  if (selectedCustomRoadmap) {
    return <CustomRoadmapView roadmap={selectedCustomRoadmap} onBack={() => setSelectedCustomSlug(null)} />;
  }

  if (selectedCompany) {
    return <CompanyView company={selectedCompany} onBack={() => setSelectedCompanySlug(null)} />;
  }

  return (
    <div className="flex h-full mt10 flex-col p-4 md:p-6">
      <PatternsTabs
        view={view}
        onSelect={handleTabSelect}
        search={search}
        onSearch={setSearch}
        isFetching={isFetching}
      />

      {view === "patterns" && (
        <PatternsTableView
          data={data}
          isLoading={isLoading}
          hasError={!!error}
          pagination={pagination}
          setPagination={setPagination}
          onRetry={() => refetch()}
          onSelectPattern={setSelectedKey}
        />
      )}
      {view === "striver" && <StriverView search={search} onSelectDay={setSelectedDay} />}
      {view === "neetcode" && <NeetCodeView onBack={() => setView("patterns")} />}
      {view === "custom" && (
        <CustomView
          roadmaps={customRoadmaps}
          loading={customLoading}
          search={search}
          onSelect={setSelectedCustomSlug}
          onDelete={(slug) => deleteCustomRoadmap.mutate({ slug })}
        />
      )}
      {view === "companies" && <CompaniesView search={search} onSelect={setSelectedCompanySlug} />}
    </div>
  );
}

export default function PatternsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading patterns...</p>
          </div>
        </div>
      }
    >
      <PatternsContent />
    </Suspense>
  );
}
