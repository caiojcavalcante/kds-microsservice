// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await req.json();

  const { status, motoboy_name, motoboy_phone } = body;

  const allowed = [
    "PENDENTE",
    "EM_PREPARO",
    "PRONTO",
    "SAIU_ENTREGA",
    "ENTREGUE",
    "CANCELADO",
  ];

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: "Status inválido" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `
      UPDATE orders
      SET 
        status = $1,
        motoboy_name  = COALESCE($2, motoboy_name),
        motoboy_phone = COALESCE($3, motoboy_phone),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [status, motoboy_name ?? null, motoboy_phone ?? null, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Agora só some da fila quando realmente saiu da cozinha
    if (["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(status)) {
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
