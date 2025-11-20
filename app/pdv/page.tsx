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
    <main style={{ padding: 24 }}>
      <h1>PDV - Registrar Pedido</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div>
          <label>Mesa / Retirada</label>
          <br />
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />
        </div>
        <div>
          <label>Nome do cliente</label>
          <br />
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
      </div>

      <h2>Itens</h2>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 8,
            alignItems: "center"
          }}
        >
          <input
            placeholder="Produto"
            value={item.product_name}
            onChange={(e) =>
              updateItem(idx, "product_name", e.target.value)
            }
          />
          <input
            type="number"
            min={1}
            style={{ width: 60 }}
            value={item.quantity}
            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
          />
          <input
            placeholder="Observações"
            value={item.notes}
            onChange={(e) => updateItem(idx, "notes", e.target.value)}
          />
        </div>
      ))}
      <button onClick={addItem} style={{ marginBottom: 16 }}>
        + Item
      </button>

      <div>
        <button onClick={submitOrder} disabled={loading}>
          {loading ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>

      {lastCode && (
        <p style={{ marginTop: 16 }}>
          Pedido criado com código: <strong>{lastCode}</strong>
        </p>
      )}
    </main>
  );
}
