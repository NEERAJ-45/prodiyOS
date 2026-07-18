'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Table2, StickyNote, Building2 } from 'lucide-react';

const subNav = [
  { label: 'Overview', href: '/interviews', icon: Briefcase },
  { label: 'Applications', href: '/interviews/applications', icon: Table2 },

  { label: 'Notes', href: '/interviews/notes', icon: StickyNote, hide: true },
  { label: 'Company', href: '/interviews/companies', icon: Building2, hide: true },
];

export default function InterviewsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetailPage = pathname.includes('/notes/') || pathname.includes('/companies/');

  return (
    <div className="flex flex-col h-full">
      {!isDetailPage && (
        <div className="flex items-center gap-1 px-4 md:px-6 pt-4 pb-2 border-b border-zinc-800">
          {subNav.filter((n) => !n.hide).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
