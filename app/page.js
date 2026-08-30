'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';

export default function Dashboard() {
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function statusFor(p) {
    if (p.quantity <= 0) {
      return {
        label: 'Out of Stock',
        bg: 'bg-[var(--rust)]/10 text-[var(--rust)] border-[var(--rust)]/20',
        rail: 'bg-[var(--rust)]',
      };
    }
    if (p.quantity <= (p.reorder_level || 10)) {
      return {
        label: 'Low Stock',
        bg: 'bg-[var(--brass)]/10 text-[var(--brass)] border-[var(--brass)]/20 animate-pulse',
        rail: 'bg-[var(--brass)]',
      };
    }
    return {
      label: 'In Stock',
      bg: 'bg-[var(--steel)]/10 text-[var(--steel)] border-[var(--steel)]/20',
      rail: 'bg-[var(--steel)]/30',
    };
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--ink)]/10 pb-5">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight uppercase text-[var(--ink)]">
            Dashboard
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink)]/50 mt-1">
            Real-time material registry & volume tracking
          </p>

          {!authLoading && !isAdmin && profile?.admin_request_status === 'none' && (
            
          <a    href="/request-admin"
              className="mt-4 inline-block text-xs uppercase tracking-wider border border-[var(--brass)] text-[var(--brass)] px-4 py-2 hover:bg-[var(--brass)] hover:text-white transition"
            >
              Login as Admin
            </a>
          )}

          {!isAdmin && profile?.admin_request_status === 'pending' && (
            <p className="mt-4 text-xs text-[var(--brass)]">
              Admin request pending approval…
            </p>
          )}
        </div>

        <div className="bg-[var(--steel)]/5 px-4 py-2 border border-[var(--steel)]/10 h-fit w-fit rounded-sm shadow-inner">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--ink)]/70">
            Active SKUs:{' '}
            <b className="text-[var(--steel)] ml-1 font-bold text-sm">
              {products.length}
            </b>
          </span>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 border border-[var(--ink)]/10 bg-[var(--card)]/30 rounded-sm">
          <p className="text-sm font-mono uppercase tracking-wider text-[var(--ink)]/40 animate-pulse">
            Querying local manifest...
          </p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="border-2 border-dashed border-[var(--ink)]/20 bg-[var(--card)] p-12 text-center max-w-xl mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
          <p className="font-display font-extrabold text-xl uppercase tracking-wide text-[var(--ink)] mb-2">
            No stock on record
          </p>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink)]/60 mb-5">
            The database registry is currently clean.
          </p>
          {isAdmin && (
            <Link
              href="/addProduct"
              className="inline-block bg-[var(--steel)] text-white font-display uppercase tracking-widest text-xs font-black py-3 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Log First Item
            </Link>
          )}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const status = statusFor(p);
            return (
              <div
                key={p.id}
                className="group relative bg-[var(--card)] border border-[var(--ink)]/10 hover:border-[var(--ink)]/30 p-5 pl-6 flex flex-col justify-between transition-all duration-150 shadow-sm hover:shadow-md rounded-xs overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.rail}`} />
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest text-[var(--ink)]/40 group-hover:text-[var(--steel)]/70 transition-colors">
                      Nomenclature
                    </p>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 border ${status.bg} rounded-sm`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="font-display font-extrabold text-lg tracking-wide text-[var(--ink)] uppercase truncate">
                    {p.name}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[var(--ink)]/5 flex items-baseline justify-between">
                  <p className="font-display text-4xl font-black tracking-tight text-[var(--ink)]">
                    {p.quantity}
                    <span className="text-xs font-mono font-bold tracking-widest uppercase ml-1.5 text-[var(--ink)]/40">
                      {p.unit}
                    </span>
                  </p>
                  {p.price && (
                    <p className="text-xs font-mono font-semibold text-[var(--ink)]/50">
                      Rs. {Number(p.price).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[var(--ink)]/40">
                  <span>ID: #{String(p.id).padStart(4, '0')}</span>
                  <span>Updated: {formatDate(p.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div> 
  );
}