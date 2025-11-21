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
  status: string; // PENDENTE | EM_PREPARO | PRONTO | SAIU_ENTREGA | ENTREGUE | CANCELADO
  items: OrderItem[];
};

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadQueue() {
    const res = await fetch("/api/kds/queue", { cache: "no-store" });
    const data = await res.json();
    setOrders(data);
  }

  async function updateStatus(
    id: string,
    status: string,
    extra?: Record<string, any>
  ) {
    await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...extra,
      }),
    });
    await loadQueue();
  }

  async function handleDeliveryWithDriver(orderId: string) {
    const motoboy_name = window.prompt("Nome do motoboy:");
    if (!motoboy_name) return;

    const motoboy_phone = window.prompt("Telefone / WhatsApp do motoboy:");
    if (!motoboy_phone) return;

    await updateStatus(orderId, "SAIU_ENTREGA", {
      motoboy_name,
      motoboy_phone,
    });
  }

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  function getStatusColor(status: string) {
    switch (status) {
      case "EM_PREPARO":
        return "text-orange-500";
      case "PRONTO":
        return "text-emerald-400";
      case "SAIU_ENTREGA":
        return "text-purple-400";
      case "ENTREGUE":
        return "text-blue-400";
      case "CANCELADO":
        return "text-red-400";
      default:
        return "text-zinc-300";
    }
  }

  function getBorderColor(status: string) {
    switch (status) {
      case "EM_PREPARO":
        return "border-orange-500";
      case "PRONTO":
        return "border-emerald-500";
      case "SAIU_ENTREGA":
        return "border-purple-500";
      case "ENTREGUE":
        return "border-blue-500";
      case "CANCELADO":
        return "border-red-500";
      default:
        return "border-zinc-800";
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <h1 className="p-4 text-3xl font-bold">Cozinha - Fila de Pedidos</h1>

      {/* Só pra deixar explícito os allowed do backend */}
      <p className="px-4 text-xs text-zinc-500">
        Status permitidos: PENDENTE, EM_PREPARO, PRONTO, SAIU_ENTREGA, ENTREGUE, CANCELADO
      </p>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-lg bg-zinc-900 p-4 border-2 ${getBorderColor(
              order.status
            )}`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-zinc-100">
                {order.code}
              </div>
              {order.table_number && (
                <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-200">
                  MESA {order.table_number}
                </span>
              )}
            </div>

            <div className="text-zinc-400">
              Cliente:{" "}
              <span className="text-white">
                {order.customer_name || "-"}
              </span>
            </div>

            <hr className="my-3 border-zinc-700" />

            <ul className="pl-4 list-disc space-y-1">
              {(order.items || []).map((i, idx) => (
                <li key={idx}>
                  <span className="font-semibold">{i.quantity}x</span>{" "}
                  {i.product_name}{" "}
                  {i.notes && (
                    <span className="text-sm text-yellow-500 block">
                      {i.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <hr className="my-3 border-zinc-700" />

            <div className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Status:{" "}
              <span className={getStatusColor(order.status)}>
                {order.status}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {order.status === "PENDENTE" && (
                <button
                  onClick={() => updateStatus(order.id, "EM_PREPARO")}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
                >
                  Iniciar preparo
                </button>
              )}

              {order.status === "EM_PREPARO" && (
                <button
                  onClick={() => updateStatus(order.id, "PRONTO")}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
                >
                  Finalizar (Pedido pronto)
                </button>
              )}

              {order.status === "PRONTO" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(order.id, "ENTREGUE")}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-sm font-medium transition-colors"
                  >
                    Entregar ao cliente
                  </button>
                  <button
                    onClick={() => handleDeliveryWithDriver(order.id)}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                  >
                    Entregar ao motoboy
                  </button>
                </div>
              )}

              {(order.status === "ENTREGUE" ||
                order.status === "SAIU_ENTREGA" ||
                order.status === "CANCELADO") && (
                <span className="text-xs text-zinc-500 text-center">
                  Pedido finalizado.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
