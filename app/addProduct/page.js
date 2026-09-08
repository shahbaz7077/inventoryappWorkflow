'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';

export default function AddProduct() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', unit: 'pcs', quantity: '', price: '' });

  useEffect(() => {
    if (isAdmin) fetchProducts();
  }, [isAdmin]);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setProducts(data);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.quantity) {
      toast.error('Name and quantity required');
      return;
    }
    const quantityNum = Number(form.quantity);
    if (quantityNum <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setLoading(true);

    const { data: existing } = await supabase
      .from('products')
      .select('*')
      .ilike('name', form.name)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('products')
        .update({ quantity: existing.quantity + quantityNum })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('products').insert({
        name: form.name,
        unit: form.unit || 'pcs',
        quantity: quantityNum,
        price: Number(form.price) || 0,
      }));
    }

    setLoading(false);

    if (error) {
      toast.error('Something went wrong');
    } else {
      toast.success(existing ? 'Added to existing stock' : 'New product added');
      setForm({ name: '', unit: 'pcs', quantity: '', price: '' });
      fetchProducts();
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        toast.error('Cannot delete — this product has sales or demand history.');
      } else {
        toast.error('Could not delete product');
      }
    } else {
      toast.success('Product removed');
      fetchProducts();
    }
    setConfirmDeleteId(null);
  }

  if (authLoading) return <p>Loading…</p>;
  if (!isAdmin) return <p className="text-[var(--rust)]">Access denied — admins only.</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Add Product</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <form onSubmit={handleSubmit} className="stock-card p-5 pl-6 space-y-4 h-fit relative">
          <span className="stamp absolute top-3 right-3 text-[10px] px-2 py-0.5 text-[var(--brass)]">New Entry</span>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
              placeholder="e.g. Zipper — 12mm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => updateForm('quantity', e.target.value)}
                className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => updateForm('unit', e.target.value)}
                className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Price (optional)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => updateForm('price', e.target.value)}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--steel)] text-[var(--card)] font-display uppercase tracking-wider text-sm font-bold py-2.5 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Add to Stock'}
          </button>
        </form>

        <div className="space-y-3">
          {products.length === 0 && (
            <p className="text-sm text-[var(--ink)]/50">No products yet — add your first one.</p>
          )}
          {products.map((p) => (
            <div key={p.id} className="stock-card p-4 pl-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display font-bold break-words">{p.name}</p>
                <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                  {p.quantity} {p.unit} {p.price ? `· Rs ${p.price}` : ''}
                </p>
              </div>

              {confirmDeleteId === p.id ? (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs uppercase tracking-wider bg-[var(--rust)] text-[var(--card)] px-3 py-1.5 hover:opacity-90 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs uppercase tracking-wider text-[var(--ink)]/60 border border-[var(--ink)]/20 px-3 py-1.5 hover:bg-[var(--ink)]/5 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(p.id)}
                  className="text-xs uppercase tracking-wider text-[var(--rust)] border border-[var(--rust)] px-3 py-1.5 hover:bg-[var(--rust)] hover:text-[var(--card)] transition shrink-0 self-start sm:self-auto"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}