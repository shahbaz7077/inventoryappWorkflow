'use client';

import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  async function signInWithGithub() {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--paper)] px-4">
      <div className="stock-card p-8 w-full max-w-sm text-center space-y-5">
        <h1 className="font-display text-2xl font-bold">Stockroom</h1>
        <p className="text-xs text-[var(--ink)]/60">Sign in to access the inventory system</p>
        <button
          onClick={signInWithGithub}
          className="w-full bg-[var(--ink)] text-white py-2.5 font-display uppercase tracking-wider text-sm hover:opacity-90 transition"
        >
          Sign in with GitHub
        </button>
      </div>
    </div>
  );
}