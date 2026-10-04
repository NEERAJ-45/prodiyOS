import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { ProfileProvider } from '@/components/providers/ProfileProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/toast';
import { GeistSans, GeistMono } from 'geist/font';
import { Caveat, Kalam, Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const bodyFont = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });
const kalam = Kalam({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-kalam', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-ibm-plex-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'ProdigyOS — Engineering Operating System',
  description: 'Personal Engineering Mastery Platform',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${bodyFont.variable} ${GeistSans.variable} ${GeistMono.variable} ${ibmPlexMono.variable} ${caveat.variable} ${kalam.variable} ${fraunces.variable}`}>
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
