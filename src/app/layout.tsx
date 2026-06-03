import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AppHeader } from '@/components/AppHeader';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KPI Tracker | Monitorizarea performanței proiectelor',
  description:
    'Sistem informatic de gestiune pentru monitorizarea performanței proiectelor prin KPI, dashboard-uri și snapshot-uri istorice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
