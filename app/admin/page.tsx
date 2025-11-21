// app/admin/page.tsx
import { createServerClient } from "@/utils/supabase/server";

type OrderItem = {
  product_name: string;
  quantity: number;
  notes: string | null;
};

type OrderRow = {
  id: string;
  code: string;
  table_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  source: string | null;
  service_type: string | null;
  motoboy_name: string | null;
  motoboy_phone: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[] | null;
};

export const dynamic = "force-dynamic"; // não cachear

export default async function AdminPage() {
  const supabase = createServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, code, table_number, customer_name, customer_phone, status, source, service_type, motoboy_name, motoboy_phone, created_at, updated_at, items"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const safeOrders: OrderRow[] = (orders || []) as any;

  // stats por status
  const stats = safeOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const total = safeOrders.length;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Admin – KDS / PDV</h1>
            <p className="text-sm text-zinc-400">
              Visão geral dos pedidos gravados no Supabase (últimos 100).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Supabase conectado
          </div>
        </header>

        {/* Erro ao consultar */}
        {error && (
          <div className="p-4 rounded-lg border border-red-600/40 bg-red-950/40 text-sm text-red-200">
            <p className="font-semibold mb-1">Erro ao carregar pedidos</p>
            <p className="text-xs opacity-80">{error.message}</p>
          </div>
        )}

        {/* Stats por status */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">
              Visão geral (últimos {total} pedidos)
            </h2>
          </div>

          {total === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhum pedido encontrado na tabela <code className="font-mono">orders</code>.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <StatusCard
                label="PENDENTE"
                value={stats["PENDENTE"] || 0}
                color="bg-amber-500/20 text-amber-300 border-amber-500/40"
              />
              <StatusCard
                label="EM_PREPARO"
                value={stats["EM_PREPARO"] || 0}
                color="bg-orange-500/20 text-orange-300 border-orange-500/40"
              />
              <StatusCard
                label="PRONTO"
                value={stats["PRONTO"] || 0}
                color="bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              />
              <StatusCard
                label="SAIU_ENTREGA"
                value={stats["SAIU_ENTREGA"] || 0}
                color="bg-purple-500/20 text-purple-200 border-purple-500/40"
              />
              <StatusCard
                label="ENTREGUE"
                value={stats["ENTREGUE"] || 0}
                color="bg-blue-500/20 text-blue-200 border-blue-500/40"
              />
              <StatusCard
                label="CANCELADO"
                value={stats["CANCELADO"] || 0}
                color="bg-red-500/20 text-red-200 border-red-500/40"
              />
              <StatusCard
                label="Outros"
                value={
                  total -
                  ((stats["PENDENTE"] || 0) +
                    (stats["EM_PREPARO"] || 0) +
                    (stats["PRONTO"] || 0) +
                    (stats["SAIU_ENTREGA"] || 0) +
                    (stats["ENTREGUE"] || 0) +
                    (stats["CANCELADO"] || 0))
                }
                color="bg-zinc-700/40 text-zinc-200 border-zinc-500/40"
              />
            </div>
          )}
        </section>

        {/* Tabela de pedidos */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">
              Pedidos (Supabase – últimos 100)
            </h2>
            <span className="text-xs text-zinc-500">
              Ordenado por criação (mais recentes primeiro)
            </span>
          </div>

          {total === 0 ? (
            <div className="p-6 text-sm text-zinc-500 italic">
              Nenhum pedido cadastrado ainda.
            </div>
          ) : (
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 whitespace-nowrap">Código</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                    <th className="py-3 px-4 whitespace-nowrap">Mesa</th>
                    <th className="py-3 px-4 whitespace-nowrap">Cliente</th>
                    <th className="py-3 px-4 whitespace-nowrap">Origem</th>
                    <th className="py-3 px-4 whitespace-nowrap">
                      Criado em
                    </th>
                    <th className="py-3 px-4 min-w-[220px]">Itens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {safeOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-zinc-50">
                        {o.code}
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300">
                        {o.service_type || "-"}
                      </td>
                      <td className="py-3 px-4 text-zinc-200">
                        {o.table_number || "-"}
                      </td>
                      <td className="py-3 px-4 text-zinc-200">
                        {o.customer_name || "-"}
                        {o.customer_phone && (
                          <div className="text-[11px] text-zinc-400">
                            {o.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        {o.source || "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="space-y-1">
                          {(o.items || []).map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-1 text-zinc-100"
                            >
                              <span className="font-semibold">
                                {item.quantity}x
                              </span>
                              <span>{item.product_name}</span>
                              {item.notes && (
                                <span className="text-amber-400 italic">
                                  ({item.notes})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* JSON bruto */}
          {total > 0 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/80">
              <details className="group text-xs">
                <summary className="cursor-pointer text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 select-none">
                  <span className="group-open:rotate-90 transition-transform">
                    ▶
                  </span>
                  Ver JSON completo dos pedidos
                </summary>
                <pre className="mt-3 bg-zinc-950 text-emerald-300/90 p-3 rounded-lg text-[11px] overflow-x-auto font-mono border border-zinc-800 shadow-inner max-h-80">
                  {JSON.stringify(safeOrders, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>

        {/* Aviso de segurança */}
        <div className="inline-flex items-start gap-2 px-4 py-3 bg-amber-900/40 border border-amber-600/40 rounded-lg text-amber-100 text-xs">
          <span className="text-base leading-none">⚠</span>
          <p>
            Recomendo proteger essa rota{" "}
            <code className="bg-amber-800/80 px-1 rounded font-mono text-amber-100">
              /admin
            </code>{" "}
            com autenticação (middleware), pois ela expõe dados internos dos
            pedidos.
          </p>
        </div>
      </div>
    </main>
  );
}

/* COMPONENTES AUXILIARES */

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 flex flex-col gap-1 ${color}`}
    >
      <span className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  let cls =
    "bg-zinc-800 text-zinc-200 border-zinc-700";
  switch (status) {
    case "PENDENTE":
      cls = "bg-amber-500/20 text-amber-200 border border-amber-500/40";
      break;
    case "EM_PREPARO":
      cls = "bg-orange-500/20 text-orange-200 border border-orange-500/40";
      break;
    case "PRONTO":
      cls = "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40";
      break;
    case "SAIU_ENTREGA":
      cls = "bg-purple-500/20 text-purple-200 border border-purple-500/40";
      break;
    case "ENTREGUE":
      cls = "bg-blue-500/20 text-blue-200 border border-blue-500/40";
      break;
    case "CANCELADO":
      cls = "bg-red-500/20 text-red-200 border border-red-500/40";
      break;
  }

  return (
    <span
      className={`px-2 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${cls}`}
    >
      {status}
    </span>
  );
}
