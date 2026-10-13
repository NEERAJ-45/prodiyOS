'use client';

import * as React from 'react';
import Link from 'next/link';

import { FileText, FolderOpen, Loader2, Plus, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocFormDialog, type DocFormState } from '@/components/docs/DocFormDialog';
import { toast } from '@/components/ui/toast';
import {
  DOC_STATUS_LABELS,
  useAddDoc,
  useDocsQuery,
  type DocData,
} from '@/hooks/use-docs';
import { useDocSearchQuery } from '@/hooks/use-doc-search';

const docStatusConfig: Record<DocData['status'], { label: string; className: string }> = {
  TO_READ: { label: DOC_STATUS_LABELS.TO_READ, className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: DOC_STATUS_LABELS.READING, className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: DOC_STATUS_LABELS.COMPLETED, className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  REFERENCE: { label: DOC_STATUS_LABELS.REFERENCE, className: 'bg-amber-950 text-amber-300 border-amber-800' },
};

const fileTypeLabels: Record<DocData['fileType'], string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  md: 'MD',
};

const emptyFormState: DocFormState = {
  title: '',
  category: '',
  status: 'TO_READ',
};

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<DocFormState>(emptyFormState);
  const { data: docsData, isLoading } = useDocsQuery();
  const addDoc = useAddDoc();

  const docs = docsData?.docs ?? [];
  const q = searchQuery.toLowerCase().trim();

  const { data: searchResults, isFetching: isSearching } = useDocSearchQuery(searchQuery, !!q);

  const categories = React.useMemo(() => {
    const set = new Set(docs.map((d) => d.category || 'other'));
    return Array.from(set).sort();
  }, [docs]);

  const filteredDocs = React.useMemo(() => {
    if (!q) return docs;
    return docs.filter(
      (d) => d.title.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q)
    );
  }, [docs, q]);

  const grouped = React.useMemo(() => {
    const g: Record<string, DocData[]> = {};
    for (const doc of filteredDocs) {
      (g[doc.category || 'other'] ??= []).push(doc);
    }
    return g;
  }, [filteredDocs]);

  const searchHits = React.useMemo(() => {
    if (!q || !searchResults?.results) return new Set<string>();
    return new Set(searchResults.results.map((r) => r.docId));
  }, [q, searchResults]);

  function openAddDialog() {
    setForm(emptyFormState);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.fileUrl || !form.fileType) return;

    addDoc.mutate(
      {
        title: form.title.trim(),
        category: form.category.trim() || 'other',
        status: form.status,
        progress: 0,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
        fileName: form.fileName || '',
      },
      {
        onSuccess: () => {
          toast({ title: 'Doc added' });
          setDialogOpen(false);
        },
        onError: () => toast({ variant: 'destructive', title: 'Failed to add doc' }),
      }
    );
  }

  const categoryList = selectedCategory ? [selectedCategory] : Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:bg-zinc-900/80 transition-all"
          />
        </div>
        <Button variant="outline" size="sm" onClick={openAddDialog} className="shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Doc
        </Button>
      </div>

      {!selectedCategory && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <FolderOpen className="h-3 w-3 text-zinc-500" />
              {cat}
              <span className="text-zinc-600">({docs.filter((d) => (d.category || 'other') === cat).length})</span>
            </button>
          ))}
        </div>
      )}

      {selectedCategory && (
        <button
          onClick={() => setSelectedCategory(null)}
          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          ← All categories
        </button>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="space-y-6">
          {q && isSearching && (
            <p className="text-xs text-zinc-500">Searching doc contents...</p>
          )}
          {q && searchHits.size > 0 && (
            <p className="text-xs text-zinc-500">
              {searchHits.size} doc{searchHits.size === 1 ? '' : 's'} match in full text
            </p>
          )}
          {categoryList.map((cat) => {
            const docsInCategory = grouped[cat];
            if (!docsInCategory?.length) return null;

            return (
              <section key={cat} className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-100">
                  {cat}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {docsInCategory.length} doc{docsInCategory.length === 1 ? '' : 's'}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docsInCategory.map((doc) => {
                    const status = docStatusConfig[doc.status];
                    const fullTextHit = searchHits.has(doc.id);

                    return (
                      <Link key={doc._id || doc.id} href={`/docs/read/${doc.id}`} className="block group">
                        <Card
                          className={cn(
                            'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors h-full',
                            fullTextHit && 'border-primary/40'
                          )}
                        >
                          <CardHeader className="p-5 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="text-sm font-medium text-zinc-100 truncate flex-1 min-w-0">
                                {doc.title}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] font-medium shrink-0', status.className)}
                              >
                                {status.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-5 pt-0 space-y-3">
                            <div className="text-[10px] text-zinc-600 uppercase tracking-wider">
                              {doc.category || 'other'}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">{fileTypeLabels[doc.fileType]}</span>
                              {doc.progress > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary/60"
                                      style={{ width: `${doc.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-zinc-500">{doc.progress}%</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              {q ? 'No docs match your search' : 'No docs yet'}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Upload a PDF, DOCX, or Markdown file with Add Doc
            </p>
          </CardContent>
        </Card>
      )}

      <DocFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={addDoc.isPending}
        categorySuggestions={categories}
      />
    </div>
  );
}
