'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

const NAV_ITEMS = [
  { href: '/books/library', label: 'Library' },
  { href: '/books/reading', label: 'Reading' },
  { href: '/books/papers', label: 'Papers' },
  { href: '/books/docs', label: 'Documentation' },
];

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem('book-library-indexed')) return;
    } catch {}
    toast({ title: 'Indexing library books...' });
    fetch('/api/books/index-library', { method: 'POST' })
      .then(async (res) => {
        const data = await res.json();
        toast({ title: `Indexed ${data.indexed} library books` });
        try { localStorage.setItem('book-library-indexed', '1'); } catch {}
      })
      .catch(() => toast({ variant: 'destructive', title: 'Failed to index library' }));
  }, []);

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
        >
          <nav className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>

        {children}
      </div>
    </motion.div>
  );
}
