"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, CheckCircle2, Truck, Package, Flame, ChefHat, User, Phone, MessageCircle, AlertTriangle, Copy, ExternalLink, CreditCard, Banknote, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type OrderItem = {
  product_name: string
  quantity: number
  notes?: string | null
  price?: number
  total_price?: number
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
  // Payment fields (using actual DB column names)
  payment_status?: string | null
  billingType?: string | null
  total?: number | null
  encodedImage?: string | null
  copiaecola?: string | null
  invoiceUrl?: string | null
}

type CurrentUser = {
  id: string
  email: string
  name: string
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

const BILLING_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: "Cartão de Crédito",
  PIX: "Pix",
  MAQUININHA: "Maquininha",
  DINHEIRO: "Dinheiro",
}

export function KdsClient({ currentUser }: { currentUser: CurrentUser }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentPopupOrder, setPaymentPopupOrder] = useState<Order | null>(null)
  const [copiedPix, setCopiedPix] = useState(false)

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

  // Check if order is paid
  function isOrderPaid(order: Order): boolean {
    const paidStatuses = ["PAYMENT_RECEIVED", "PAGO", "RECEIVED", "CONFIRMED"]
    return paidStatuses.includes(order.payment_status?.toUpperCase() || "")
  }

  // Handle delivery to client with payment check
  async function handleDeliveryToClient(order: Order) {
    if (isOrderPaid(order)) {
      // Order is paid, deliver directly
      await confirmDelivery(order)
    } else {
      // Order is not paid, show payment popup
      setPaymentPopupOrder(order)
    }
  }

  // Confirm delivery and record signature
  async function confirmDelivery(order: Order, markAsPaid: boolean = false) {
    const extra: Record<string, any> = {
      delivered_by_id: currentUser.id,
      delivered_by_name: currentUser.name,
      delivered_at: new Date().toISOString(),
    }

    if (markAsPaid) {
      extra.payment_status = "PAYMENT_RECEIVED"
    }

    await updateStatus(order.id, "ENTREGUE", extra)
    setPaymentPopupOrder(null)
  }

  // Copy Pix code to clipboard
  async function copyPixCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  useEffect(() => {
    loadQueue()

    const supabase = createClient()
    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Realtime update:", payload)
          loadQueue() // Reload full queue to ensure consistency (simplest approach)
          // Optimization: We could manually update the state based on payload to save a fetch
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
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

  // Render payment status badge
  function renderPaymentBadge(order: Order) {
    if (isOrderPaid(order)) {
      return <Badge className="bg-green-500 text-white">PAGO</Badge>
    }
    return <Badge variant="destructive">NÃO PAGO</Badge>
  }

  // Calculate order total from items
  function calculateOrderTotal(order: Order): number {
    // First check if order has a total field
    if (order.total != null && order.total > 0) {
      return order.total
    }
    // Otherwise calculate from items
    if (!order.items || order.items.length === 0) return 0
    return order.items.reduce((sum, item) => {
      const itemPrice = item.total_price || (item.price || 0) * (item.quantity || 1)
      return sum + itemPrice
    }, 0)
  }

  // tira ENTREGUE e CANCELADO da fila visual
  const activeOrders = orders.filter(
    (o) => o.status !== "ENTREGUE" && o.status !== "CANCELADO"
  )

  // Format currency
  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <main className="flex flex-col bg-background p-4 md:p-6 pb-20 md:pb-6">
      <header className="mb-6 flex-none flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          <Badge variant="secondary" className="h-8">
            <User className="h-3 w-3 mr-1" />
            {currentUser.name}
          </Badge>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-0">
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

              <div
                className="p-4 flex-1 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
                data-lenis-prevent
              >
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
                          <div className="flex flex-col items-end gap-1">
                            {renderServiceTag(order)}
                            {order.status === "PRONTO" && renderPaymentBadge(order)}
                          </div>
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
                          {order.total != null && order.total > 0 && (
                            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                              <Banknote className="h-3 w-3" />
                              <span>{formatCurrency(order.total)}</span>
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

                        <div className="mt-auto pt-2 space-y-2">
                          {order.customer_phone && (
                            <Button
                              className="w-full bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => window.open(`https://wa.me/55${order.customer_phone?.replace(/\D/g, "")}`, "_blank")}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" /> Contactar cliente
                            </Button>
                          )}
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
                                className={cn(
                                  "w-full",
                                  isOrderPaid(order)
                                    ? "border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500"
                                    : "border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-600"
                                )}
                                onClick={() => handleDeliveryToClient(order)}
                              >
                                {isOrderPaid(order) ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Entregar ao Cliente
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Entregar ao Cliente
                                  </>
                                )}
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
                              onClick={() => handleDeliveryToClient(order)}
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

      {/* Payment Popup - Styled like ProductCustomizer */}
      {paymentPopupOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPaymentPopupOrder(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/5 dark:border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 flex items-start gap-4 relative border-b border-black/5 dark:border-white/5">
              <div className="h-14 w-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0 border border-yellow-500/20">
                <AlertTriangle className="h-7 w-7 text-yellow-500" />
              </div>
              <div className="flex-1 pr-8">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Pagamento Pendente
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                  Pedido <span className="font-bold text-neutral-900 dark:text-white">{paymentPopupOrder.code}</span> ainda não foi pago
                </p>
              </div>
              <button
                onClick={() => setPaymentPopupOrder(null)}
                className="absolute top-4 right-4 p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {/* Total Value */}
              <div className="text-center p-6 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl border border-emerald-500/20">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">Valor do Pedido</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {formatCurrency(calculateOrderTotal(paymentPopupOrder))}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                  {paymentPopupOrder.items?.length || 0} {(paymentPopupOrder.items?.length || 0) === 1 ? 'item' : 'itens'}
                </p>
              </div>

              {/* PIX QR Code Image */}
              {paymentPopupOrder.encodedImage && (
                <div className="flex flex-col items-center gap-4 p-6 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide">QR Code Pix</p>
                  <div className="p-3 bg-white rounded-2xl shadow-lg">
                    <img
                      src={`data:image/png;base64,${paymentPopupOrder.encodedImage}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* PIX Copia e Cola */}
              {paymentPopupOrder.copiaecola && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide">Pix Copia e Cola</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={paymentPopupOrder.copiaecola}
                      readOnly
                      className="flex-1 px-4 py-3 text-xs border rounded-xl bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-900 dark:text-white font-mono truncate"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyPixCode(paymentPopupOrder.copiaecola!)}
                      className={cn(
                        "px-4 rounded-xl border-black/10 dark:border-white/10 transition-all",
                        copiedPix && "bg-green-500/10 border-green-500/30 text-green-600"
                      )}
                    >
                      {copiedPix ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Copiado!</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" /> Copiar</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Invoice URL (fallback if no PIX) */}
              {!paymentPopupOrder.encodedImage &&
                !paymentPopupOrder.copiaecola &&
                paymentPopupOrder.invoiceUrl && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide">Link de Pagamento</p>
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                      <a href={paymentPopupOrder.invoiceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir Link de Pagamento
                      </a>
                    </Button>
                  </div>
                )}

              {/* Manual collection instruction (fallback) */}
              {!paymentPopupOrder.encodedImage &&
                !paymentPopupOrder.copiaecola &&
                !paymentPopupOrder.invoiceUrl && (
                  <div className="p-5 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/20">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-yellow-800 dark:text-yellow-200 text-lg">
                          Colete o Pagamento
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Valor:</span>
                            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(calculateOrderTotal(paymentPopupOrder))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Forma:</span>
                            <span className="font-bold text-neutral-900 dark:text-white">
                              {BILLING_TYPE_LABELS[paymentPopupOrder.billingType || ""] || paymentPopupOrder.billingType || "Não especificado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-neutral-100/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-3 backdrop-blur-md">
              <Button
                variant="outline"
                onClick={() => setPaymentPopupOrder(null)}
                className="flex-1 h-12 rounded-xl border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 font-bold uppercase tracking-wide"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => confirmDelivery(paymentPopupOrder, true)}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all font-bold uppercase tracking-wide border-0"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Confirmar Entrega
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  )
}

