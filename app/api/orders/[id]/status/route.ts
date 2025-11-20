// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const allowed = ["PENDING", "IN_PREP", "READY", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: "Status inválido" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Se finalizou, remove da fila
    if (["READY", "DELIVERED", "CANCELLED"].includes(status)) {
      await redis.lrem("kds:queue", 0, id);
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}
