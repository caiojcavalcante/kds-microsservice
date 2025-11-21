// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic"; // evita cache em edge

type ItemInput = {
  product_name?: string;
  name?: string;
  title?: string;
  quantity?: number | string;
  notes?: string;
};

// Criar pedido (PDV) - POST /api/orders
export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  try {
    const body = await req.json();
    const {
      table_number,
      customer_name,
      customer_phone,
      service_type,
      items,
      source,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza / valida items para garantir product_name
    const normalizedItems = (items as ItemInput[]).map(
      (item: ItemInput, index: number) => {
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
          quantity:
            item.quantity && Number(item.quantity) > 0
              ? Number(item.quantity)
              : 1,
          notes: item.notes ? String(item.notes) : null,
        };
      }
    );

    // Ex: A123
    const code = "A" + Math.floor(100 + Math.random() * 900);
    const status = "PENDENTE";

    const orderPayload = {
      code,
      table_number: table_number || null,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      service_type: service_type || "MESA",
      status,
      source: source || "PDV",
      items: normalizedItems,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id, code, status")
      .single();

    if (error) {
      console.error("Erro ao criar pedido:", error.message);
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 }
      );
    }

    // Nada de Redis: o KDS vai ler direto do Supabase via /api/kds/queue
    return NextResponse.json(
      { id: data.id, code: data.code, status: data.status },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);

    if (
      err instanceof Error &&
      err.message.includes("sem product_name")
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}

// Listagem de pedidos - GET /api/orders?status=PENDENTE
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("orders")
    .select(
      "id, code, table_number, customer_name, customer_phone, service_type, status, items, source, motoboy_name, motoboy_phone, created_at"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar pedidos:", error.message);
    return NextResponse.json(
      { error: "Erro ao listar pedidos" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
