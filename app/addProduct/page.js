'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AddProduct() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'pcs', quantity: '', price: '' });
 const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
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
    setLoading(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast.success('Product added');
      setForm({ name: '', unit: 'pcs', quantity: '', price: '' });
      fetchProducts();
    } else {
      toast.error('Something went wrong');
    }
    
  }
async function handleDelete(id) {
  const res = await fetch('/api/products', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();

  if (res.ok) {
    toast.success('Product removed');
    fetchProducts();
  } else {
    toast.error(data.error || 'Could not delete product');
  }
  setConfirmDeleteId(null); // reset after either outcome
}

  return (<div>
  <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 mb-8">
    Add Product
  </h1>

  <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">
    {/* Form — Styled with a modern elevated card design */}
    <form 
      onSubmit={handleSubmit} 
      className="relative bg-white border border-slate-100 shadow-xl shadow-slate-100/70 rounded-2xl p-6 space-y-5 h-fit transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50"
    >
      <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200/60">
        New Entry
      </span>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
          Product Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          placeholder="e.g. Zipper — 12mm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
            Quantity
          </label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => updateForm('quantity', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
            Unit
          </label>
          <input
            type="text"
            value={form.unit}
            onChange={(e) => updateForm('unit', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
          Price (optional)
        </label>
        <div className="relative">
          <input
            type="number"
            value={form.price}
            onChange={(e) => updateForm('price', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white font-medium rounded-xl text-sm py-3.5 shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? 'Saving…' : 'Add to Stock'}
      </button>
    </form>

    {/* Product list — Styled with clean row items and glass-like components */}
    <div className="space-y-3.5">
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-medium text-slate-400">
            No products yet — add your first one.
          </p>
        </div>
      )}
      {products.map((p) => (
        <div 
          key={p.id} 
          className="bg-white border border-slate-100 shadow-sm shadow-slate-100 rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-200/60"
        >
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">{p.name}</p>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                {p.quantity} {p.unit}
              </span>
              {p.price && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-indigo-600 font-semibold">Rs {p.price}</span>
                </>
              )}
            </p>
          </div>
          
          {confirmDeleteId === p.id ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs font-bold uppercase tracking-wider bg-rose-600 text-white px-3.5 py-2 rounded-lg hover:bg-rose-700 active:scale-95 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3.5 py-2 rounded-lg hover:bg-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(p.id)}
              className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-lg hover:bg-rose-600 hover:text-white active:scale-95 transition-all duration-200"
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