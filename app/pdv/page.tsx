"use client";

import { useState } from "react";

type ItemForm = {
  product_name: string;
  quantity: number;
  notes: string;
};

type ServiceType = "MESA" | "BALCAO" | "DELIVERY";

export default function PdvPage() {
  const [serviceType, setServiceType] = useState<ServiceType>("MESA");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ItemForm[]>([
    { product_name: "", quantity: 1, notes: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) || 1 : value,
            }
          : item
      )
    );
  }

  function incrementQty(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  function decrementQty(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { product_name: "", quantity: 1, notes: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev; // nunca deixa sem linha
      return prev.filter((_, i) => i !== index);
    });
  }

  function resetForm() {
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setServiceType("MESA");
    setItems([{ product_name: "", quantity: 1, notes: "" }]);
  }

  async function submitOrder() {
    setLoading(true);
    try {
      const filteredItems = items.filter(
        (i) => i.product_name.trim() !== ""
      );

      if (filteredItems.length === 0) {
        alert("Adicione ao menos 1 item");
        setLoading(false);
        return;
      }

      const body = {
        table_number: serviceType === "MESA" ? tableNumber || null : null,
        customer_name: customerName || null,
        customer_phone:
          serviceType === "DELIVERY" && customerPhone.trim() !== ""
            ? customerPhone
            : null,
        service_type: serviceType,
        source: "PDV",
        items: filteredItems,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erro ao criar pedido");
      } else {
        const data = await res.json();
        setLastCode(data.code);
        resetForm();
      }
    } finally {
      setLoading(false);
    }
  }

  const isDelivery = serviceType === "DELIVERY";
  const isMesa = serviceType === "MESA";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            PDV - Registrar Pedido
          </h1>
          <p className="text-sm text-zinc-400">
            Envie pedidos direto para a cozinha (KDS).
          </p>
        </div>

        <div className="flex gap-2 text-xs text-zinc-500">
          <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
            Modo interno
          </span>
          <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            Status inicial: PENDENTE
          </span>
        </div>
      </header>

      {/* Card principal */}
      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        {/* Dados do pedido */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            Dados do Pedido
          </h2>

          {/* Tipo de atendimento */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Tipo de atendimento
            </p>
            <div className="flex flex-wrap gap-2">
              {(["MESA", "BALCAO", "DELIVERY"] as ServiceType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setServiceType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    serviceType === type
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {type === "MESA"
                    ? "Mesa"
                    : type === "BALCAO"
                    ? "Balcão / Viagem"
                    : "Delivery"}
                </button>
              ))}
            </div>
          </div>

          {/* Mesa / Cliente */}
          <div className="flex flex-col gap-4">
            {isMesa && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Número da mesa
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Nome do cliente
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente (opcional)"
              />
            </div>

            {isDelivery && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(xx) xxxxx-xxxx"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={submitOrder}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? "Enviando..." : "Enviar pedido para Cozinha"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 text-xs font-medium rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Nova comanda
            </button>
          </div>

          {lastCode && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-900/40 border border-emerald-700 text-xs text-emerald-100">
              Pedido criado com sucesso! Código:{" "}
              <span className="font-semibold text-emerald-300">{lastCode}</span>
            </div>
          )}
        </section>

        {/* Itens do pedido */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              Itens do Pedido
            </h2>
            <span className="text-xs text-zinc-500">
              {items.length} item{items.length !== 1 && "s"}
            </span>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-3 items-start bg-zinc-950 border border-zinc-800 rounded-lg p-3"
              >
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                    placeholder="Nome do produto"
                    value={item.product_name}
                    onChange={(e) =>
                      updateItem(idx, "product_name", e.target.value)
                    }
                  />
                  <input
                    className="w-full px-3 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs text-zinc-300"
                    placeholder="Observações (opcional)"
                    value={item.notes}
                    onChange={(e) => updateItem(idx, "notes", e.target.value)}
                  />
                </div>

                <div className="flex flex-col items-center gap-1 w-20">
                  <button
                    type="button"
                    onClick={() => incrementQty(idx)}
                    className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-2 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-center text-sm outline-none"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(idx, "quantity", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => decrementQty(idx)}
                    className="w-8 h-8 rounded-md bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm"
                  >
                    -
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-xs text-zinc-500 hover:text-red-400 px-1"
                  title="Remover item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-950 border border-dashed border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
          >
            + Adicionar outro item
          </button>
        </section>
      </div>
    </main>
  );
}
