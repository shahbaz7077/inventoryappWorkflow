import './globals.css';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { AuthProvider } from '@/lib/AuthProvider';
import AuthGate from '@/components/AuthGate';

export const metadata = { title: 'Stockroom' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6 py-4 border-b-2 border-[var(--ink)] bg-[var(--card)]">
            <span className="font-display text-xl font-bold tracking-wide">STOCKROOM</span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm uppercase tracking-wider">
              <Link href="/" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
                Dashboard
              </Link>
              <Link href="/addProduct" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
                Add-Product
              </Link>
              <Link href="/demand" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
                Demand
              </Link>
              <Link href="/access" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
                Access
              </Link>
            </div>
          </nav>
          <main className="p-4 sm:p-6 max-w-5xl mx-auto">
            <AuthGate>{children}</AuthGate>
          </main>
          <Toaster theme="light" position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}