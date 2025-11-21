// app/api/kds/queue/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  // Ajusta aqui a lógica de filtro da fila:
  // Exemplo: tudo que NÃO está finalizado/cancelado
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, code, table_number, customer_name, customer_phone, service_type, status, items, motoboy_name, motoboy_phone, created_at"
    )
    .not("status", "in", '("ENTREGUE","CANCELADO")')
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro na fila do KDS:", error.message);
    return NextResponse.json(
      { error: "Erro ao carregar fila" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
