'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Loader2, Trash2, Pencil, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useBooksQuery,
  useUpdateBook,
  useDeleteBook,
  type BookStatus,
} from '@/hooks/use-books';
import { BookFormDialog, type BookFormState } from '@/components/books/BookFormDialog';
import { toast } from '@/components/ui/toast';
import { getCategoryLabel } from '@/data/book-categories';

const statusConfig: Record<BookStatus, { label: string; className: string }> = {
  TO_READ: { label: 'To Read', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: 'Reading', className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  REFERENCE: { label: 'Reference', className: 'bg-amber-950 text-amber-300 border-amber-800' },
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useBooksQuery();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<BookFormState | null>(null);

  const book = React.useMemo(() => {
    if (!data?.books) return null;
    return data.books.find((b) => b.id === params.id || b._id === params.id) ?? null;
  }, [data, params.id]);

  function openEdit() {
    if (!book) return;
    setForm({
      title: book.title,
      author: book.author || '',
      category: book.category || 'other',
      status: book.status,
      progress: book.progress,
      rating: book.rating,
    });
    setEditOpen(true);
  }

  function handleSave() {
    if (!form || !book) return;
    updateBook.mutate(
      {
        id: book._id || book.id,
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        status: form.status,
        progress: form.progress,
        rating: form.rating,
      },
      {
        onSuccess: () => {
          toast({ title: 'Book updated' });
          setEditOpen(false);
        },
        onError: () => toast({ variant: 'destructive', title: 'Failed to update' }),
      }
    );
  }

  function handleDelete() {
    if (!book) return;
    deleteBook.mutate(book._id || book.id, {
      onSuccess: () => {
        toast({ title: 'Book deleted' });
        router.push('/books/reading');
      },
      onError: () => toast({ variant: 'destructive', title: 'Failed to delete' }),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <p className="text-sm">Book not found</p>
        <Link href="/books/reading" className="text-xs text-primary hover:underline mt-2">Back to reading list</Link>
      </div>
    );
  }

  const hasPdf = !!(book.hasPdf || book.pdfPath);
  const config = statusConfig[book.status];
  const categoryLabel = getCategoryLabel(book.category || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Link
          href="/books/reading"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-zinc-100 truncate">{book.title}</h1>
          {book.author && (
            <p className="text-sm text-zinc-500">{book.author}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
            {config.label}
          </Badge>
          <Button variant="outline" size="icon" onClick={openEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete} title="Delete" className="hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Category</span>
                <span className="text-zinc-300">{categoryLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <span className="text-zinc-300">{config.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Progress</span>
                <span className="text-zinc-300">{book.progress}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Rating</span>
                <span className="text-zinc-300">
                  {book.rating > 0 ? (
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < book.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                          )}
                        />
                      ))}
                    </span>
                  ) : '—'}
                </span>
              </div>
              {hasPdf && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">PDF</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <FileType className="h-3 w-3" /> Attached
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {hasPdf ? (
            <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src={`/api/books/read/${book.id}`}
                  className="w-full h-[70vh] border-0"
                  title={book.title}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <FileType className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-400">No PDF attached</p>
                <p className="text-xs text-zinc-600 mt-1">Edit this book to upload a PDF</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {form && (
        <BookFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          form={form}
          onFormChange={setForm}
          onSave={handleSave}
          isPending={updateBook.isPending}
        />
      )}
    </motion.div>
  );
}
