"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock, Flame, Package, Settings, Search, X, Save, Trash2, Plus, Minus, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/utils/supabase/client"
import { ProductManager } from "@/components/product-manager"

type OrderItem = {
  product_name: string
  quantity: number
  notes: string | null
  price?: number
  total_price?: number
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
  // Payment fields
  obs: string | null
  payment: string | null
  payment_status: string | null
  billingType: string | null
  total: number | null
  encodedImage: string | null
  copiaecola: string | null
  invoiceUrl: string | null
  // Delivery signature
  delivered_by_id: string | null
  delivered_by_name: string | null
  delivered_at: string | null
}

type Category = {
  id: number
  name: string
  items: Product[]
}

type Product = {
  id: number
  name: string
  description: string
  price: number
  img: string | null
}
export function AdminClient({ initialOrders, menu }: { initialOrders: OrderRow[], menu: Category[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("realtime-admin-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  // Edit State
  const [editForm, setEditForm] = useState<Partial<OrderRow>>({})

  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [itemSearch, setItemSearch] = useState("")

  // Discount type: 'absolute' (R$) or 'percent' (%)
  const [discountType, setDiscountType] = useState<'absolute' | 'percent'>('absolute')

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isPanelOpen) {
      // Save original styles
      const originalBodyStyle = document.body.style.overflow
      const originalHtmlStyle = document.documentElement.style.overflow

      // Prevent scrolling on both body and html
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalBodyStyle
        document.documentElement.style.overflow = originalHtmlStyle
      }
    }
  }, [isPanelOpen])

  const handleSelectOrder = (order: OrderRow) => {
    setSelectedOrder(order)
    setEditForm(JSON.parse(JSON.stringify(order))) // Deep copy
    setIsPanelOpen(true)
    setIsAddingItem(false)
  }

  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setTimeout(() => setSelectedOrder(null), 300)
  }

  const handleSave = async () => {
    if (!selectedOrder) return
    setIsLoading(true)

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) throw new Error("Falha ao atualizar")

      const updatedOrder = await res.json()

      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
      toast.success("Pedido atualizado com sucesso")
      handleClosePanel()
      router.refresh()
    } catch (error) {
      toast.error("Erro ao atualizar pedido")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedOrder || !confirm("Tem certeza que deseja excluir este pedido?")) return
    setIsLoading(true)

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Falha ao excluir")

      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      toast.success("Pedido excluído")
      handleClosePanel()
      router.refresh()
    } catch (error) {
      toast.error("Erro ao excluir pedido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = (product: Product) => {
    const item: OrderItem = {
      product_name: product.name,
      quantity: 1,
      notes: "",
      price: product.price,
      total_price: product.price
    }
    setEditForm(prev => ({
      ...prev,
      items: [...(prev.items || []), item]
    }))
    setIsAddingItem(false)
    setItemSearch("")
  }

  // Filter products for search
  const filteredProducts = itemSearch.length > 1
    ? menu.flatMap(c => c.items).filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()))
    : []

  // Stats
  const stats = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const total = orders.length

  const calculateOrderTotal = (items: OrderItem[] | null) => {
    if (!items) return 0
    return items.reduce((acc, item) => acc + ((item.price || 0) * item.quantity), 0)
  }

  // Analytics Calculations
  const analytics = useMemo(() => {
    const today = new Date()
    const todayOrders = orders.filter(o => {
      const d = new Date(o.created_at)
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear() &&
        o.status !== "CANCELADO"
    })

    const totalRevenue = todayOrders.reduce((acc, o) => acc + calculateOrderTotal(o.items), 0)
    const totalOrders = todayOrders.length
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Hourly Sales
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, total: 0, count: 0 }))
    todayOrders.forEach(o => {
      const hour = new Date(o.created_at).getHours()
      hourlyData[hour].total += calculateOrderTotal(o.items)
      hourlyData[hour].count += 1
    })
    const chartData = hourlyData.map(d => ({
      name: `${d.hour}h`,
      Vendas: d.total,
      Pedidos: d.count
    })).filter(d => d.Vendas > 0 || d.Pedidos > 0)

    // Top Items with images from menu
    const itemCounts: Record<string, number> = {}
    todayOrders.forEach(o => {
      o.items?.forEach(i => {
        itemCounts[i.product_name] = (itemCounts[i.product_name] || 0) + i.quantity
      })
    })

    // Find product image from menu
    const findProductImage = (productName: string): string | null => {
      for (const category of menu) {
        const product = category.items.find(p => p.name === productName)
        if (product?.img) return product.img
      }
      return null
    }

    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count, img: findProductImage(name) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return { totalRevenue, totalOrders, avgTicket, chartData, topItems }
  }, [orders])

  return (
    <div className="space-y-8">

      <Tabs defaultValue="orders" className="space-y-4">
        <div className="w-full mx-4 sm:mx-0 overflow-x-auto">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-4">
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
              title="Total (Hoje)"
              value={analytics.totalOrders}
              icon={Package}
              description="Pedidos realizados hoje"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>
                Clique em um pedido para editar detalhes e status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ... (Order Table - same as before) ... */}
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
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Código</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cliente</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Criado em</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Itens</th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => handleSelectOrder(order)}
                            className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                          >
                            <td className="p-4 align-middle font-medium">{order.code}</td>
                            <td className="p-4 align-middle"><StatusBadge status={order.status} /></td>
                            <td className="p-4 align-middle">
                              <Badge variant="outline" className="text-[10px]">{order.service_type}</Badge>
                            </td>
                            <td className="p-4 align-middle">
                              <div className="flex flex-col">
                                <span className="font-medium">{order.customer_name || "—"}</span>
                                {order.table_number && <span className="text-xs text-muted-foreground">Mesa {order.table_number}</span>}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="p-4 align-middle">
                              <span className="text-xs text-muted-foreground">{order.items?.length || 0} itens</span>
                            </td>
                            <td className="p-4 align-middle font-medium text-green-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(order.items))}
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
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Premium Analytics Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Revenue Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-500/20 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Receita Total (Hoje)</span>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold text-lg">R$</span>
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analytics.totalRevenue)}
                </div>
              </div>
            </div>

            {/* Orders Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Pedidos (Hoje)</span>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.totalOrders}
                </div>
              </div>
            </div>

            {/* Avg Ticket Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-50" />
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Ticket Médio</span>
                  <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Flame className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analytics.avgTicket)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart Card */}
            <div className="col-span-4 relative overflow-hidden rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/10 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  Vendas por Hora
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.8} />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#999', marginBottom: '4px' }}
                        formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Vendas']}
                      />
                      <Bar
                        dataKey="Vendas"
                        fill="url(#barGradient)"
                        radius={[8, 8, 0, 0]}
                        filter="url(#glow)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Items Card */}
            <div className="col-span-3 relative overflow-hidden rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/10 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 opacity-50" />
              <div className="relative">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  Mais Vendidos
                </h3>
                <p className="text-sm text-neutral-500 mb-6">Top 5 itens de hoje</p>

                <div className="space-y-4">
                  {analytics.topItems.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-4 p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                      {/* Rank Badge */}
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-lg",
                        index === 0 && "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-500/30",
                        index === 1 && "bg-gradient-to-br from-neutral-300 to-neutral-400 text-white shadow-neutral-400/30",
                        index === 2 && "bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-amber-600/30",
                        index > 2 && "bg-black/10 dark:bg-white/10 text-neutral-600 dark:text-neutral-400"
                      )}>
                        {index + 1}
                      </div>

                      {/* Product Image */}
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex-shrink-0">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-neutral-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.count} unidades vendidas</p>
                      </div>
                    </div>
                  ))}
                  {analytics.topItems.length === 0 && (
                    <div className="text-center py-12 text-neutral-500">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">Nenhum dado ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Panel - Premium Redesign */}
      <AnimatePresence>
        {isPanelOpen && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePanel}
              className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto h-screen m-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 pointer-events-none"
              onClick={handleClosePanel}
            >
              <div
                className="w-full max-w-[1000px] max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-white dark:bg-neutral-900 border border-black/5 dark:border-white/10 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 flex items-start gap-4 relative border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-red-500/5 to-orange-500/5">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Settings className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                      Editar Pedido
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-lg font-bold text-red-600">#{selectedOrder.code}</span>
                      <Badge variant="outline" className="text-xs">{selectedOrder.service_type}</Badge>
                      <Badge variant="outline" className="text-xs">{selectedOrder.source}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="absolute top-4 right-4 p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Body */}
                <div
                  className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain"
                  onWheel={(e) => e.stopPropagation()}
                >
                  {/* Status Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      Status do Pedido
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {["PENDENTE", "EM_PREPARO", "PRONTO", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].map(status => (
                        <button
                          key={status}
                          onClick={() => setEditForm(prev => ({ ...prev, status }))}
                          className={cn(
                            "p-3 rounded-xl text-sm font-medium transition-all border",
                            editForm.status === status
                              ? "bg-gradient-to-br shadow-lg border-transparent " + getStatusGradient(status)
                              : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                          )}
                        >
                          {formatStatus(status)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="p-5 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-2xl border border-emerald-500/20 space-y-4">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      Pagamento
                    </h3>
                    <p className="text-xs text-neutral-500">Desconto no pedido não é refletido no valor final, esta é apenas para fins de cálculo pois apenas guardamos os itens no pedido e nao o valor total.<br />O pagamento deve ser concluido manualmente</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Status Pagamento</Label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { value: "PENDING", label: "Pendente" },
                            { value: "PAYMENT_RECEIVED", label: "Pago" },
                            { value: "PAYMENT_CREATED", label: "Cobrança" },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setEditForm(prev => ({ ...prev, payment_status: opt.value }))}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                editForm.payment_status === opt.value
                                  ? "bg-emerald-500 text-white"
                                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Tipo de Cobrança</Label>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { value: "PIX", label: "PIX" },
                            { value: "CREDIT_CARD", label: "Cartão" },
                            { value: "MAQUININHA", label: "Maquininha" },
                            { value: "DINHEIRO", label: "Dinheiro" },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setEditForm(prev => ({ ...prev, billingType: opt.value }))}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                editForm.billingType === opt.value
                                  ? "bg-blue-500 text-white"
                                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Subtotal (calculado)</Label>
                        <div className="h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center px-4 text-lg font-bold text-neutral-600 dark:text-neutral-300">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(editForm.items || []))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Desconto</Label>
                        <div className="flex gap-2">
                          {/* Toggle R$ / % */}
                          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
                            <button
                              onClick={() => setDiscountType('absolute')}
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-bold transition-all",
                                discountType === 'absolute'
                                  ? "bg-red-500 text-white shadow"
                                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                              )}
                            >
                              R$
                            </button>
                            <button
                              onClick={() => setDiscountType('percent')}
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm font-bold transition-all",
                                discountType === 'percent'
                                  ? "bg-red-500 text-white shadow"
                                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                              )}
                            >
                              %
                            </button>
                          </div>
                          <Input
                            type="number"
                            step={discountType === 'percent' ? "1" : "0.01"}
                            min="0"
                            max={discountType === 'percent' ? "100" : undefined}
                            value={(editForm as any).discount || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 } as any))}
                            className="h-12 rounded-xl text-lg font-bold text-red-500 flex-1"
                            placeholder={discountType === 'percent' ? "0%" : "0,00"}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total Final</span>
                        <span className="text-2xl font-bold text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            (() => {
                              const subtotal = calculateOrderTotal(editForm.items || [])
                              const discountValue = (editForm as any).discount || 0
                              if (discountType === 'percent') {
                                return Math.max(0, subtotal - (subtotal * discountValue / 100))
                              }
                              return Math.max(0, subtotal - discountValue)
                            })()
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-500" />
                      </div>
                      Cliente & Serviço
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Nome do Cliente</Label>
                        <Input
                          value={editForm.customer_name || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          className="h-10 rounded-xl"
                          placeholder="Nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Telefone</Label>
                        <Input
                          value={editForm.customer_phone || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                          className="h-10 rounded-xl"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Mesa</Label>
                        <Input
                          value={editForm.table_number || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, table_number: e.target.value }))}
                          className="h-10 rounded-xl"
                          placeholder="Número da mesa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-500">Tipo de Serviço</Label>
                        <div className="flex gap-1">
                          {[
                            { value: "MESA", label: "Mesa" },
                            { value: "DELIVERY", label: "Delivery" },
                            { value: "BALCAO", label: "Balcão" },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setEditForm(prev => ({ ...prev, service_type: opt.value }))}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                                editForm.service_type === opt.value
                                  ? "bg-purple-500 text-white shadow"
                                  : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-500">Observações</Label>
                      <Textarea
                        value={editForm.obs || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, obs: e.target.value }))}
                        className="rounded-xl resize-none"
                        rows={2}
                        placeholder="Observações do pedido..."
                      />
                    </div>
                  </div>

                  {/* Motoboy Section */}
                  {(editForm.service_type === "DELIVERY" || editForm.motoboy_name) && (
                    <div className="p-5 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl border border-purple-500/20 space-y-4">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Package className="h-4 w-4 text-purple-500" />
                        </div>
                        Motoboy / Entrega
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">Nome do Motoboy</Label>
                          <Input
                            value={editForm.motoboy_name || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, motoboy_name: e.target.value }))}
                            className="h-10 rounded-xl"
                            placeholder="Nome"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">Telefone Motoboy</Label>
                          <Input
                            value={editForm.motoboy_phone || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, motoboy_phone: e.target.value }))}
                            className="h-10 rounded-xl"
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery Signature Section */}
                  {(editForm.delivered_by_name || editForm.delivered_at) && (
                    <div className="p-5 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl border border-blue-500/20 space-y-4">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        </div>
                        Assinatura de Entrega
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                          <p className="text-xs text-neutral-500">Entregue por</p>
                          <p className="font-bold text-neutral-900 dark:text-white">{editForm.delivered_by_name || "—"}</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl">
                          <p className="text-xs text-neutral-500">Data/Hora</p>
                          <p className="font-bold text-neutral-900 dark:text-white">
                            {editForm.delivered_at ? new Date(editForm.delivered_at).toLocaleString("pt-BR") : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        Itens do Pedido
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingItem(!isAddingItem)}
                        className="rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                      </Button>
                    </div>

                    {isAddingItem && (
                      <div className="p-4 border rounded-2xl bg-black/5 dark:bg-white/5 space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar produto..."
                            className="pl-9 h-10 rounded-xl"
                            value={itemSearch}
                            onChange={e => setItemSearch(e.target.value)}
                            autoFocus
                          />
                          {filteredProducts.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border rounded-xl shadow-lg max-h-[200px] overflow-y-auto z-10">
                              {filteredProducts.map(product => (
                                <div
                                  key={product.id}
                                  className="p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center"
                                  onClick={() => handleAddItem(product)}
                                >
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-emerald-600 font-bold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {editForm.items?.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                          <div className="flex flex-wrap gap-3 items-center">
                            {/* Product Name */}
                            <span className="font-medium text-neutral-900 dark:text-white flex-1 min-w-[150px]">{item.product_name}</span>

                            {/* Controls Row */}
                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-white dark:bg-black/20 rounded-xl border border-black/10 dark:border-white/10">
                                <button
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      const newItems = [...(editForm.items || [])]
                                      newItems.splice(idx, 1)
                                      setEditForm(prev => ({ ...prev, items: newItems }))
                                    } else {
                                      const newItems = [...(editForm.items || [])]
                                      newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 }
                                      setEditForm(prev => ({ ...prev, items: newItems }))
                                    }
                                  }}
                                  className="h-8 w-8 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-l-xl transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-10 text-center font-bold text-neutral-900 dark:text-white">{item.quantity}</span>
                                <button
                                  onClick={() => {
                                    const newItems = [...(editForm.items || [])]
                                    newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity + 1 }
                                    setEditForm(prev => ({ ...prev, items: newItems }))
                                  }}
                                  className="h-8 w-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-r-xl transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Price */}
                              <span className="font-bold text-emerald-600 min-w-[80px] text-right">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * item.quantity)}
                              </span>

                              {/* Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                                onClick={() => {
                                  const newItems = [...(editForm.items || [])]
                                  newItems.splice(idx, 1)
                                  setEditForm(prev => ({ ...prev, items: newItems }))
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-neutral-500 mt-2">{item.notes}</p>
                          )}
                        </div>
                      ))}
                      {(!editForm.items || editForm.items.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhum item neste pedido.
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-end p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide">Total do Pedido</p>
                        <p className="text-3xl font-bold text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(editForm.items || []))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-neutral-100/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex justify-between items-center gap-4 backdrop-blur-md">
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClosePanel}
                      disabled={isLoading}
                      className="rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg"
                    >
                      {isLoading ? "Salvando..." : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div >
  )
}

// ... (StatsCard, StatusBadge, getStatusColor, formatStatus - keep as is)

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
  const color = getStatusColor(status)
  return (
    <Badge variant="outline" className={cn("border-opacity-50", color)}>
      {formatStatus(status)}
    </Badge>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDENTE": return "border-amber-500 text-amber-500"
    case "EM_PREPARO": return "border-orange-500 text-orange-500"
    case "PRONTO": return "border-emerald-500 text-emerald-500"
    case "SAIU_ENTREGA": return "border-purple-500 text-purple-500"
    case "ENTREGUE": return "border-blue-500 text-blue-500"
    case "CANCELADO": return "border-red-500 text-red-500"
    default: return ""
  }
}

function getStatusGradient(status: string) {
  switch (status) {
    case "PENDENTE": return "from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300"
    case "EM_PREPARO": return "from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300"
    case "PRONTO": return "from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-300"
    case "SAIU_ENTREGA": return "from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300"
    case "ENTREGUE": return "from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
    case "CANCELADO": return "from-red-500/20 to-rose-500/20 text-red-700 dark:text-red-300"
    default: return ""
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "PENDENTE": return "Pendente"
    case "EM_PREPARO": return "Em Preparo"
    case "PRONTO": return "Pronto"
    case "SAIU_ENTREGA": return "Saiu p/ Entrega"
    case "ENTREGUE": return "Entregue"
    case "CANCELADO": return "Cancelado"
    default: return status
  }
}
