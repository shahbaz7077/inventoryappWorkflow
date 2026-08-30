'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const DEPARTMENTS = ['Stitching', 'Finishing', 'Cutting', 'FID', 'Office'];

const statusColor = {
  pending: '#A63A2E',
  partial: '#B8862E',
  fulfilled: '#33566B',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Demand() {
  const [products, setProducts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    requestedBy: '',
    department: '',
    collectedBy: '',
    quantity: '',
    note: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

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
    fetchProducts();
    fetchDemands();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.relative')) setShowDropdown(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  }

  async function fetchDemands() {
    const res = await fetch('/api/demands');
    setDemands(await res.json());
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
    const res = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (res.ok) {
      toast.success('Demand recorded');
      setForm({ productId: '', requestedBy: '', department: '', collectedBy: '', quantity: '', note: '' });
      setProductSearch('');
      fetchDemands();
    } else {
      toast.error('Something went wrong');
    }
  }

  async function handleFulfill(demand) {
    const remaining = demand.quantity_requested - demand.quantity_fulfilled;
    const res = await fetch('/api/demands', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: demand.id, fulfillQuantity: remaining }),
    });
    const data = await res.json();

    if (res.ok) {
      toast.success(`Fulfilled — status: ${data.status}`);
      fetchDemands();
      fetchProducts();
    } else {
      toast.error(data.error || 'Could not fulfill');
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 mb-8">
        Demand
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">
        {/* Request form */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white border border-slate-100 shadow-xl shadow-slate-100/70 rounded-2xl p-6 space-y-5 h-fit transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50"
        >
          <span className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200/60">
            Request
          </span>

          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Product
            </label>
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />

            {showDropdown && productSearch && (
              <div className="absolute z-10 top-full left-0 right-0 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-2 divide-y divide-slate-50">
                {filteredProducts.length === 0 && (
                  <p className="text-xs font-medium text-slate-400 px-4 py-3">
                    No products found
                  </p>
                )}
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition duration-150"
                  >
                    {p.name} <span className="text-xs text-slate-400 font-normal">({p.quantity} {p.unit})</span>
                  </button>
                ))}
              </div>
            )}

            {selectedProduct && !showDropdown && (
              <p className="text-xs font-semibold text-emerald-600 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100/50 mt-2">
                Selected: {selectedProduct.name} — {selectedProduct.quantity} {selectedProduct.unit} available
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Department
            </label>
            <select
              value={form.department}
              onChange={(e) => updateForm('department', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 appearance-none"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Requested By
            </label>
            <input
              type="text"
              value={form.requestedBy}
              onChange={(e) => updateForm('requestedBy', e.target.value)}
              placeholder="Name of person requesting"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
              Collected By
            </label>
            <input
              type="text"
              value={form.collectedBy}
              onChange={(e) => updateForm('collectedBy', e.target.value)}
              placeholder="Name of person taking the goods"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

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
              Note (optional)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => updateForm('note', e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white font-medium rounded-xl text-sm py-3.5 shadow-lg shadow-amber-600/10 hover:bg-amber-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Saving…' : 'Submit Demand'}
          </button>
        </form>

        {/* Demand list */}
        <div className="space-y-3.5">
          {demands.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-medium text-slate-400">
                No demands recorded yet.
              </p>
            </div>
          )}
          {demands.map((d) => (
            <div
              key={d.id}
              className="relative bg-white border border-slate-100 shadow-sm shadow-slate-100 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-slate-200/60"
            >
              <span
                className="absolute top-4 right-4 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border"
                style={{
                  color: statusColor[d.status],
                  borderColor: `${statusColor[d.status]}30`,
                  backgroundColor: `${statusColor[d.status]}08`,
                }}
              >
                {d.status}
              </span>

              <p className="font-semibold text-slate-800 text-base pr-20">{d.product_name}</p>

              <p className="text-xs font-medium text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-slate-700 font-semibold">{d.requested_by}</span>
                {d.department && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium text-[11px]">{d.department}</span>
                  </>
                )}
                {d.collected_by && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">collected by <span className="text-slate-600 font-semibold">{d.collected_by}</span></span>
                  </>
                )}
              </p>

              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  Fulfilled: <span className="font-bold text-slate-800">{d.quantity_fulfilled}</span> / {d.quantity_requested} <span className="text-xs text-slate-400 font-normal">{d.unit}</span>
                </p>
                <span className={`h-2 w-2 rounded-full ${d.quantity_fulfilled === d.quantity_requested ? 'bg-emerald-500' : d.quantity_fulfilled > 0 ? 'bg-amber-500' : 'bg-slate-200'}`} />
              </div>

              <div className="text-[11px] font-medium text-slate-400 mt-3 flex items-center gap-1.5">
                <span>Requested: {formatDate(d.requested_at)}</span>
                {d.fulfilled_at && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-600">Fulfilled: {formatDate(d.fulfilled_at)}</span>
                  </>
                )}
              </div>

              {d.note && (
                <p className="text-xs font-medium text-slate-500 bg-slate-50/50 border border-slate-100 rounded-lg p-2.5 mt-3 italic">
                  "{d.note}"
                </p>
              )}

              {d.status !== 'fulfilled' && (
                <button
                  onClick={() => handleFulfill(d)}
                  className="mt-3 text-xs font-semibold uppercase tracking-wider text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-600 hover:text-white transition"
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