"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle2, Truck, Package, Flame, ChefHat, User, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type OrderItem = {
  product_name: string
  quantity: number
  notes?: string | null
}

type Order = {
  id: string
  code: string
  table_number?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  service_type?: "MESA" | "BALCAO" | "DELIVERY" | string
  status: string
  items: OrderItem[]
}

const COLUMNS: { key: string; title: string; description: string; icon: any }[] = [
  {
    key: "PENDENTE",
    title: "Novos pedidos",
    description: "Ainda não iniciados",
    icon: Clock,
  },
  {
    key: "EM_PREPARO",
    title: "Em preparo",
    description: "A cozinha está preparando",
    icon: Flame,
  },
  {
    key: "PRONTO",
    title: "Prontos",
    description: "Aguardando retirada / entrega",
    icon: CheckCircle2,
  },
  {
    key: "SAIU_ENTREGA",
    title: "Saiu para entrega",
    description: "Motoboy já está com o pedido",
    icon: Truck,
  },
]

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([])

  async function loadQueue() {
    const res = await fetch("/api/kds/queue", { cache: "no-store" })
    if (!res.ok) {
      console.error("Erro ao carregar fila:", await res.text())
      return
    }
    const data = await res.json()
    setOrders(data)
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
    })

    if (!res.ok) {
      console.error("Erro ao atualizar status:", await res.text())
      alert("Erro ao atualizar status do pedido")
      return
    }

    await loadQueue()
  }

  async function handleDeliveryWithDriver(order: Order) {
    if (order.service_type !== "DELIVERY") return

    const motoboy_name = window.prompt("Nome do motoboy:")
    if (!motoboy_name) return

    const motoboy_phone = window.prompt("Telefone / WhatsApp do motoboy:")
    if (!motoboy_phone) return

    await updateStatus(order.id, "SAIU_ENTREGA", {
      motoboy_name,
      motoboy_phone,
    })
  }

  useEffect(() => {
    loadQueue()
    const interval = setInterval(loadQueue, 4000)
    return () => clearInterval(interval)
  }, [])

  function getStatusColor(status: string) {
    switch (status) {
      case "EM_PREPARO":
        return "text-orange-500"
      case "PRONTO":
        return "text-emerald-500"
      case "SAIU_ENTREGA":
        return "text-purple-500"
      case "ENTREGUE":
        return "text-blue-500"
      case "CANCELADO":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  function getBorderColor(status: string) {
    switch (status) {
      case "EM_PREPARO":
        return "border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
      case "PRONTO":
        return "border-emerald-500/50"
      case "SAIU_ENTREGA":
        return "border-purple-500/50"
      case "ENTREGUE":
        return "border-blue-500/50"
      case "CANCELADO":
        return "border-red-500/50"
      default:
        return "border-border"
    }
  }

  function renderServiceTag(order: Order) {
    if (order.service_type === "DELIVERY") {
      return <Badge variant="secondary">DELIVERY</Badge>
    }

    if (order.service_type === "BALCAO") {
      return <Badge variant="outline">BALCÃO</Badge>
    }

    if (order.table_number) {
      return <Badge variant="outline">MESA {order.table_number}</Badge>
    }

    return <Badge variant="outline">{order.service_type || "—"}</Badge>
  }

  // tira ENTREGUE e CANCELADO da fila visual
  const activeOrders = orders.filter(
    (o) => o.status !== "ENTREGUE" && o.status !== "CANCELADO"
  )

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 overflow-x-hidden">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-red-600" />
            KDS - Cozinha
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de pedidos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8">
            {activeOrders.length} Pedidos Ativos
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {COLUMNS.map((col) => {
          const colOrders = activeOrders.filter((o) => o.status === col.key)
          const Icon = col.icon

          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl bg-muted/30 border h-full"
            >
              <div className="p-4 border-b bg-muted/50 rounded-t-xl flex items-center justify-between sticky top-0 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", col.key === "EM_PREPARO" && "text-orange-500 animate-pulse")} />
                  <div>
                    <h2 className="text-sm font-semibold">{col.title}</h2>
                    <p className="text-[10px] text-muted-foreground">
                      {col.description}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {colOrders.length}
                </Badge>
              </div>

              <div className="p-4 flex-1 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <AnimatePresence mode="popLayout">
                  {colOrders.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg"
                    >
                      <Package className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-xs">Sem pedidos</span>
                    </motion.div>
                  ) : (
                    colOrders.map((order) => (
                      <motion.div
                        layout
                        key={order.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className={cn(
                          "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                          getBorderColor(order.status)
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-2xl font-bold tracking-tight">
                              {order.code}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">
                              #{order.id.slice(0, 8)}
                            </span>
                          </div>
                          {renderServiceTag(order)}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">
                              {order.customer_name || "Cliente não identificado"}
                            </span>
                          </div>
                          {order.service_type === "DELIVERY" &&
                            order.customer_phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{order.customer_phone}</span>
                              </div>
                            )}
                        </div>

                        <div className="rounded-md bg-muted/50 p-3">
                          <ul className="space-y-2 text-sm">
                            {(order.items || []).map((i, idx) => (
                              <li key={idx} className="flex flex-col">
                                <div className="flex items-start gap-2">
                                  <span className="font-bold min-w-[20px]">
                                    {i.quantity}x
                                  </span>
                                  <span className="leading-tight">
                                    {i.product_name}
                                  </span>
                                </div>
                                {i.notes && (
                                  <span className="ml-7 text-xs text-orange-500 italic mt-0.5">
                                    Obs: {i.notes}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto pt-2">
                          {order.status === "PENDENTE" && (
                            <Button
                              className="w-full shadow-fire group-hover:animate-pulse"
                              variant="fire"
                              onClick={() => updateStatus(order.id, "EM_PREPARO")}
                            >
                              <Flame className="mr-2 h-4 w-4" /> Iniciar Preparo
                            </Button>
                          )}

                          {order.status === "EM_PREPARO" && (
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => updateStatus(order.id, "PRONTO")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
                            </Button>
                          )}

                          {order.status === "PRONTO" && (
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                className="w-full border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500"
                                onClick={() => updateStatus(order.id, "ENTREGUE")}
                              >
                                Entregar ao Cliente
                              </Button>

                              {order.service_type === "DELIVERY" && (
                                <Button
                                  variant="secondary"
                                  className="w-full"
                                  onClick={() => handleDeliveryWithDriver(order)}
                                >
                                  <Truck className="mr-2 h-4 w-4" /> Entregar ao
                                  Motoboy
                                </Button>
                              )}
                            </div>
                          )}

                          {order.status === "SAIU_ENTREGA" && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => updateStatus(order.id, "ENTREGUE")}
                            >
                              Confirmar Entrega
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
