'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Name and phone number are required');
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name, phone })
      .eq('id', user.id);
    setLoading(false);

    if (error) {
      toast.error('Something went wrong');
    } else {
      await refreshProfile();
      toast.success('Welcome!');
      router.push('/');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <form onSubmit={handleSubmit} className="stock-card p-6 space-y-4 w-full max-w-sm">
        <h1 className="font-display text-xl font-bold text-center">Tell us about you</h1>
        <p className="text-xs text-red-500 break-all">DEBUG: {user?.id}</p>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--steel)] text-white py-2 font-display uppercase tracking-wider text-sm disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue to Dashboard'}
        </button>
      </form>
    </div>
  );
}