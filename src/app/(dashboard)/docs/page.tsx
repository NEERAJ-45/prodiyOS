'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { FileText, FolderOpen, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DocFormDialog, type DocFormState } from '@/components/docs/DocFormDialog';
import { toast } from '@/components/ui/toast';
import {
  DOC_STATUS_LABELS,
  useAddDoc,
  useDeleteDoc,
  useDocsQuery,
  useUpdateDoc,
  type DocData,
} from '@/hooks/use-docs';
import { useDocSearchQuery } from '@/hooks/use-doc-search';

const docStatusConfig: Record<DocData['status'], { label: string; className: string }> = {
  TO_READ: { label: DOC_STATUS_LABELS.TO_READ, className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: DOC_STATUS_LABELS.READING, className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: DOC_STATUS_LABELS.COMPLETED, className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  REFERENCE: { label: DOC_STATUS_LABELS.REFERENCE, className: 'bg-amber-950 text-amber-300 border-amber-800' },
};

const fileTypeConfig: Record<DocData['fileType'], { label: string; className: string }> = {
  pdf: { label: 'PDF', className: 'bg-red-950/60 text-red-300 border-red-800/50' },
  docx: { label: 'DOCX', className: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  md: { label: 'MD', className: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
};

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const emptyFormState: DocFormState = {
  title: '',
  category: '',
  status: 'TO_READ',
};

export default function DocsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [editingDoc, setEditingDoc] = React.useState<DocData | null>(null);
  const [form, setForm] = React.useState<DocFormState>(emptyFormState);
  const { data: docsData, isLoading } = useDocsQuery();
  const addDoc = useAddDoc();
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();

  const docs = docsData?.docs ?? [];
  const q = searchQuery.toLowerCase().trim();

  const { data: searchResults, isFetching: isSearching } = useDocSearchQuery(searchQuery, !!q);

  const categories = React.useMemo(() => {
    const set = new Set(docs.map((d) => d.category || 'other'));
    return Array.from(set).sort();
  }, [docs]);

  const filteredDocs = React.useMemo(() => {
    let result = docs;
    if (selectedCategory) {
      result = result.filter((d) => (d.category || 'other') === selectedCategory);
    }
    if (q) {
      result = result.filter(
        (d) => d.title.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [docs, q, selectedCategory]);

  const searchHits = React.useMemo(() => {
    if (!q || !searchResults?.results) return new Set<string>();
    return new Set(searchResults.results.map((r) => r.docId));
  }, [q, searchResults]);

  function openAddDialog() {
    setDialogMode('add');
    setEditingDoc(null);
    setForm(emptyFormState);
    setDialogOpen(true);
  }

  function openEditDialog(doc: DocData) {
    setDialogMode('edit');
    setEditingDoc(doc);
    setForm({
      title: doc.title,
      category: doc.category || 'other',
      status: doc.status,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
      fileName: doc.fileName,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;

    if (dialogMode === 'edit' && editingDoc) {
      updateDoc.mutate(
        {
          id: editingDoc._id || editingDoc.id,
          title: form.title.trim(),
          category: form.category.trim() || 'other',
          status: form.status,
        },
        {
          onSuccess: () => {
            toast({ title: 'Doc updated' });
            setDialogOpen(false);
            setEditingDoc(null);
          },
          onError: () => toast({ variant: 'destructive', title: 'Failed to update doc' }),
        }
      );
      return;
    }

    if (!form.fileUrl || !form.fileType) return;

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

  function handleDelete(id: string) {
    deleteDoc.mutate(id, {
      onSuccess: () => toast({ title: 'Doc deleted' }),
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete doc' }),
    });
  }

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

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? null : cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer',
                  active
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
                )}
              >
                <FolderOpen className={cn('h-3 w-3', active ? 'text-primary' : 'text-zinc-500')} />
                {cat}
                <span className={active ? 'text-primary/60' : 'text-zinc-600'}>
                  ({docs.filter((d) => (d.category || 'other') === cat).length})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {q && (isSearching || searchHits.size > 0) && (
        <p className="text-xs text-zinc-500 -mt-2">
          {isSearching
            ? 'Searching doc contents...'
            : `${searchHits.size} doc${searchHits.size === 1 ? '' : 's'} match in full text`}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Updated</th>
                  <th className="px-4 py-3" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, idx) => {
                  const status = docStatusConfig[doc.status];
                  const fullTextHit = searchHits.has(doc.id);
                  return (
                    <tr
                      key={doc._id || doc.id}
                      onClick={() => router.push(`/docs/read/${doc.id}`)}
                      className={cn(
                        'border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors cursor-pointer',
                        fullTextHit && 'bg-primary/5'
                      )}
                    >
                      <td className="px-4 py-3 text-zinc-600 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                          <span className="text-zinc-200 font-medium truncate max-w-[240px]">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{doc.category || 'other'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-medium', fileTypeConfig[doc.fileType].className)}
                        >
                          {fileTypeConfig[doc.fileType].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-medium', status.className)}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60"
                              style={{ width: `${doc.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500">{doc.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {formatDate(doc.updatedAt || doc.createdAt) || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditDialog(doc); }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                          title="Edit"
                          type="button"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(doc._id || doc.id); }}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete"
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              {q || selectedCategory ? 'No docs match your filters' : 'No docs yet'}
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
        mode={dialogMode}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={addDoc.isPending || updateDoc.isPending}
        categorySuggestions={categories}
      />
    </div>
  );
}
