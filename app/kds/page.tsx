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
    <main className="min-h-screen bg-zinc-950 text-white">
      <h1 className="p-4 text-3xl font-bold">Cozinha - Fila de Pedidos</h1>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-lg bg-zinc-900 p-4 border-2 ${
              order.status === "IN_PREP"
                ? "border-orange-500"
                : "border-zinc-800"
            }`}
          >
            <div className="mb-2 text-2xl font-bold text-zinc-100">
              {order.code}
            </div>
            <div className="text-zinc-400">Mesa: <span className="text-white">{order.table_number || "-"}</span></div>
            <div className="text-zinc-400">Cliente: <span className="text-white">{order.customer_name || "-"}</span></div>
            <hr className="my-3 border-zinc-700" />
            <ul className="pl-4 list-disc space-y-1">
              {(order.items || []).map((i, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{i.quantity}x</span> {i.product_name}{" "}
                  {i.notes && <span className="text-sm text-yellow-500 block">{i.notes}</span>}
                </li>
              ))}
            </ul>
            <hr className="my-3 border-zinc-700" />
            <div className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Status: <span className={order.status === "IN_PREP" ? "text-orange-500" : "text-zinc-300"}>{order.status}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(order.id, "IN_PREP")}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
              >
                Iniciar
              </button>
              <button 
                onClick={() => updateStatus(order.id, "READY")}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
              >
                Finalizar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
