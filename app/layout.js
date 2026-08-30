import './globals.css';
import { Toaster } from 'sonner';
import Link from 'next/link';

export const metadata = { title: 'Stockroom' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="flex items-center gap-6 px-6 py-4 border-b-2 border-[var(--ink)] bg-[var(--card)]">
          <span className="font-display text-xl font-bold tracking-wide">STOCKROOM</span>
          <div className="flex gap-5 text-sm uppercase tracking-wider">
            <Link href="/" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
              Dashboard
            </Link>
            <Link href="/addProduct" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
              Add-Product
            </Link>
            <Link href="/demand" className="hover:text-[var(--steel)] border-b-2 border-transparent hover:border-[var(--steel)] pb-1">
              Demand
            </Link>
          </div>
        </nav>
        <main className="p-6 max-w-5xl mx-auto">{children}</main>
        <Toaster theme="light" position="top-right" />
      </body>
    </html>
  );
}
