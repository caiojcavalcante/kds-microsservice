import pool from "@/lib/db";
import redis from "@/lib/redis";

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
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[] | null;
};

export const dynamic = "force-dynamic"; // não cachear

export default async function AdminPage() {
  // 1) Redis: fila e chaves relacionadas ao KDS
  const [redisQueueIds, kdsKeys] = await Promise.all([
    redis.lrange("kds:queue", 0, -1),
    redis.keys("kds:*"),
  ]);

  // 2) Orders + items do Postgres (últimos 100 pedidos)
  const ordersResult = await pool.query<OrderRow>(
    `
    SELECT 
      o.id,
      o.code,
      o.table_number,
      o.customer_name,
      o.status,
      o.source,
      o.created_at,
      o.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'notes', oi.notes
          )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 100;
  `
  );

  const orders = ordersResult.rows;

  // map pra achar rápido pedidos por ID (pra cruzar com a fila do Redis)
  const ordersById = new Map<string, OrderRow>();
  for (const o of orders) {
    ordersById.set(o.id, o);
  }

  return (
    <main className="p-6 min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Admin – Debug KDS</h1>
        <p className="mb-8 text-gray-600">
          Visualização de tudo que está no <strong className="text-blue-600">Postgres</strong> e{" "}
          <strong className="text-red-600">Redis</strong> para o microserviço KDS.
        </p>

        {/* BLOCO REDIS */}
        <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Redis
            </h2>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Fila kds:queue</h3>
            {redisQueueIds.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-sm italic border border-gray-100">
                Nenhum ID na fila kds:queue.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 mb-8">
                {redisQueueIds.map((id) => {
                  const order = ordersById.get(id);
                  return (
                    <div
                      key={id}
                      className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Order ID</div>
                      <div className="font-mono text-xs text-gray-500 mb-3 break-all bg-gray-50 p-1 rounded">
                        {id}
                      </div>
                      {order ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Código:</span>
                            <span className="font-bold text-gray-900">{order.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'IN_PREP' ? 'bg-orange-100 text-orange-700' :
                              order.status === 'READY' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mesa:</span>
                            <span className="text-gray-900">{order.table_number || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Cliente:</span>
                            <span className="text-gray-900">{order.customer_name || "-"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-600 text-xs mt-2 flex items-start gap-1 bg-red-50 p-2 rounded">
                          <span>⚠</span>
                          Pedido não encontrado no Postgres (pode ter sido apagado ou ainda não carregado).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <h3 className="text-lg font-medium mb-3 text-gray-700 mt-8">Chaves Redis (kds:*)</h3>
            {kdsKeys.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma chave encontrada com prefixo kds:*</p>
            ) : (
              <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono shadow-inner">
                {JSON.stringify(kdsKeys, null, 2)}
              </pre>
            )}
          </div>
        </section>

        {/* BLOCO POSTGRES */}
        <section className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Postgres – Pedidos (últimos 100)
            </h2>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-6 text-gray-500 text-center italic">
                Nenhum pedido encontrado na tabela orders.
              </div>
            ) : (
              <>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Código</th>
                      <th className="py-3 px-4 whitespace-nowrap">ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap">Mesa</th>
                      <th className="py-3 px-4 whitespace-nowrap">Cliente</th>
                      <th className="py-3 px-4 whitespace-nowrap">Criado em</th>
                      <th className="py-3 px-4 min-w-[200px]">Itens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{o.code}</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{o.id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            o.status === 'IN_PREP' ? 'bg-orange-100 text-orange-700' :
                            o.status === 'READY' ? 'bg-green-100 text-green-700' :
                            o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{o.table_number || "-"}</td>
                        <td className="py-3 px-4 text-gray-700">{o.customer_name || "-"}</td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="space-y-1">
                            {(o.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="font-semibold text-gray-900">{item.quantity}x</span>
                                <span className="text-gray-700">{item.product_name}</span>
                                {item.notes && <span className="text-amber-600 italic">({item.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <details className="group">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1 select-none">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      Ver JSON completo dos pedidos
                    </summary>
                    <pre className="mt-4 bg-zinc-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono shadow-inner">
                      {JSON.stringify(orders, null, 2)}
                    </pre>
                  </details>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="inline-flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <span className="text-lg">⚠</span>
          <p>
            Recomendo proteger essa rota <code className="bg-amber-100 px-1 rounded font-mono text-amber-900">/admin</code> com algum tipo de
            autenticação (middleware) depois, porque ela expõe dados internos.
          </p>
        </div>
      </div>
    </main>
  );
}
