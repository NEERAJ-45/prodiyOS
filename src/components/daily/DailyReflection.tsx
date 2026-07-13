'use client';

import { StickyNote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DailyReflection({ note, onChange }: { note: string; onChange: (text: string) => void }) {
  return (
    <Card className="bg-card/50 border-zinc-800">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-amber-400" />
          <CardTitle className="text-sm font-medium text-zinc-200">Daily Reflection</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <textarea
          value={note}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What did you learn today? Wins, struggles, thoughts..."
          className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 outline-none resize-none focus:border-zinc-700 transition-colors placeholder:text-zinc-600"
        />
      </CardContent>
    </Card>
  );
}
