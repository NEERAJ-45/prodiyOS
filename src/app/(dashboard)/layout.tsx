'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { NotificationsProvider } from '@/components/providers/NotificationsProvider';
import { MusicPlayer } from '@/components/player/MusicPlayer';

const MobileNav = dynamic(() => import('@/components/layout/mobile-nav').then(m => m.MobileNav));
const QuoteToast = dynamic(() => import('@/components/ui/quote-toast').then(m => m.QuoteToast));
const PageTransition = dynamic(() => import('@/components/shared/PageTransition').then(m => m.PageTransition));
const CompanionAvatar = dynamic(() => import('@/components/companion/CompanionAvatar').then(m => m.CompanionAvatar));

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationsProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar global />
          <main className="flex-1 overflow-y-auto pb-24 md:pb-20">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <MobileNav />
        <QuoteToast />
        <CompanionAvatar />
        <MusicPlayer />
      </div>
    </NotificationsProvider>
  );
}
