// app/api/orders/route.ts (só a parte do POST que importa aqui)

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const {
      table_number,
      customer_name,
      customer_phone,
      phone,
      items,
      source,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items obrigatórios" },
        { status: 400 }
      );
    }

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
        quantity:
          item.quantity && Number(item.quantity) > 0
            ? Number(item.quantity)
            : 1,
        notes: item.notes ? String(item.notes) : null,
      };
    });

    const orderId = uuid();
    const code = "A" + Math.floor(100 + Math.random() * 900);
    const status = "PENDENTE";

    const phoneValue: string | null =
      (customer_phone ?? phone)?.toString().trim() || null;

    // 🔑 regra de negócio: se não vier mesa ou vier "0" => DELIVERY
    const isDelivery =
      !table_number || table_number === "0" || table_number === 0;

    const service_type = isDelivery ? "DELIVERY" : "MESA";

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO orders (
         id,
         code,
         table_number,
         customer_name,
         customer_phone,
         status,
         source,
         service_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        code,
        isDelivery ? null : table_number || null, // mesa só para MESA
        customer_name || null,
        phoneValue,
        status,
        source || "PDV",
        service_type,
      ]
    );

    for (const item of normalizedItems) {
      const itemId = uuid();
      await client.query(
        `INSERT INTO order_items (id, order_id, product_name, quantity, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          itemId,
          orderId,
          item.product_name,
          item.quantity,
          item.notes,
        ]
      );
    }

    await client.query("COMMIT");
    await redis.rpush("kds:queue", orderId);

    return NextResponse.json(
      { id: orderId, code, status, service_type },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);

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
