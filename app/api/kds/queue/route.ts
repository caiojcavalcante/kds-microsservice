// app/api/kds/queue/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ids = await redis.lrange("kds:queue", 0, -1);
    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const result = await pool.query(
      `SELECT o.*,
              json_agg(
                json_build_object(
                  'product_name', oi.product_name,
                  'quantity', oi.quantity,
                  'notes', oi.notes
                )
              ) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = ANY($1)
       GROUP BY o.id
       ORDER BY o.created_at ASC`,
      [ids]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao carregar fila da cozinha" },
      { status: 500 }
    );
  }
}
