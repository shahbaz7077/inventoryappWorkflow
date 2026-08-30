'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

export default function Dashboard() {
  const { profile, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data);
    setLoading(false);
  }

  function statusFor(p) {
    if (p.quantity <= 0) return { label: 'Out', color: 'var(--rust)' };
    if (p.quantity <= 10) return { label: 'Low', color: 'var(--brass)' };
    return { label: 'In Stock', color: 'var(--steel)' };
  }

  async function submitAdminRequest(e) {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      toast.error('Enter a username and password');
      return;
    }
    setSubmitting(true);
    const hash = bcrypt.hashSync(adminPassword, 10);

    const { error } = await supabase
      .from('profiles')
      .update({
        admin_request_status: 'pending',
        requested_admin_username: adminUsername,
        requested_admin_password_hash: hash,
      })
      .eq('id', profile.id);

    setSubmitting(false);

    if (error) {
      toast.error('Could not submit request');
    } else {
      toast.success('Admin access requested — waiting for approval');
      setShowRequestForm(false);
      refreshProfile();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <span className="text-xs uppercase tracking-widest text-[var(--ink)]/50">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!authLoading && !isAdmin && profile?.admin_request_status === 'none' && !showRequestForm && (
        <button
          onClick={() => setShowRequestForm(true)}
          className="mb-6 text-xs uppercase tracking-wider border border-[var(--brass)] text-[var(--brass)] px-4 py-2 hover:bg-[var(--brass)] hover:text-white transition"
        >
          Login as Admin
        </button>
      )}

      {!isAdmin && profile?.admin_request_status === 'pending' && (
        <p className="mb-6 text-xs text-[var(--brass)]">Admin request pending approval…</p>
      )}

      {showRequestForm && (
        <form onSubmit={submitAdminRequest} className="stock-card p-5 mb-6 space-y-3 max-w-sm">
          <p className="text-xs uppercase tracking-widest text-[var(--ink)]/60">Request Admin Access</p>
          <input
            type="text"
            placeholder="Choose a username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Choose a password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[var(--brass)] text-white py-2 text-sm font-display uppercase tracking-wider disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-[var(--ink)]/50">Loading…</p>}

      {!loading && products.length === 0 && (
        <div className="stock-card p-8 text-center">
          <p className="font-display text-lg mb-1">No stock on record</p>
          {isAdmin && (
            <p className="text-sm text-[var(--ink)]/50">
              Head to <a href="/addProduct" className="text-[var(--steel)] underline">Add Product</a> to log your first item.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const status = statusFor(p);
          return (
            <div key={p.id} className="stock-card p-4 pl-5 relative">
              <span
                className="stamp absolute top-3 right-3 text-[10px] px-2 py-0.5"
                style={{ color: status.color }}
              >
                {status.label}
              </span>
              <p className="text-xs uppercase tracking-widest text-[var(--ink)]/60">{p.name}</p>
              <p className="font-display text-4xl font-bold mt-1">
                {p.quantity}
                <span className="text-sm font-normal ml-1 text-[var(--ink)]/50">{p.unit}</span>
              </p>
              <p className="text-xs mt-2 text-[var(--ink)]/50">
                Last update: {formatDate(p.created_at)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}