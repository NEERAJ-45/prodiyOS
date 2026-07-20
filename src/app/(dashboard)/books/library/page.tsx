'use client';

import * as React from 'react';
import Link from 'next/link';

import { ArrowLeft, Library, FileType, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import books, { type BookEntry, categoryLabels } from '@/data/books';

const categoryOrder = [
  '01-Foundations',
  '02-Distributed-Systems',
  '03-Architecture',
  '04-Performance',
  '05-Deep-Mastery',
  '06-Meta-Learning',
  '07-Others',
];

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  '01-Foundations': { bg: 'bg-blue-950/40', border: 'border-blue-800/40', text: 'text-blue-300' },
  '02-Distributed-Systems': { bg: 'bg-violet-950/40', border: 'border-violet-800/40', text: 'text-violet-300' },
  '03-Architecture': { bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', text: 'text-emerald-300' },
  '04-Performance': { bg: 'bg-amber-950/40', border: 'border-amber-800/40', text: 'text-amber-300' },
  '05-Deep-Mastery': { bg: 'bg-rose-950/40', border: 'border-rose-800/40', text: 'text-rose-300' },
  '06-Meta-Learning': { bg: 'bg-cyan-950/40', border: 'border-cyan-800/40', text: 'text-cyan-300' },
  '07-Others': { bg: 'bg-zinc-800/40', border: 'border-zinc-700/40', text: 'text-zinc-300' },
};

function groupBooksByCategory(): Record<string, BookEntry[]> {
  const grouped: Record<string, BookEntry[]> = {};
  for (const book of books) {
    (grouped[book.category] ??= []).push(book);
  }
  return grouped;
}

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const grouped = React.useMemo(() => groupBooksByCategory(), []);
  const q = searchQuery.toLowerCase().trim();

  const filteredGrouped = React.useMemo(() => {
    if (!q) return grouped;
    const result: Record<string, BookEntry[]> = {};
    for (const [cat, catBooks] of Object.entries(grouped)) {
      const filtered = catBooks.filter((b) => b.title.toLowerCase().includes(q));
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [grouped, q]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library..."
          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:bg-zinc-900/80 transition-all"
        />
      </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(grouped[selectedCategory] || []).map((book) => (
              <Link
                key={book.slug}
                href={`/books/${book.slug}`}
                className="block group"
              >
                <Card className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors h-full">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-sm font-medium text-zinc-100 truncate flex-1 min-w-0">
                        {book.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-zinc-500 mt-1">
                      {categoryLabels[book.category] || book.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex items-center gap-2">
                    <FileType className="h-3.5 w-3.5 text-zinc-600" />
                    <span className="text-xs text-zinc-600">PDF</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryOrder.map((cat) => {
            const catBooks = filteredGrouped[cat];
            if (!catBooks) return null;
            const colors = categoryColors[cat] || categoryColors['07-Others'];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
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
                      <CardTitle className={cn('text-base font-semibold', colors.text)}>
                        {categoryLabels[cat] || cat}
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500 mt-1">
                        {catBooks.length} {catBooks.length === 1 ? 'book' : 'books'}
                      </CardDescription>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
