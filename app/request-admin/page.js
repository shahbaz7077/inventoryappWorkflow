'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

export default function RequestAdmin() {
  const { user, profile, isAdmin, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Enter a username and password');
      return;
    }
    setSubmitting(true);
    const hash = bcrypt.hashSync(password, 10);

    const { error } = await supabase
      .from('profiles')
      .update({
        admin_request_status: 'pending',
        requested_admin_username: username,
        requested_admin_password_hash: hash,
      })
      .eq('id', profile.id);

    setSubmitting(false);

    if (error) {
      toast.error('Could not submit request');
    } else {
      toast.success('Request submitted — waiting for approval');
      await refreshProfile();
      router.push('/');
    }
  }

  if (loading) return <p className="p-6">Loading…</p>;
  if (!user) return <p className="p-6 text-[var(--rust)]">Please sign in first.</p>;

  if (isAdmin) {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--steel)]">You're already an admin.</p>
      </div>
    );
  }

  if (profile?.admin_request_status === 'pending') {
    return (
      <div className="p-6">
        <p className="text-sm text-[var(--brass)]">Your admin request is pending approval.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <form onSubmit={handleSubmit} className="stock-card p-6 space-y-4 w-80">
        <h1 className="font-display text-xl font-bold text-center">Request Admin Access</h1>
        <p className="text-xs text-[var(--ink)]/60 text-center">
          An existing admin will review and approve your request.
        </p>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Choose a Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Choose a Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--brass)] text-white py-2 font-display uppercase tracking-wider text-sm disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}