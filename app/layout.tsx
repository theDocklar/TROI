/**
 * Root layout — sets up DM Sans font, SWR provider, and toast notifications.
 */

import type { Metadata } from 'next';
import { DM_Sans, Inter } from 'next/font/google';
import SWRProvider from '@/components/providers/SWRProvider';
import { Toaster } from 'sonner';
import './globals.css';
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ROI Intelligence — Blank',
  description: 'Marketing profitability dashboard for Blank clothing store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 min-h-screen">
        <SWRProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SWRProvider>
      </body>
    </html>
  );
}
