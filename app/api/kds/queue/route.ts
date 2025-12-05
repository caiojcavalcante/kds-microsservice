// app/api/kds/queue/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createServerClient();

  // Ajusta aqui a lógica de filtro da fila:
  // Exemplo: tudo que NÃO está finalizado/cancelado
  // Usamos SELECT * para ser resiliente a colunas que ainda não existem
  const { data, error } = await supabase
    .from("orders")
    .select("*")
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
