import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { QuoteToast } from '@/components/ui/quote-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Navbar global />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
      <QuoteToast />
    </div>
  );
}
