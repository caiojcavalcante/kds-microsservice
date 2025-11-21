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
  customer_phone?: string | null;
  service_type?: "MESA" | "BALCAO" | "DELIVERY" | string;
  status: string;
  items: OrderItem[];
};

const COLUMNS: { key: string; title: string; description: string }[] = [
  {
    key: "PENDENTE",
    title: "Novos pedidos",
    description: "Ainda não iniciados",
  },
  {
    key: "EM_PREPARO",
    title: "Em preparo",
    description: "A cozinha está preparando",
  },
  {
    key: "PRONTO",
    title: "Prontos",
    description: "Aguardando retirada / entrega",
  },
  {
    key: "SAIU_ENTREGA",
    title: "Saiu para entrega",
    description: "Motoboy já está com o pedido",
  },
];

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadQueue() {
    const res = await fetch("/api/kds/queue", { cache: "no-store" });
    if (!res.ok) {
      console.error("Erro ao carregar fila:", await res.text());
      return;
    }
    const data = await res.json();
    setOrders(data);
  }

  async function updateStatus(
    id: string,
    status: string,
    extra?: Record<string, any>
  ) {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        ...extra,
      }),
    });

    if (!res.ok) {
      console.error("Erro ao atualizar status:", await res.text());
      alert("Erro ao atualizar status do pedido");
      return;
    }

    await loadQueue();
  }

  async function handleDeliveryWithDriver(order: Order) {
    if (order.service_type !== "DELIVERY") return;

    const motoboy_name = window.prompt("Nome do motoboy:");
    if (!motoboy_name) return;

    const motoboy_phone = window.prompt("Telefone / WhatsApp do motoboy:");
    if (!motoboy_phone) return;

    await updateStatus(order.id, "SAIU_ENTREGA", {
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
        return "text-orange-400";
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

  function renderServiceTag(order: Order) {
    if (order.service_type === "DELIVERY") {
      return (
        <span className="rounded bg-purple-900/40 border border-purple-500 px-2 py-1 text-[11px] font-semibold text-purple-200">
          DELIVERY
        </span>
      );
    }

    if (order.service_type === "BALCAO") {
      return (
        <span className="rounded bg-zinc-800 border border-zinc-600 px-2 py-1 text-[11px] font-semibold text-zinc-100">
          BALCÃO
        </span>
      );
    }

    if (order.table_number) {
      return (
        <span className="rounded bg-zinc-800 border border-zinc-600 px-2 py-1 text-[11px] font-semibold text-zinc-100">
          MESA {order.table_number}
        </span>
      );
    }

    return (
      <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-300">
        {order.service_type || "—"}
      </span>
    );
  }

  // tira ENTREGUE e CANCELADO da fila visual
  const activeOrders = orders.filter(
    (o) => o.status !== "ENTREGUE" && o.status !== "CANCELADO"
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cozinha - Fila de Pedidos</h1>
          <p className="text-xs text-zinc-500">
            Painel em tempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
          <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
            PENDENTE → EM_PREPARO → PRONTO → SAIU_ENTREGA → ENTREGUE
          </span>
        </div>
      </header>

      <section className="px-4 pb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colOrders = activeOrders.filter(
            (o) => o.status === col.key
          );

          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 min-h-[200px]"
            >
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    {col.title}
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    {col.description}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-950 border border-zinc-700 text-zinc-300">
                  {colOrders.length}
                </span>
              </div>

              <div className="p-3 flex-1 space-y-3 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className="text-[11px] text-zinc-600 italic border border-dashed border-zinc-700 rounded-lg px-3 py-4 text-center">
                    Nenhum pedido aqui.
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`rounded-lg bg-zinc-950 p-3 border-2 ${getBorderColor(
                        order.status
                      )}`}
                    >
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <div className="text-2xl font-bold text-zinc-100">
                          {order.code}
                        </div>
                        {renderServiceTag(order)}
                      </div>

                      <div className="text-[12px] text-zinc-400 mb-2">
                        Cliente:{" "}
                        <span className="text-zinc-100">
                          {order.customer_name || "-"}
                        </span>
                        {order.service_type === "DELIVERY" &&
                          order.customer_phone && (
                            <span className="block text-[11px] text-zinc-500">
                              {order.customer_phone}
                            </span>
                          )}
                      </div>

                      <hr className="my-2 border-zinc-800" />

                      <ul className="pl-4 list-disc space-y-1 text-sm">
                        {(order.items || []).map((i, idx) => (
                          <li key={idx}>
                            <span className="font-semibold">
                              {i.quantity}x
                            </span>{" "}
                            {i.product_name}{" "}
                            {i.notes && (
                              <span className="text-xs text-yellow-500 block">
                                {i.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      <hr className="my-2 border-zinc-800" />

                      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        Status:{" "}
                        <span className={getStatusColor(order.status)}>
                          {order.status}
                        </span>
                      </div>

                      {/* AÇÕES POR STATUS */}
                      <div className="flex flex-col gap-2">
                        {order.status === "PENDENTE" && (
                          <button
                            onClick={() =>
                              updateStatus(order.id, "EM_PREPARO")
                            }
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            Iniciar preparo
                          </button>
                        )}

                        {order.status === "EM_PREPARO" && (
                          <button
                            onClick={() => updateStatus(order.id, "PRONTO")}
                            className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-medium transition-colors"
                          >
                            Finalizar (pedido pronto)
                          </button>
                        )}

                        {order.status === "PRONTO" && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() =>
                                updateStatus(order.id, "ENTREGUE")
                              }
                              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-medium transition-colors"
                            >
                              Entregar ao cliente
                            </button>

                            {order.service_type === "DELIVERY" && (
                              <button
                                onClick={() =>
                                  handleDeliveryWithDriver(order)
                                }
                                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium transition-colors"
                              >
                                Entregar ao motoboy
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === "SAIU_ENTREGA" && (
                          <button
                            onClick={() =>
                              updateStatus(order.id, "ENTREGUE")
                            }
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                          >
                            Confirmar entrega ao cliente
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
