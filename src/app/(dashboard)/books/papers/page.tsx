'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const papers: ResearchPaper[] = [
  { id: '1', title: 'MapReduce: Simplified Data Processing on Large Clusters', authors: 'Jeffrey Dean, Sanjay Ghemawat', source: 'OSDI', year: 2004, status: 'COMPLETED', url: 'https://research.google/pubs/pub62/' },
  { id: '2', title: 'The Google File System', authors: 'Sanjay Ghemawat, Howard Gobioff, Shun-Tak Leung', source: 'SOSP', year: 2003, status: 'COMPLETED', url: 'https://research.google/pubs/pub51/' },
  { id: '3', title: "Dynamo: Amazon's Highly Available Key-value Store", authors: 'Giuseppe DeCandia et al.', source: 'SOSP', year: 2007, status: 'READING', url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf' },
  { id: '4', title: "Spanner: Google's Globally Distributed Database", authors: 'James C. Corbett et al.', source: 'OSDI', year: 2012, status: 'TO_READ', url: 'https://research.google/pubs/pub39966/' },
];

const statusConfig: Record<PaperStatus, { label: string; className: string }> = {
  TO_READ: { label: 'To Read', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  READING: { label: 'Reading', className: 'bg-blue-950 text-blue-300 border-blue-800' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
};

export default function PapersPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const q = searchQuery.toLowerCase().trim();

  const filtered = !q ? papers : papers.filter((p) => p.title.toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search papers..."
          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-primary/50 focus:bg-zinc-900/80 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              {searchQuery ? 'No papers match your search' : 'No research papers'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((paper) => {
            const config = statusConfig[paper.status];
            return (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
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
                          <span className="text-zinc-700">&middot;</span>
                          <span className="text-[11px] text-zinc-600">{paper.year}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] font-medium shrink-0', config.className)}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
