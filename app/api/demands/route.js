import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const demands = db
      .prepare(`
        SELECT
          d.*,
          p.name AS product_name,
          p.unit
        FROM demands d
        JOIN products p ON p.id = d.product_id
        ORDER BY d.requested_at DESC
      `)
      .all();

    return NextResponse.json(demands);
  } catch (error) {
    console.error('GET /api/demands error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch demands' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const {
      productId,
      requestedBy,
      department,
      collectedBy,
      quantity,
      note,
    } = await req.json();

    if (!productId || !requestedBy || !quantity) {
      return NextResponse.json(
        { error: 'Product, requester and quantity are required' },
        { status: 400 }
      );
    }

    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const quantityNumber = Number(quantity);

    if (quantityNumber <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    db.prepare(`
      INSERT INTO demands (
        product_id,
        requested_by,
        department,
        collected_by,
        quantity_requested,
        quantity_fulfilled,
        status,
        note,
        requested_at
      )
      VALUES (?, ?, ?, ?, ?, 0, 'pending', ?, datetime('now'))
    `).run(
      productId,
      requestedBy,
      department || null,
      collectedBy || null,
      quantityNumber,
      note || null
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('POST /api/demands error:', error);

    return NextResponse.json(
      { error: 'Failed to create demand' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { id, fulfillQuantity } = await req.json();

    if (!id || !fulfillQuantity || Number(fulfillQuantity) <= 0) {
      return NextResponse.json(
        { error: 'Valid demand ID and fulfill quantity are required' },
        { status: 400 }
      );
    }

    const quantity = Number(fulfillQuantity);

    const demand = db
      .prepare('SELECT * FROM demands WHERE id = ?')
      .get(id);

    if (!demand) {
      return NextResponse.json(
        { error: 'Demand not found' },
        { status: 404 }
      );
    }

    const remaining =
      demand.quantity_requested - demand.quantity_fulfilled;

    if (quantity > remaining) {
      return NextResponse.json(
        {
          error: `Only ${remaining} ${'units'} remaining in this demand`,
        },
        { status: 400 }
      );
    }

    const product = db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(demand.product_id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.quantity < quantity) {
      return NextResponse.json(
        {
          error: `Not enough stock. Available: ${product.quantity} ${product.unit}`,
        },
        { status: 400 }
      );
    }

    const newFulfilled =
      demand.quantity_fulfilled + quantity;

    const newStatus =
      newFulfilled >= demand.quantity_requested
        ? 'fulfilled'
        : 'partial';

    const transaction = db.transaction(() => {
      // Reduce product stock
      db.prepare(`
        UPDATE products
        SET quantity = quantity - ?
        WHERE id = ?
      `).run(quantity, demand.product_id);

      // Update demand
      db.prepare(`
        UPDATE demands
        SET
          quantity_fulfilled = ?,
          status = ?,
          fulfilled_at = CASE
            WHEN ? = 'fulfilled'
            THEN datetime('now')
            ELSE fulfilled_at
          END
        WHERE id = ?
      `).run(
        newFulfilled,
        newStatus,
        newStatus,
        id
      );
    });

    transaction();

    return NextResponse.json({
      success: true,
      status: newStatus,
    });

  } catch (error) {
    console.error('PATCH /api/demands error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}