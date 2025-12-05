// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 👈 desestrutura o params (Promise)

  const supabase = createServerClient();
  const body = await request.json();

  const { status, ...extra } = body || {};

  if (!status) {
    return NextResponse.json(
      { error: "Status é obrigatório" },
      { status: 400 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { error: "ID do pedido é obrigatório" },
      { status: 400 }
    );
  }

  // Campos permitidos para atualização
  const allowedExtras = ['motoboy_name', 'motoboy_phone', 'payment_status', 'delivered_by_id', 'delivered_by_name', 'delivered_at'];
  const filteredExtra: Record<string, any> = {};
  for (const key of allowedExtras) {
    if (extra[key] !== undefined) {
      filteredExtra[key] = extra[key];
    }
  }

  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
    ...filteredExtra,
  };

  const { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar status:", error.message);
    return NextResponse.json(
      { error: "Erro ao atualizar status do pedido" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
