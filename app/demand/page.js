'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

const DEPARTMENTS = ['Stitching', 'Finishing', 'Cutting', 'FID', 'Office'];

export default function Demand() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    requestedBy: '',
    department: '',
    collectedBy: '',
    quantity: '',
    note: '',
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const selectedProduct = products.find((p) => p.id === Number(form.productId));

  function selectProduct(p) {
    updateForm('productId', p.id);
    setProductSearch(p.name);
    setShowDropdown(false);
  }

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchDemands();
    }
  }, [isAdmin]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.relative')) setShowDropdown(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  }

  async function fetchDemands() {
    const { data } = await supabase
      .from('demands')
      .select('*, products(name, unit)')
      .order('requested_at', { ascending: false });
    setDemands(data || []);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.productId || !form.requestedBy || !form.quantity) {
      toast.error('Fill product, requester, and quantity');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('demands').insert({
      product_id: form.productId,
      requested_by: form.requestedBy,
      department: form.department || null,
      collected_by: form.collectedBy || null,
      quantity_requested: Number(form.quantity),
      note: form.note || null,
    });

    setLoading(false);

    if (error) {
      toast.error('Something went wrong');
    } else {
      toast.success('Demand recorded');
      setForm({ productId: '', requestedBy: '', department: '', collectedBy: '', quantity: '', note: '' });
      setProductSearch('');
      fetchDemands();
    }
  }

  async function handleFulfill(demand) {
    const remaining = demand.quantity_requested - demand.quantity_fulfilled;

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', demand.product_id)
      .single();

    if (!product || product.quantity < remaining) {
      toast.error('Not enough stock to fulfill this amount');
      return;
    }

    const newFulfilled = demand.quantity_fulfilled + remaining;
    const newStatus = newFulfilled >= demand.quantity_requested ? 'fulfilled' : 'partial';

    const { error: productError } = await supabase
      .from('products')
      .update({ quantity: product.quantity - remaining })
      .eq('id', demand.product_id);

    if (productError) {
      toast.error('Could not update stock');
      return;
    }

    const { error: demandError } = await supabase
      .from('demands')
      .update({
        quantity_fulfilled: newFulfilled,
        status: newStatus,
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', demand.id);

    if (demandError) {
      toast.error('Could not update demand');
    } else {
      toast.success(`Fulfilled — status: ${newStatus}`);
      fetchDemands();
      fetchProducts();
    }
  }

  const statusColor = {
    pending: '#A63A2E',
    partial: '#B8862E',
    fulfilled: '#33566B',
  };

  if (authLoading) return <p>Loading…</p>;
  if (!isAdmin) return <p className="text-[var(--rust)]">Access denied — admins only.</p>;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Demand</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <form onSubmit={handleSubmit} className="stock-card p-5 pl-6 space-y-4 h-fit relative">
          <span className="stamp absolute top-3 right-3 text-[10px] px-2 py-0.5 text-[var(--brass)]">Request</span>

          <div className="relative">
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Product</label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowDropdown(true);
                if (form.productId) updateForm('productId', '');
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search product…"
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            />
            {showDropdown && productSearch && (
              <div className="absolute z-10 top-full left-0 right-0 bg-[var(--card)] border border-[var(--ink)]/20 max-h-48 overflow-y-auto mt-1">
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-[var(--ink)]/50 px-3 py-2">No products found</p>
                )}
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--steel)] hover:text-[var(--card)] transition"
                  >
                    {p.name} <span className="text-xs opacity-60">({p.quantity} {p.unit})</span>
                  </button>
                ))}
              </div>
            )}
            {selectedProduct && !showDropdown && (
              <p className="text-xs text-[var(--steel)] mt-1">
                Selected: {selectedProduct.name} — {selectedProduct.quantity} {selectedProduct.unit} available
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => updateForm('department', e.target.value)}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Requested By</label>
            <input
              type="text"
              value={form.requestedBy}
              onChange={(e) => updateForm('requestedBy', e.target.value)}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Collected By</label>
            <input
              type="text"
              value={form.collectedBy}
              onChange={(e) => updateForm('collectedBy', e.target.value)}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            />
          </div>

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
            <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Note (optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => updateForm('note', e.target.value)}
              rows={2}
              className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brass)] text-[var(--card)] font-display uppercase tracking-wider text-sm font-bold py-2.5 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Submit Demand'}
          </button>
        </form>

        <div className="space-y-3">
          {demands.length === 0 && (
            <p className="text-sm text-[var(--ink)]/50">No demands recorded yet.</p>
          )}
          {demands.map((d) => (
            <div key={d.id} className="stock-card p-4 pl-5 relative">
              <span
                className="stamp absolute top-3 right-3 text-[10px] px-2 py-0.5"
                style={{ color: statusColor[d.status] }}
              >
                {d.status}
              </span>
              <p className="font-display font-bold">{d.products?.name}</p>
              <p className="text-xs text-[var(--ink)]/60 mt-0.5">
                {d.requested_by}
                {d.department ? ` · ${d.department}` : ''}
                {d.collected_by ? ` · collected by ${d.collected_by}` : ''}
              </p>
              <p className="text-sm mt-2">
                {d.quantity_fulfilled} / {d.quantity_requested} {d.products?.unit} fulfilled
              </p>
              <div className="text-[11px] text-[var(--ink)]/50 mt-1">
                Requested: {formatDate(d.requested_at)}
                {d.fulfilled_at && ` · Fulfilled: ${formatDate(d.fulfilled_at)}`}
              </div>
              {d.note && <p className="text-xs text-[var(--ink)]/50 mt-1">{d.note}</p>}
              {d.status !== 'fulfilled' && (
                <button
                  onClick={() => handleFulfill(d)}
                  className="mt-3 text-xs uppercase tracking-wider text-[var(--steel)] border border-[var(--steel)] px-3 py-1.5 hover:bg-[var(--steel)] hover:text-[var(--card)] transition"
                >
                  Fulfill Remaining
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}