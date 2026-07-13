import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from '@/components/providers/ProfileProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProdigyOS — Engineering Operating System',
  description: 'Personal Engineering Mastery Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add('dark')`,
        }} />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <QueryProvider>
            <ProfileProvider>
              {children}
              <Toaster />
            </ProfileProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
