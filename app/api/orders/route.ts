// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import redis from "@/lib/redis";
import { v4 as uuid } from "uuid";

export const dynamic = "force-dynamic"; // evita cache em edge

// Criar pedido (PDV) - POST /api/orders
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { table_number, customer_name, items, source } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza / valida items para garantir product_name
    const normalizedItems = items.map((item: any, index: number) => {
      const product_name =
        item.product_name?.toString().trim() ||
        item.name?.toString().trim() ||
        item.title?.toString().trim();

      if (!product_name) {
        throw new Error(
          `Item ${index + 1} sem product_name (envie product_name, name ou title no body)`
        );
      }

      return {
        product_name,
        quantity: item.quantity && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
        notes: item.notes ? String(item.notes) : null,
      };
    });

    const orderId = uuid();
    const code = "A" + Math.floor(100 + Math.random() * 900); // A123 etc
    const status = "PENDENTE"; // <-- agora em PT-BR

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO orders (id, code, table_number, customer_name, status, source)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, code, table_number || null, customer_name || null, status, source || "PDV"]
    );

    for (const item of normalizedItems) {
      const itemId = uuid();
      await client.query(
        `INSERT INTO order_items (id, order_id, product_name, quantity, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          itemId,
          orderId,
          item.product_name, // garantido não nulo
          item.quantity,
          item.notes,
        ]
      );
    }

    await client.query("COMMIT");

    // Empilha na fila do Redis
    await redis.rpush("kds:queue", orderId);

    return NextResponse.json({ id: orderId, code, status }, { status: 201 });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);

    // Se for erro de validação de item, já responde 400 mais claro
    if (err instanceof Error && err.message.includes("sem product_name")) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// Listagem de pedidos - GET /api/orders?status=PENDENTE
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = `SELECT * FROM orders`;
  const params: any[] = [];

  if (status) {
    query += ` WHERE status = $1 ORDER BY created_at DESC`;
    params.push(status);
  } else {
    query += ` ORDER BY created_at DESC`;
  }

  try {
    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao listar pedidos" },
      { status: 500 }
    );
  }
}
