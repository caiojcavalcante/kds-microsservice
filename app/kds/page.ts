"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  product_name: string;
  quantity: number;
  notes?: string | null;
};

type Order = {
  id: string;
  code: string;
  table_number?: string | null;
  customer_name?: string | null;
  status: string;
  items: OrderItem[];
};

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadQueue() {
    const res = await fetch("/api/kds/queue", { cache: "no-store" });
    const data = await res.json();
    setOrders(data);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadQueue();
  }

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ background: "#111", color: "#fff", minHeight: "100vh" }}>
      <h1 style={{ padding: "16px" }}>Cozinha - Fila de Pedidos</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          padding: 16
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              background: "#222",
              borderRadius: 8,
              padding: 16,
              border:
                order.status === "IN_PREP"
                  ? "2px solid orange"
                  : "2px solid #333"
            }}
          >
            <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>
              {order.code}
            </div>
            <div>Mesa: {order.table_number || "-"}</div>
            <div>Cliente: {order.customer_name || "-"}</div>
            <hr style={{ margin: "8px 0" }} />
            <ul style={{ paddingLeft: 16 }}>
              {(order.items || []).map((i, idx) => (
                <li key={idx}>
                  {i.quantity}x {i.product_name}{" "}
                  <small>{i.notes || ""}</small>
                </li>
              ))}
            </ul>
            <hr style={{ margin: "8px 0" }} />
            <div style={{ marginBottom: 8 }}>Status: {order.status}</div>
            <button
              onClick={() => updateStatus(order.id, "IN_PREP")}
              style={{ marginRight: 8 }}
            >
              Iniciar preparo
            </button>
            <button onClick={() => updateStatus(order.id, "READY")}>
              Finalizar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
