// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";

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
      billingType,
      encodedImage,
      copiaecola,
      invoiceUrl,
      payment,
    } = body;

    // Se items vier como string (comum em n8n/webhooks), tenta fazer o parse
    let parsedItems = items;
    if (typeof items === "string") {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        console.error("Erro ao fazer parse de items string:", e);
        parsedItems = []; // Falha na validação abaixo
      }
    }

    if (!parsedItems || !Array.isArray(parsedItems) || parsedItems.length === 0) {
      return NextResponse.json(
        { error: "Items obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza / valida items para garantir product_name
    const normalizedItems = (parsedItems as ItemInput[]).map(
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
          price: (item as any).price ? Number((item as any).price) : 0,
        };
      }
    );

    const phoneSuffix = customer_phone ? customer_phone.toString().slice(-3) : "000";
    const code = "FF" + phoneSuffix + Date.now().toString().slice(-3);
    const status = "PENDENTE";

    // --- DUPLICATE CHECK START ---
    // Busca pedidos pendentes com base no identificador disponível
    let duplicateQuery = supabase
      .from("orders")
      .select("*")
      .eq("status", "PENDENTE");

    // Prioriza table_number, senão usa customer_phone
    if (table_number) {
      duplicateQuery = duplicateQuery.eq("table_number", table_number);
    } else if (customer_phone) {
      duplicateQuery = duplicateQuery.eq("customer_phone", customer_phone);
    }
    // Se nem table_number nem customer_phone existem, não faz a query (evita match muito amplo)

    if (table_number || customer_phone) {
      const { data: existingOrders } = await duplicateQuery;

      if (existingOrders && existingOrders.length > 0) {
        for (const order of existingOrders) {
          // Check if items match
          if (areItemsEqual(order.items, normalizedItems)) {
            console.log(`Pedido duplicado detectado: ${order.id}`);
            return NextResponse.json(
              { id: order.id, code: order.code, status: order.status, items: order.items, message: "Pedido duplicado retornado" },
              { status: 200 } // Retorna 200 OK com o pedido existente
            );
          }
        }
      }
    }
    // --- DUPLICATE CHECK END ---

    const orderPayload = {
      code,
      table_number: table_number || null,
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      service_type: service_type || "MESA",
      status,
      source: source || "PDV",
      items: normalizedItems,
      billingType: billingType || null,
      encodedImage: encodedImage || null,
      copiaecola: copiaecola || null,
      invoiceUrl: invoiceUrl || null,
      payment: payment || null,
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

// Helper para comparar arrays de items
function areItemsEqual(itemsA: any[], itemsB: any[]): boolean {
  if (!itemsA || !itemsB) return false;
  if (itemsA.length !== itemsB.length) return false;

  // Sort by product_name to ensure order doesn't matter
  const sortFn = (a: any, b: any) => {
    const nameA = (a.product_name || "").toString().toLowerCase();
    const nameB = (b.product_name || "").toString().toLowerCase();
    return nameA.localeCompare(nameB);
  };

  const sortedA = [...itemsA].sort(sortFn);
  const sortedB = [...itemsB].sort(sortFn);

  for (let i = 0; i < sortedA.length; i++) {
    const itemA = sortedA[i];
    const itemB = sortedB[i];

    // Compare key fields
    if (itemA.product_name !== itemB.product_name) return false;
    if (Number(itemA.quantity) !== Number(itemB.quantity)) return false;

    // Normalize notes (null vs empty string)
    const notesA = (itemA.notes || "").trim();
    const notesB = (itemB.notes || "").trim();
    if (notesA !== notesB) return false;
  }

  return true;
}
