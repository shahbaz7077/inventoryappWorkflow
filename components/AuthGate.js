'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';

export default function AuthGate({ children }) {
  const { user, loading, needsOnboarding } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }
    if (user && needsOnboarding && pathname !== '/onboarding') {
      router.push('/onboarding');
      return;
    }
    if (user && !needsOnboarding && pathname === '/login') {
      router.push('/');
    }
  }, [loading, user, needsOnboarding, pathname]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user && pathname !== '/login') return <div className="p-6">Redirecting…</div>;
  if (user && needsOnboarding && pathname !== '/onboarding') return <div className="p-6">Redirecting…</div>;

  return children;
}