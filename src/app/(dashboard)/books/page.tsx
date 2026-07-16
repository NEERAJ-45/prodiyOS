'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FileText,
  FileCode,
  Star,
  ExternalLink,
  Library,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  FileType,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useBooksQuery,
  useAddBook,
  useUpdateBook,
  useDeleteBook,
  type BookData,
  type BookStatus,
} from '@/hooks/use-books';
import { BookFormDialog, type BookFormState } from '@/components/books/BookFormDialog';
import { toast } from '@/components/ui/toast';
import books, { type BookEntry, categoryLabels } from '@/data/books';
import QuestionsTable, { type QuestionItem } from '@/components/roadmaps/QuestionsTable';

type PaperStatus = 'TO_READ' | 'READING' | 'COMPLETED';

interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  source: string;
  year: number;
  status: PaperStatus;
  url: string;
}

const bookStatusConfig: Record<BookStatus, { label: string; className: string }> = {
  TO_READ: { label: 'To Read', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: 'Reading', className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  REFERENCE: { label: 'Reference', className: 'bg-amber-950 text-amber-300 border-amber-800' },
};

const paperStatusConfig: Record<PaperStatus, { label: string; className: string }> = {
  TO_READ: { label: 'To Read', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: 'Reading', className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
};

const papers: ResearchPaper[] = [
  { id: '1', title: 'MapReduce: Simplified Data Processing on Large Clusters', authors: 'Jeffrey Dean, Sanjay Ghemawat', source: 'OSDI', year: 2004, status: 'COMPLETED', url: 'https://research.google/pubs/pub62/' },
  { id: '2', title: 'The Google File System', authors: 'Sanjay Ghemawat, Howard Gobioff, Shun-Tak Leung', source: 'SOSP', year: 2003, status: 'COMPLETED', url: 'https://research.google/pubs/pub51/' },
  { id: '3', title: "Dynamo: Amazon's Highly Available Key-value Store", authors: 'Giuseppe DeCandia et al.', source: 'SOSP', year: 2007, status: 'READING', url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf' },
  { id: '4', title: "Spanner: Google's Globally Distributed Database", authors: 'James C. Corbett et al.', source: 'OSDI', year: 2012, status: 'TO_READ', url: 'https://research.google/pubs/pub39966/' },
];

const categoryOrder = [
  '01-Foundations',
  '02-Distributed-Systems',
  '03-Architecture',
  '04-Performance',
  '05-Deep-Mastery',
  '06-Meta-Learning',
  '07-Others',
];

const emptyFormState: BookFormState = {
  title: '',
  author: '',
  status: 'TO_READ',
  progress: 0,
  rating: 0,
  pdfFile: null,
};

function groupBooksByCategory(): Record<string, BookEntry[]> {
  const grouped: Record<string, BookEntry[]> = {};
  for (const book of books) {
    (grouped[book.category] ??= []).push(book);
  }
  return grouped;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const RatingStars = React.memo(function RatingStars({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'xs';
}) {
  if (rating === 0) return null;
  const starSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starSize,
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
          )}
        />
      ))}
    </div>
  );
});

const TrackedBookCard = React.memo(function TrackedBookCard({
  book,
  onEdit,
  onDelete,
}: {
  book: BookData;
  onEdit: (book: BookData) => void;
  onDelete: (id: string) => void;
}) {
  const config = bookStatusConfig[book.status];
  const hasPdf = !!book.pdfPath;

  const card = (
    <Card className={cn(
      'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group',
      hasPdf && 'cursor-pointer'
    )}>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-zinc-100 truncate">{book.title}</CardTitle>
            {book.author && (
              <CardDescription className="text-xs text-zinc-500 mt-0.5">{book.author}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className={cn('text-[10px] font-medium shrink-0', config.className)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-3">
        {(book.status === 'READING' || book.status === 'COMPLETED') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Progress</span>
              <span className="text-zinc-400">{book.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-500 transition-all duration-700"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <RatingStars rating={book.rating} />
          <div className="flex items-center gap-1">
            {hasPdf && (
              <Link
                href={`/books/read/${book.id}`}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 transition-colors"
                title="Read PDF"
                onClick={(e) => e.stopPropagation()}
              >
                <FileType className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              onClick={() => onEdit(book)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Edit"
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(book._id || book.id)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete"
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (hasPdf) {
    return <Link href={`/books/read/${book.id}`}>{card}</Link>;
  }
  return card;
});

const PaperCard = React.memo(function PaperCard({
  paper,
}: {
  paper: ResearchPaper;
}) {
  const config = paperStatusConfig[paper.status];
  return (
    <Card className="border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-200">{paper.title}</p>
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-400 bg-blue-950/40 border border-blue-800/40 rounded hover:bg-blue-950/60 transition-colors"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-zinc-500">{paper.authors}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-600">{paper.source}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-[11px] text-zinc-600">{paper.year}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn('text-[10px] font-medium', config.className)}>
              {config.label}
            </Badge>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ─── Category helpers ─────────────────────────────────────────────────────────

const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  '01-Foundations': { bg: 'bg-blue-950/40', border: 'border-blue-800/40', text: 'text-blue-300', icon: '#3b82f6' },
  '02-Distributed-Systems': { bg: 'bg-violet-950/40', border: 'border-violet-800/40', text: 'text-violet-300', icon: '#8b5cf6' },
  '03-Architecture': { bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', text: 'text-emerald-300', icon: '#10b981' },
  '04-Performance': { bg: 'bg-amber-950/40', border: 'border-amber-800/40', text: 'text-amber-300', icon: '#f59e0b' },
  '05-Deep-Mastery': { bg: 'bg-rose-950/40', border: 'border-rose-800/40', text: 'text-rose-300', icon: '#f43f5e' },
  '06-Meta-Learning': { bg: 'bg-cyan-950/40', border: 'border-cyan-800/40', text: 'text-cyan-300', icon: '#06b6d4' },
  '07-Others': { bg: 'bg-zinc-800/40', border: 'border-zinc-700/40', text: 'text-zinc-300', icon: '#71717a' },
};

const categoryToDifficulty: Record<string, string> = {
  '01-Foundations': 'EASY',
  '02-Distributed-Systems': 'MEDIUM',
  '03-Architecture': 'MEDIUM',
  '04-Performance': 'HARD',
  '05-Deep-Mastery': 'HARD',
  '06-Meta-Learning': 'MEDIUM',
  '07-Others': 'EASY',
};

function slugToNumber(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function bookToQuestionItem(book: BookEntry): QuestionItem {
  return {
    id: slugToNumber(book.slug),
    title: book.title,
    description: categoryLabels[book.category] || book.category,
    difficulty: categoryToDifficulty[book.category] || 'EASY',
    link: `/books/${book.slug}`,
  };
}

const CategoryCard = React.memo(function CategoryCard({
  catKey,
  label,
  count,
  onClick,
}: {
  catKey: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const colors = categoryColors[catKey] || categoryColors['07-Others'];
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <Card className={cn(
        'border transition-all cursor-pointer group h-full',
        colors.border, colors.bg,
        'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20'
      )}>
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colors.bg, 'ring-1', colors.border)}>
            <Library className={cn('h-6 w-6', colors.text)} />
          </div>
          <div>
            <CardTitle className={cn('text-base font-semibold', colors.text)}>{label}</CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              {count} {count === 1 ? 'book' : 'books'}
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </button>
  );
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const { data: booksData, isLoading } = useBooksQuery();
  const addBook = useAddBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const [searchQuery, setSearchQuery] = React.useState('');
  const grouped = React.useMemo(() => groupBooksByCategory(), []);

  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<BookData | null>(null);
  const [form, setForm] = React.useState<BookFormState>(emptyFormState);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const trackedBooks: BookData[] = booksData?.books ?? [];

  const filteredGrouped = React.useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    const result: Record<string, BookEntry[]> = {};
    for (const [cat, catBooks] of Object.entries(grouped)) {
      const filtered = catBooks.filter((b) => b.title.toLowerCase().includes(q));
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [grouped, searchQuery]);

  function openAddDialog() {
    setDialogMode('add');
    setEditingBook(null);
    setForm(emptyFormState);
    setDialogOpen(true);
  }

  function openEditDialog(book: BookData) {
    setDialogMode('edit');
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author || '',
      status: book.status,
      progress: book.progress,
      rating: book.rating,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;

    if (dialogMode === 'add') {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('author', form.author.trim());
      formData.append('status', form.status);
      formData.append('progress', String(form.progress));
      formData.append('rating', String(form.rating));
      if (form.pdfFile) {
        formData.append('pdf', form.pdfFile);
      }

      addBook.mutate(
        formData as any,
        {
          onSuccess: () => {
            toast({ title: 'Book added' });
            setDialogOpen(false);
          },
          onError: () => toast({ variant: 'destructive', title: 'Failed to add book' }),
        }
      );
    } else if (editingBook) {
      updateBook.mutate(
        {
          id: editingBook._id || editingBook.id,
          title: form.title.trim(),
          author: form.author.trim(),
          status: form.status,
          progress: form.progress,
          rating: form.rating,
        },
        {
          onSuccess: () => {
            toast({ title: 'Book updated' });
            setDialogOpen(false);
            setEditingBook(null);
          },
          onError: () => toast({ variant: 'destructive', title: 'Failed to update book' }),
        }
      );
    }
  }

  function handleDelete(id: string) {
    deleteBook.mutate(id, {
      onSuccess: () => toast({ title: 'Book deleted' }),
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete book' }),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 p-4 md:p-6 space-y-6 md:space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Books & Research</h1>
            <p className="text-sm text-zinc-500 mt-1">Read, track, and organize your knowledge</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className="relative max-w-md"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:bg-zinc-900/80 transition-all"
          />
        </motion.div>

        <Tabs defaultValue="library" className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <TabsList className="bg-zinc-900 border border-zinc-800 overflow-x-auto flex-nowrap">
              <TabsTrigger value="library" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-xs gap-2">
                <Library className="h-3.5 w-3.5" />
                Library
              </TabsTrigger>
              <TabsTrigger value="books" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-xs gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Reading
              </TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-zinc-500 text-xs gap-2">
                <FileCode className="h-3.5 w-3.5" />
                Documentation
              </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={openAddDialog} className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Book
            </Button>
          </div>

          <TabsContent value="library" className="mt-0 space-y-6">
            {selectedCategory ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to categories
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-200">
                    {categoryLabels[selectedCategory] || selectedCategory}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {(grouped[selectedCategory] || []).length} books
                  </p>
                </div>
                <QuestionsTable
                  questions={(grouped[selectedCategory] || []).map(bookToQuestionItem)}
                  storagePrefix={`books-cat-${selectedCategory}`}
                  searchPlaceholder={`Search books in ${categoryLabels[selectedCategory] || selectedCategory}...`}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryOrder.map((cat) => {
                    const catBooks = filteredGrouped[cat];
                    if (!catBooks) return null;
                    return (
                      <CategoryCard
                        key={cat}
                        catKey={cat}
                        label={categoryLabels[cat] || cat}
                        count={catBooks.length}
                        onClick={() => setSelectedCategory(cat)}
                      />
                    );
                  })}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Research Papers
                  </h3>
                  <div className="space-y-2">
                    {papers.map((paper) => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="books" className="mt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : trackedBooks.length === 0 ? (
              <Card className="border-zinc-800 bg-zinc-900/30">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <BookOpen className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-sm font-medium text-zinc-400">No books tracked yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Click &ldquo;Add Book&rdquo; to start tracking your reading</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackedBooks.map((book) => (
                  <TrackedBookCard
                    key={book._id || book.id}
                    book={book}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="mt-0">
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <FileCode className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-400">Coming Soon</p>
                <p className="text-xs text-zinc-600 mt-1">Documentation tracking is under development</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BookFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isPending={addBook.isPending || updateBook.isPending}
      />
    </motion.div>
  );
}
