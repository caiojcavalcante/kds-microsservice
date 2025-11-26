import { createServerClient } from "@/utils/supabase/server"
import { AlertTriangle, CheckCircle2, Clock, Flame, Package, Truck, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type OrderItem = {
  product_name: string
  quantity: number
  notes: string | null
}

type OrderRow = {
  id: string
  code: string
  table_number: string | null
  customer_name: string | null
  customer_phone: string | null
  status: string
  source: string | null
  service_type: string | null
  motoboy_name: string | null
  motoboy_phone: string | null
  created_at: string
  updated_at: string
  items: OrderItem[] | null
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = createServerClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, code, table_number, customer_name, customer_phone, status, source, service_type, motoboy_name, motoboy_phone, created_at, updated_at, items"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  const safeOrders: OrderRow[] = (orders || []) as any

  // stats por status
  const stats = safeOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const total = safeOrders.length

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8 text-red-600" />
              Admin
            </h1>
            <p className="text-muted-foreground">
              Visão geral dos pedidos e estatísticas
            </p>
          </div>
          <Badge variant="outline" className="h-8 gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Conectado
          </Badge>
        </header>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Erro ao carregar pedidos
            </div>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Novos"
            value={stats["PENDENTE"] || 0}
            icon={Clock}
            className="border-l-4 border-l-amber-500"
          />
          <StatsCard
            title="Em Preparo"
            value={stats["EM_PREPARO"] || 0}
            icon={Flame}
            className="border-l-4 border-l-orange-500"
          />
          <StatsCard
            title="Prontos"
            value={stats["PRONTO"] || 0}
            icon={CheckCircle2}
            className="border-l-4 border-l-emerald-500"
          />
          <StatsCard
            title="Total (100)"
            value={total}
            icon={Package}
            description="Últimos pedidos"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pedidos</CardTitle>
            <CardDescription>
              Últimos 100 pedidos registrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {total === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Código
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Tipo
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Cliente
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Criado em
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Resumo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {safeOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle font-medium">
                            {order.code}
                          </td>
                          <td className="p-4 align-middle">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="text-[10px]">
                              {order.service_type}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.customer_name || "—"}
                              </span>
                              {order.table_number && (
                                <span className="text-xs text-muted-foreground">
                                  Mesa {order.table_number}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <span className="text-xs text-muted-foreground">
                              {order.items?.length || 0} itens
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-500">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm">
            Esta área administrativa deve ser protegida por autenticação em
            produção.
          </p>
        </div>
      </div>
    </main>
  )
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  className,
}: {
  title: string
  value: number
  icon: any
  description?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDENTE":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          Pendente
        </Badge>
      )
    case "EM_PREPARO":
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          Em Preparo
        </Badge>
      )
    case "PRONTO":
      return (
        <Badge variant="outline" className="border-emerald-500 text-emerald-500">
          Pronto
        </Badge>
      )
    case "SAIU_ENTREGA":
      return (
        <Badge variant="outline" className="border-purple-500 text-purple-500">
          Saiu p/ Entrega
        </Badge>
      )
    case "ENTREGUE":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          Entregue
        </Badge>
      )
    case "CANCELADO":
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          Cancelado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
