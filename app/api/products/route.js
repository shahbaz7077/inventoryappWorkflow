import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const products = db
      .prepare('SELECT * FROM products ORDER BY created_at DESC')
      .all();

    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { name, unit, quantity, price } = await req.json();

    if (!name || quantity === undefined) {
      return NextResponse.json(
        { error: 'Name and quantity are required' },
        { status: 400 }
      );
    }

    const quantityNumber = Number(quantity);

    if (quantityNumber <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Case-insensitive match so "Zipper" and "zipper" merge into one row
    const existing = db
      .prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)')
      .get(name);

    if (existing) {
      // Same product already exists — add to its stock instead of duplicating
      db.prepare(`
        UPDATE products
        SET quantity = quantity + ?
        WHERE id = ?
      `).run(quantityNumber, existing.id);

      return NextResponse.json({
        success: true,
        merged: true,
        productId: existing.id,
      });
    }

    // New product — insert fresh
    const result = db.prepare(`
      INSERT INTO products (name, unit, quantity, price, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(name, unit || 'pcs', quantityNumber, price || 0);

    return NextResponse.json({
      success: true,
      merged: false,
      productId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const hasSales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE product_id = ?').get(id);
    const hasDemands = db.prepare('SELECT COUNT(*) as count FROM demands WHERE product_id = ?').get(id);

    if (hasSales.count > 0 || hasDemands.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete — this product has sales or demand history.' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}