'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    setProducts(await res.json());
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectProduct(p) {
    setSelected(p);
    setQuantity('');
    setAmount('');
  }

  async function handleSell(e) {
    e.preventDefault();
    if (!selected || !quantity || !amount) {
      toast.error('Fill quantity and amount');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selected.id, quantity: Number(quantity), amount: Number(amount) }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success(`Sold ${quantity} ${selected.unit} of ${selected.name}`);
      setSelected(null);
      setQuantity('');
      setAmount('');
      fetchProducts();
    } else {
      toast.error(data.error || 'Something went wrong');
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Sales</h1>

      <input
        type="text"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md bg-[var(--card)] border border-[var(--ink)]/20 px-3 py-2 text-sm mb-6 focus:outline-none focus:border-[var(--steel)]"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProduct(p)}
              className={`stock-card p-4 pl-5 text-left transition ${
                selected?.id === p.id ? 'ring-2 ring-[var(--steel)]' : ''
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-[var(--ink)]/60">{p.name}</p>
              <p className="font-display text-3xl font-bold mt-1">
                {p.quantity} <span className="text-sm font-normal text-[var(--ink)]/50">{p.unit}</span>
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--ink)]/50">No products match your search.</p>
          )}
        </div>

        {selected && (
          <form onSubmit={handleSell} className="stock-card p-5 pl-6 space-y-4 h-fit">
            <span className="stamp absolute top-3 right-3 text-[10px] px-2 py-0.5 text-[var(--rust)]">Sell</span>
            <p className="font-display font-bold">{selected.name}</p>
            <p className="text-xs text-[var(--ink)]/50">Available: {selected.quantity} {selected.unit}</p>

            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Quantity Sold</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                max={selected.quantity}
                className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink)]/60 mb-1">Amount (Rs)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[var(--paper)] border border-[var(--ink)]/20 px-3 py-2 text-sm focus:outline-none focus:border-[var(--steel)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--rust)] text-[var(--card)] font-display uppercase tracking-wider text-sm font-bold py-2.5 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Recording…' : 'Mark as Sold'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}