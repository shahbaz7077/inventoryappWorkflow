'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';

export default function AccessControl() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin]);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProfiles(data);
    setLoading(false);
  }

  async function approveRequest(profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin', admin_request_status: 'approved' })
      .eq('id', profile.id);

    if (error) {
      toast.error('Could not approve');
    } else {
      toast.success(`${profile.name || profile.email} is now admin`);
      fetchProfiles();
    }
  }

  async function denyRequest(profile) {
    const { error } = await supabase
      .from('profiles')
      .update({ admin_request_status: 'denied' })
      .eq('id', profile.id);

    if (error) {
      toast.error('Could not deny');
    } else {
      toast.success('Request denied');
      fetchProfiles();
    }
  }

  async function toggleRole(profile) {
    const newRole = profile.role === 'admin' ? 'visitor' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);

    if (error) {
      toast.error('Could not update role');
    } else {
      toast.success(`${profile.name || profile.email} is now ${newRole}`);
      fetchProfiles();
    }
  }

  if (authLoading) return <p className="p-6">Loading…</p>;
  if (!isAdmin) return <p className="p-6 text-[var(--rust)]">Access denied — admins only.</p>;

  const pendingRequests = profiles.filter((p) => p.admin_request_status === 'pending');
  const others = profiles.filter((p) => p.admin_request_status !== 'pending');

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Access Control</h1>

      {loading && <p className="text-sm text-[var(--ink)]/50">Loading…</p>}

      {!loading && pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold mb-3">Pending Admin Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((p) => (
              <div key={p.id} className="stock-card p-4 pl-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{p.name || 'Unnamed'} — {p.email}</p>
                  <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                    Phone: {p.phone || 'N/A'} · Requested username: {p.requested_admin_username || 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(p)}
                    className="text-xs uppercase tracking-wider border border-[var(--steel)] text-[var(--steel)] px-3 py-1.5 hover:bg-[var(--steel)] hover:text-white transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyRequest(p)}
                    className="text-xs uppercase tracking-wider border border-[var(--rust)] text-[var(--rust)] px-3 py-1.5 hover:bg-[var(--rust)] hover:text-white transition"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div>
          <h2 className="font-display text-lg font-bold mb-3">All Users</h2>
          <div className="space-y-3">
            {others.length === 0 && (
              <p className="text-sm text-[var(--ink)]/50">No users yet.</p>
            )}
            {others.map((p) => (
              <div key={p.id} className="stock-card p-4 pl-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{p.name || 'Unnamed'} — {p.email}</p>
                  <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                    Phone: {p.phone || 'N/A'} · Role: <span className="font-bold">{p.role}</span>
                    {p.admin_request_status === 'denied' && ' · Previous request denied'}
                  </p>
                </div>
                <button
                  onClick={() => toggleRole(p)}
                  className="text-xs uppercase tracking-wider border border-[var(--steel)] text-[var(--steel)] px-3 py-1.5 hover:bg-[var(--steel)] hover:text-white transition"
                >
                  Make {p.role === 'admin' ? 'Visitor' : 'Admin'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}