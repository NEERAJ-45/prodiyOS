import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from '@/components/providers/ProfileProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProdigyOS — Engineering Operating System',
  description: 'Personal Engineering Mastery Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SessionProvider>
          <ProfileProvider>
            {children}
          </ProfileProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
