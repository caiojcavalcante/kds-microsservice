"use client";

import { useState } from "react";

type ItemForm = {
  product_name: string;
  quantity: number;
  notes: string;
};

export default function PdvPage() {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<ItemForm[]>([
    { product_name: "", quantity: 1, notes: "" }
  ]);
  const [loading, setLoading] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) || 1 : value
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { product_name: "", quantity: 1, notes: "" }]);
  }

  async function submitOrder() {
    setLoading(true);
    try {
      const body = {
        table_number: tableNumber || null,
        customer_name: customerName || null,
        source: "PDV",
        items: items.filter((i) => i.product_name.trim() !== "")
      };

      if (body.items.length === 0) {
        alert("Adicione ao menos 1 item");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erro ao criar pedido");
      } else {
        const data = await res.json();
        setLastCode(data.code);
        // limpa form
        setTableNumber("");
        setCustomerName("");
        setItems([{ product_name: "", quantity: 1, notes: "" }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 p-6">
      <h1 className="text-3xl font-bold mb-8 text-zinc-800">PDV - Registrar Pedido</h1>

      <div className="flex flex-col sm:flex-row gap-6 mb-8 bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-600 mb-1">Mesa / Retirada</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Ex: 10"
          />
        </div>
        <div className="flex-[2]">
          <label className="block text-sm font-medium text-zinc-600 mb-1">Nome do cliente</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-zinc-800">Itens do Pedido</h2>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-3 items-start"
            >
              <div className="flex-1">
                <input
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome do produto"
                  value={item.product_name}
                  onChange={(e) =>
                    updateItem(idx, "product_name", e.target.value)
                  }
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="flex-1">
                <input
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Observações (opcional)"
                  value={item.notes}
                  onChange={(e) => updateItem(idx, "notes", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={addItem} 
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          + Adicionar outro item
        </button>
      </div>

      <div>
        <button 
          onClick={submitOrder} 
          disabled={loading}
          className="w-full sm:w-auto px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg shadow-lg shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
        >
          {loading ? "Enviando..." : "Enviar pedido para Cozinha"}
        </button>
      </div>

      {lastCode && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
          <p>
            Pedido criado com sucesso! Código: <strong className="text-xl">{lastCode}</strong>
          </p>
        </div>
      )}
    </main>
  );
}
