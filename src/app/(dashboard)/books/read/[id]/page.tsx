'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BookReaderClient } from '../../[slug]/reader-client';
import { useBooksQuery } from '@/hooks/use-books';

export default function UploadedBookReaderPage() {
  const params = useParams();
  const { data, isLoading } = useBooksQuery();

  const book = React.useMemo(() => {
    if (!data?.books) return null;
    return data.books.find((b) => b.id === params.id || b._id === params.id);
  }, [data, params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-400">Book not found.</p>
      </div>
    );
  }

  const pdfUrl = book.pdfPath
    ? `/api/books/read/${book.id}`
    : undefined;

  return (
    <BookReaderClient
      title={book.title}
      pdfUrl={pdfUrl}
    />
  );
}
