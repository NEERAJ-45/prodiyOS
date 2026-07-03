'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { quotes } from '../../../quotes';

export function QuoteToast() {
  useEffect(() => {
    const showQuote = () => {
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'toast-enter' : 'toast-exit'
            } flex items-start gap-2 rounded-lg border border-zinc-700/50 bg-zinc-900/95 px-3 py-2.5 shadow-lg text-xs text-zinc-100`}
            style={{ minWidth: 260, maxWidth: 320 }}
          >
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1-3.361-6.867 8.21 8.21 0 0 0 3 2.48 8.25 8.25 0 0 0 9.638-3.807 8.289 8.289 0 0 1-2.275 3.008Z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="font-medium leading-snug">{q.text}</div>
              <div className="mt-0.5 leading-snug text-zinc-400">— {q.author}</div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="-mr-1 -mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    };

    const interval = setInterval(showQuote, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
