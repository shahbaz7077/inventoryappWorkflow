import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const sales = db.prepare(`
    SELECT s.id, s.quantity, s.amount, s.sold_at, p.name as product_name
    FROM sales s
    JOIN products p ON p.id = s.product_id
    ORDER BY s.sold_at DESC
  `).all();
  return NextResponse.json(sales);
}

export async function POST(req) {
  const { productId, quantity, amount } = await req.json();

  if (!productId || !quantity || !amount) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  if (product.quantity < quantity) {
    return NextResponse.json({ error: 'Not enough stock' }, { status: 400 });
  }

  const insertSale = db.prepare(`
    INSERT INTO sales (product_id, quantity, amount, sold_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  const updateStock = db.prepare(`
    UPDATE products SET quantity = quantity - ? WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    insertSale.run(productId, quantity, amount);
    updateStock.run(quantity, productId);
  });
  transaction();

  return NextResponse.json({ success: true });
}