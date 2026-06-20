import { Sidebar } from '@/components/layout/sidebar';
import { GlobalSearch } from '@/components/shared/GlobalSearch';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-center border-b bg-background px-4">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
