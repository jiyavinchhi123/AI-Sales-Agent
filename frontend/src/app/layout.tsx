import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'AI Sales Agent — Signal to Opportunity',
  description: 'Autonomous B2B Sales Platform: Buying Signals, Lead Scoring, AI Calling, and CRM Handoff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full flex overflow-hidden text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
