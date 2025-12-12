"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, Flame, Package, Settings, Search, X, Save, Trash2, Plus, Minus, ChevronDown, Calendar, Wallet, CreditCard, Banknote, QrCode, Printer, ChefHat, Truck, ArrowRight, TrendingUp, Lock, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, Area, AreaChart } from "recharts"

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

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

type CashSession = {
  id: string
  opened_at: string
  closed_at: string | null
  opened_by_id: string
  opened_by_name: string
  closed_by_id: string | null
  closed_by_name: string | null
  initial_balance: number
  expected_cash: number | null
  counted_cash: number | null
  variance: number | null
  total_sales: number
  total_pix: number
  total_card: number
  total_cash_sales: number
  order_count: number
  notes: string | null
  status: 'OPEN' | 'CLOSED'
}

// Stats Card Component
function StatsCard({ title, value, icon: Icon, description, className }: { title: string, value: number | string, icon: any, description?: string, className?: string }) {
  return (
    <Card className={cn("bg-neutral-900 border-neutral-800 shadow-xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-neutral-100">{value}</div>
        {description && (
          <p className="text-xs text-neutral-500 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDENTE: "bg-amber-500/20 text-amber-500 border-amber-500/20",
    EM_PREPARO: "bg-orange-600/20 text-orange-500 border-orange-600/20",
    PRONTO: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20",
    SAIU_ENTREGA: "bg-blue-500/20 text-blue-500 border-blue-500/20",
    ENTREGUE: "bg-neutral-800 text-neutral-400 border-neutral-700",
    CANCELADO: "bg-red-500/20 text-red-500 border-red-500/20",
  }

  const labels: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_PREPARO: "Em Preparo",
    PRONTO: "Pronto",
    SAIU_ENTREGA: "Saiu p/ Entrega",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  }

  return (
    <Badge variant="outline" className={cn("font-medium", styles[status] || "bg-neutral-800 text-neutral-400")}>
      {labels[status] || status}
    </Badge>
  )
}

// Helper for status colors
const getStatuslinear = (status: string) => {
  switch (status) {
    case 'PENDENTE': return 'from-amber-400 to-amber-600 text-white'
    case 'EM_PREPARO': return 'from-orange-500 to-red-600 text-white'
    case 'PRONTO': return 'from-emerald-400 to-emerald-600 text-white'
    case 'SAIU_ENTREGA': return 'from-blue-400 to-blue-600 text-white'
    case 'ENTREGUE': return 'from-neutral-600 to-neutral-800 text-neutral-300'
    case 'CANCELADO': return 'from-red-600 to-red-900 text-white'
    default: return 'from-neutral-700 to-neutral-900'
  }
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_PREPARO: "Em Preparo",
    PRONTO: "Pronto",
    SAIU_ENTREGA: "Saiu p/ Entrega",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  }
  return map[status] || status
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
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
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
    <div className="space-y-8 bg-neutral-950/40 backdrop-blur-xl rounded-4xl min-h-screen text-neutral-100 p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Painel Administrativo</h1>
          <p className="text-neutral-400">Visão geral e operação</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            Sistema Online
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="bg-neutral-900 border border-neutral-800 p-1 rounded-2xl h-auto inline-flex">
            <TabsTrigger value="orders" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all">Pedidos</TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all">Produtos</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all">Analytics</TabsTrigger>
            <TabsTrigger value="caixa" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all">Caixa</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Novos"
              value={stats["PENDENTE"] || 0}
              icon={Clock}
              className="border-l-4 border-l-amber-500 bg-neutral-900/50 backdrop-blur-sm"
            />
            <StatsCard
              title="Em Preparo"
              value={stats["EM_PREPARO"] || 0}
              icon={Flame}
              className="border-l-4 border-l-orange-500 bg-neutral-900/50 backdrop-blur-sm"
            />
            <StatsCard
              title="Prontos"
              value={stats["PRONTO"] || 0}
              icon={CheckCircle2}
              className="border-l-4 border-l-emerald-500 bg-neutral-900/50 backdrop-blur-sm"
            />
            <StatsCard
              title="Total (Hoje)"
              value={analytics.totalOrders}
              icon={Package}
              description="Pedidos realizados hoje"
              className="bg-neutral-900/50 backdrop-blur-sm"
            />
          </div>

          <Card className="bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-neutral-800/50 border-b border-neutral-800">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Últimos Pedidos</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Gerencie os pedidos em tempo real
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-neutral-600">
                  <Package className="h-16 w-16 mb-4 opacity-20" />
                  <p>Nenhum pedido encontrado</p>
                </div>
              ) : (
                <div className="w-full overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-900/50">
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="h-12 px-6 text-left font-medium">Código</th>
                        <th className="h-12 px-6 text-left font-medium">Status</th>
                        <th className="h-12 px-6 text-left font-medium">Tipo</th>
                        <th className="h-12 px-6 text-left font-medium">Cliente</th>
                        <th className="h-12 px-6 text-left font-medium">Horário</th>
                        <th className="h-12 px-6 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => handleSelectOrder(order)}
                          className="border-b border-neutral-800 transition-all hover:bg-neutral-800/50 cursor-pointer group"
                        >
                          <td className="p-6 font-mono font-bold text-amber-500 group-hover:text-amber-400">#{order.code}</td>
                          <td className="p-6"><StatusBadge status={order.status} /></td>
                          <td className="p-6">
                            <Badge variant="outline" className="border-neutral-700 text-neutral-400 bg-neutral-800/50 text-[10px] tracking-wider uppercase">
                              {order.service_type}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                              <span className="font-medium text-neutral-200">{order.customer_name || "Cliente Balcão"}</span>
                              {order.table_number && <span className="text-xs text-amber-600 font-medium">Mesa {order.table_number}</span>}
                            </div>
                          </td>
                          <td className="p-6 text-neutral-500 font-mono text-xs">
                            {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-6 text-right font-bold text-emerald-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(order.items))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Revenue Component */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Wallet className="h-32 w-32" />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">Faturamento Hoje</p>
              <h3 className="text-4xl font-bold text-white mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analytics.totalRevenue)}
              </h3>
              <div className="flex items-center text-emerald-500 text-sm mt-4">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Receita acumulada</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ChefHat className="h-32 w-32" />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">Pedidos Hoje</p>
              <h3 className="text-4xl font-bold text-white mb-2">{analytics.totalOrders}</h3>
              <div className="flex items-center text-blue-500 text-sm mt-4">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Volume de Vendas</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ArrowRight className="h-32 w-32" />
              </div>
              <p className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-2">Ticket Médio</p>
              <h3 className="text-4xl font-bold text-white mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(analytics.avgTicket)}
              </h3>
              <div className="flex items-center text-amber-500 text-sm mt-4">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Performance Média</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2 bg-neutral-900 border-neutral-800 shadow-xl max-w-full">
              <CardHeader>
                <CardTitle className="text-white">Movimento Horário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full max-w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="Vendas" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800 shadow-xl max-w-full">
              <CardHeader>
                <CardTitle className="text-white">Top Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-neutral-700 shrink-0">
                        {item.img && <img src={item.img} className="h-full w-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-neutral-400">{item.count} vendidos</p>
                      </div>
                      <div className="text-lg font-bold text-amber-500">#{idx + 1}</div>
                    </div>
                  ))}
                  {analytics.topItems.length === 0 && <p className="text-neutral-500 text-center py-4">Sem dados hoje</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="caixa" className="space-y-6">
          <CaixaTab orders={orders} calculateOrderTotal={calculateOrderTotal} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal (Redesigned) */}
      <AnimatePresence>
        {isPanelOpen && selectedOrder && (
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePanel}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              style={{ willChange: 'opacity' }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85dvh] flex flex-col z-20"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="p-6 border-b border-neutral-800 bg-neutral-900 flex justify-between items-start z-10 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    #{selectedOrder.code}
                    <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10">
                      {selectedOrder.status}
                    </Badge>
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">{selectedOrder.customer_name || "Cliente Balcão"} • Mesa {selectedOrder.table_number || "—"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClosePanel} className="text-neutral-400 hover:text-white">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status Controls */}
                <div className="space-y-4">
                  <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Status do Pedido</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["PENDENTE", "EM_PREPARO", "PRONTO", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].map(status => (
                      <button
                        key={status}
                        onClick={() => setEditForm(prev => ({ ...prev, status }))}
                        className={cn(
                          "py-2 px-1 rounded-lg text-xs font-medium border transition-all",
                          editForm.status === status
                            ? `border-transparent ${getStatuslinear(status)} shadow-lg`
                            : "border-neutral-800 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800"
                        )}
                      >
                        {formatStatus(status)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Col: Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider">Itens do Pedido</Label>
                      <Button size="sm" variant="ghost" className="text-amber-500 hover:bg-amber-500/10 h-8" onClick={() => setIsAddingItem(!isAddingItem)}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar
                      </Button>
                    </div>

                    {isAddingItem && (
                      <div className="p-3 bg-neutral-800 rounded-xl space-y-3 border border-neutral-700">
                        <Input
                          placeholder="Buscar produto..."
                          className="bg-neutral-900 border-neutral-700 text-white"
                          value={itemSearch}
                          onChange={e => setItemSearch(e.target.value)}
                          autoFocus
                        />
                        {filteredProducts.length > 0 && (
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {filteredProducts.map(p => (
                              <div key={p.id} onClick={() => handleAddItem(p)} className="p-2 hover:bg-neutral-700 rounded-lg cursor-pointer flex justify-between text-sm text-neutral-300">
                                <span>{p.name}</span>
                                <span className="text-emerald-500 font-bold">R${p.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {editForm.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-neutral-800/30 border border-neutral-800 rounded-xl group hover:border-neutral-700 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
                              <button className="h-5 w-8 flex items-center justify-center hover:bg-neutral-700 text-neutral-400" onClick={() => {
                                const newItems = [...(editForm.items || [])]
                                newItems[idx].quantity++
                                setEditForm(prev => ({ ...prev, items: newItems }))
                              }}><Plus className="h-3 w-3" /></button>
                              <span className="text-xs font-bold text-white py-0.5">{item.quantity}</span>
                              <button className="h-5 w-8 flex items-center justify-center hover:bg-neutral-700 text-neutral-400" onClick={() => {
                                const newItems = [...(editForm.items || [])];
                                if (newItems[idx].quantity > 1) { newItems[idx].quantity--; }
                                else { newItems.splice(idx, 1); }
                                setEditForm(prev => ({ ...prev, items: newItems }))
                              }}><Minus className="h-3 w-3" /></button>
                            </div>
                            <div>
                              <p className="font-medium text-neutral-200">{item.product_name}</p>
                              {item.notes && <p className="text-xs text-neutral-500">{item.notes}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-500">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * item.quantity)}
                            </p>
                            <button onClick={() => {
                              const newItems = [...(editForm.items || [])];
                              newItems.splice(idx, 1);
                              setEditForm(prev => ({ ...prev, items: newItems }))
                            }} className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Remover</button>
                          </div>
                        </div>
                      ))}
                      {(!editForm.items || editForm.items.length === 0) && <p className="text-neutral-500 text-sm text-center py-4">Nenhum item</p>}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                      <span className="text-neutral-400 font-medium">Total</span>
                      <span className="text-2xl font-bold text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(editForm.items || []))}
                      </span>
                    </div>
                  </div>

                  {/* Right Col: Details */}
                  <div className="space-y-6">
                    <div className="p-5 bg-neutral-800/30 rounded-2xl border border-neutral-800 space-y-4">
                      <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider flex items-center gap-2"><Settings className="h-3 w-3" /> Detalhes do Cliente</Label>
                      <div className="space-y-3">
                        <Input
                          placeholder="Nome do Cliente"
                          value={editForm.customer_name || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                          className="bg-neutral-900 border-neutral-800 text-white"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Telefone"
                            value={editForm.customer_phone || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                            className="bg-neutral-900 border-neutral-800 text-white"
                          />
                          <Input
                            placeholder="Mesa"
                            value={editForm.table_number || ''}
                            onChange={e => setEditForm(prev => ({ ...prev, table_number: e.target.value }))}
                            className="bg-neutral-900 border-neutral-800 text-white"
                          />
                        </div>
                        <Textarea
                          placeholder="Observações"
                          value={editForm.obs || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, obs: e.target.value }))}
                          className="bg-neutral-900 border-neutral-800 text-white resize-none"
                        />
                      </div>
                    </div>

                    <div className="p-5 bg-neutral-800/30 rounded-2xl border border-neutral-800 space-y-4">
                      <Label className="uppercase text-xs font-bold text-neutral-500 tracking-wider flex items-center gap-2"><CreditCard className="h-3 w-3" /> Pagamento</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["PIX", "CREDIT_CARD", "MAQUININHA", "DINHEIRO"].map(type => (
                          <button
                            key={type}
                            onClick={() => setEditForm(prev => ({ ...prev, billingType: type }))}
                            className={cn(
                              "px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center",
                              editForm.billingType === type ? "bg-amber-500/20 border-amber-500/50 text-amber-500" : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                            )}
                          >
                            {type === 'CREDIT_CARD' ? 'CARTÃO' : type}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                        <div className={`h-3 w-3 rounded-full ${editForm.payment_status === 'PAYMENT_RECEIVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-medium text-neutral-300">
                          {editForm.payment_status === 'PAYMENT_RECEIVED' ? 'PAGO' : 'PENDENTE DE PAGAMENTO'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-between items-center">
                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={handleDelete} disabled={isLoading}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir Pedido
                </Button>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={handleClosePanel} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">Cancelar</Button>
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                  </Button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CaixaTab({ orders, calculateOrderTotal }: { orders: OrderRow[], calculateOrderTotal: (items: OrderItem[] | null) => number }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all')

  const [currentSession, setCurrentSession] = useState<CashSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const [initialBalance, setInitialBalance] = useState("")
  const [countedCash, setCountedCash] = useState("")
  const [closeNotes, setCloseNotes] = useState("")
  const [operatorName, setOperatorName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payingOrder, setPayingOrder] = useState<OrderRow | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'MAQUININHA' | 'DINHEIRO'>('DINHEIRO')
  const [receivedAmount, setReceivedAmount] = useState("")
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    fetchCurrentSession()
  }, [])

  async function fetchCurrentSession() {
    setSessionLoading(true)
    try {
      const res = await fetch("/api/caixa?current=true")
      const data = await res.json()
      setCurrentSession(data)
    } catch (err) {
      console.error("Error fetching session:", err)
    } finally {
      setSessionLoading(false)
    }
  }

  const caixaData = useMemo(() => {
    const dateStart = new Date(selectedDate + 'T00:00:00')
    const dateEnd = new Date(selectedDate + 'T23:59:59')

    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at)
      return orderDate >= dateStart && orderDate <= dateEnd && o.status !== 'CANCELADO'
    })

    const isPaid = (o: OrderRow) => {
      const paidStatuses = ['PAYMENT_RECEIVED', 'PAGO', 'RECEIVED', 'CONFIRMED']
      return paidStatuses.includes(o.payment_status?.toUpperCase() || '')
    }

    const paidOrders = dayOrders.filter(isPaid)
    const pendingOrders = dayOrders.filter(o => !isPaid(o))

    const totalRevenue = dayOrders.reduce((acc, o) => acc + (o.total || calculateOrderTotal(o.items)), 0)
    const paidRevenue = paidOrders.reduce((acc, o) => acc + (o.total || calculateOrderTotal(o.items)), 0)
    const pendingRevenue = pendingOrders.reduce((acc, o) => acc + (o.total || calculateOrderTotal(o.items)), 0)

    const paymentMethods: Record<string, { count: number; total: number }> = {
      PIX: { count: 0, total: 0 },
      CREDIT_CARD: { count: 0, total: 0 },
      MAQUININHA: { count: 0, total: 0 },
      DINHEIRO: { count: 0, total: 0 },
    }

    dayOrders.forEach(o => {
      const method = o.billingType?.toUpperCase() || 'DINHEIRO'
      const orderTotal = o.total || calculateOrderTotal(o.items)
      if (paymentMethods[method]) {
        paymentMethods[method].count += 1
        paymentMethods[method].total += orderTotal
      } else {
        paymentMethods.DINHEIRO.count += 1
        paymentMethods.DINHEIRO.total += orderTotal
      }
    })

    let filteredOrders = dayOrders
    if (paymentFilter === 'paid') filteredOrders = paidOrders
    if (paymentFilter === 'pending') filteredOrders = pendingOrders

    return {
      dayOrders,
      paidOrders,
      pendingOrders,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      paymentMethods,
      filteredOrders,
      isPaid,
    }
  }, [orders, selectedDate, paymentFilter, calculateOrderTotal])

  async function handleOpenCaixa() {
    if (!operatorName.trim()) { toast.error("Informe o nome"); return }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/caixa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initial_balance: parseFloat(initialBalance) || 0, opened_by_name: operatorName.trim() })
      })
      if (!res.ok) throw new Error("Erro ao abrir caixa")
      setCurrentSession(await res.json())
      setShowOpenModal(false); setInitialBalance(""); setOperatorName(""); toast.success("Caixa aberto!")
    } catch { toast.error("Erro ao abrir caixa") } finally { setIsSubmitting(false) }
  }

  async function handleCloseCaixa() {
    if (!currentSession) return
    if (!countedCash.trim() || !operatorName.trim()) { toast.error("Preencha todos os campos"); return }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/caixa/${currentSession.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counted_cash: parseFloat(countedCash) || 0, closed_by_name: operatorName.trim(), notes: closeNotes,
          total_sales: caixaData.totalRevenue, total_pix: caixaData.paymentMethods.PIX.total,
          total_card: caixaData.paymentMethods.CREDIT_CARD.total + caixaData.paymentMethods.MAQUININHA.total,
          total_cash_sales: caixaData.paymentMethods.DINHEIRO.total, order_count: caixaData.dayOrders.length
        })
      })
      if (!res.ok) throw new Error("Erro ao fechar")
      setCurrentSession(null); setShowCloseModal(false); setCountedCash(""); setOperatorName(""); toast.success("Caixa fechado!")
    } catch { toast.error("Erro ao fechar") } finally { setIsSubmitting(false) }
  }

  function openPaymentModal(order: OrderRow) {
    setPayingOrder(order); setPaymentMethod('DINHEIRO'); setReceivedAmount(""); setShowPaymentModal(true);
  }

  async function handleProcessPayment() {
    if (!payingOrder) return
    setPaymentProcessing(true)
    try {
      const res = await fetch(`/api/orders/${payingOrder.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "PAYMENT_RECEIVED", billingType: paymentMethod, total: payingOrder.total || calculateOrderTotal(payingOrder.items) })
      })
      if (!res.ok) throw new Error("Erro")
      toast.success("Pagamento confirmado!")
      window.location.reload()
    } catch { toast.error("Erro ao confirmar") } finally { setPaymentProcessing(false) }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="space-y-6">
      {/* Session Banner */}
      {sessionLoading ? <div className="h-24 rounded-2xl bg-neutral-900 animate-pulse border border-neutral-800" /> : currentSession ? (
        <div className="rounded-2xl bg-linear-to-r from-emerald-900/40 to-neutral-900 border border-emerald-500/20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Caixa Aberto</h3>
              <p className="text-neutral-400 text-sm">Operador: {currentSession.opened_by_name} • Fundo: {formatCurrency(currentSession.initial_balance)}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setShowCloseModal(true)} className="bg-red-600 hover:bg-red-700 text-white">Fechar Caixa</Button>
        </div>
      ) : (
        <div className="rounded-2xl bg-linear-to-r from-amber-900/40 to-neutral-900 border border-amber-500/20 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-amber-500" /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Caixa Fechado</h3>
              <p className="text-neutral-400 text-sm">Abra o caixa para iniciar as operações</p>
            </div>
          </div>
          <Button onClick={() => setShowOpenModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Abrir Caixa</Button>
        </div>
      )}

      {/* Date Filter & Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-neutral-400">Data</CardTitle></CardHeader>
          <CardContent>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" />
          </CardContent>
        </Card>
        <StatsCard title="Total" value={formatCurrency(caixaData.totalRevenue)} icon={Wallet} className="bg-neutral-900 border-neutral-800" />
        <StatsCard title="Em Dinheiro" value={formatCurrency(caixaData.paymentMethods.DINHEIRO.total)} icon={Banknote} className="bg-neutral-900 border-neutral-800" />
        <StatsCard title="Pix/Cartão" value={formatCurrency(caixaData.totalRevenue - caixaData.paymentMethods.DINHEIRO.total)} icon={CreditCard} className="bg-neutral-900 border-neutral-800" />
      </div>

      {/* Orders Table */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Movimentação do Dia</CardTitle>
            <div className="flex gap-2 text-xs">
              {['all', 'paid', 'pending'].map(f => (
                <button key={f} onClick={() => setPaymentFilter(f as any)} className={cn("px-3 py-1 rounded-lg border transition-all", paymentFilter === f ? "bg-amber-500/20 text-amber-500 border-amber-500/50" : "border-neutral-800 text-neutral-400")}>
                  {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagos' : 'Pendentes'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-800/50 text-neutral-400">
                <tr>
                  <th className="p-4">Pedido</th>
                  <th className="p-4">Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Tipo Pag.</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {caixaData.filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-800/30">
                    <td className="p-4 font-mono text-amber-500">#{order.code}</td>
                    <td className="p-4 text-neutral-500">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-4 font-medium text-neutral-300">{order.customer_name || '—'}</td>
                    <td className="p-4 text-neutral-400">{order.billingType}</td>
                    <td className="p-4 text-right font-bold text-emerald-500">{formatCurrency(order.total || calculateOrderTotal(order.items))}</td>
                    <td className="p-4 text-center">
                      {caixaData.isPaid(order) ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Pago</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendente</Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {!caixaData.isPaid(order) && (
                        <Button size="sm" onClick={() => openPaymentModal(order)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">Receber</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {caixaData.filteredOrders.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-neutral-500">Nenhum movimento</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals for Open/Close/Payment */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Operador</Label><Input value={operatorName} onChange={e => setOperatorName(e.target.value)} className="bg-neutral-800 border-neutral-700" /></div>
            <div className="space-y-2"><Label>Fundo de Caixa (R$)</Label><Input type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="bg-neutral-800 border-neutral-700" /></div>
          </div>
          <DialogFooter><Button onClick={handleOpenCaixa} disabled={isSubmitting} className="bg-emerald-600 text-white">Confirmar Abertura</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" />
              Fechar Caixa
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Session Summary */}
            <div className="bg-neutral-800/50 p-4 rounded-xl space-y-3 border border-neutral-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Aberto por:</span>
                <span className="font-medium text-white flex items-center gap-1">
                  <User className="h-3 w-3" /> {currentSession?.opened_by_name}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Valor em Dinheiro (Vendas):</span>
                <span className="font-mono text-emerald-500">
                  + {formatCurrency(caixaData.paymentMethods.DINHEIRO.total)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Fundo Inicial:</span>
                <span className="font-mono text-neutral-300">
                  + {formatCurrency(currentSession?.initial_balance || 0)}
                </span>
              </div>
              <div className="border-t border-dashed border-neutral-700 pt-2 flex justify-between items-center">
                <span className="font-bold text-amber-500">Esperado em Gaveta:</span>
                <span className="font-bold font-mono text-xl text-amber-500">
                  {formatCurrency((currentSession?.initial_balance || 0) + caixaData.paymentMethods.DINHEIRO.total)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quem está fechando?</Label>
                <Input
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-neutral-950 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Contado (Gaveta)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                  <Input
                    type="number"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    className="bg-neutral-950 border-neutral-700 pl-8 font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações (Diferenças, sangrias...)</Label>
                <Textarea
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  className="bg-neutral-950 border-neutral-700 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCloseModal(false)} variant="ghost" className="text-neutral-400 hover:text-white">Cancelar</Button>
            <Button onClick={handleCloseCaixa} disabled={isSubmitting} variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Lock className="h-4 w-4 mr-2" /> Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-500" />
              Receber Pagamento
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="text-center space-y-1">
              <p className="text-neutral-400 text-sm">Total a Receber</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {payingOrder && formatCurrency(payingOrder.total || calculateOrderTotal(payingOrder.items))}
              </p>
            </div>

            {/* Online Payment Info (Pix/Link) if available */}
            {(payingOrder?.encodedImage || payingOrder?.invoiceUrl || payingOrder?.copiaecola) && (
              <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800 space-y-4">
                <Label className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <QrCode className="h-3 w-3" /> Pagamento Digital
                </Label>

                <div className="flex gap-4">
                  {payingOrder.encodedImage && (
                    <div className="bg-white p-2 rounded-lg shrink-0">
                      <img src={`data:image/png;base64,${payingOrder.encodedImage}`} alt="QR Code" className="h-24 w-24" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3 min-w-0">
                    {payingOrder.copiaecola && (
                      <div className="space-y-1">
                        <p className="text-xs text-neutral-400">Pix Copia e Cola</p>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-neutral-950 p-2 rounded border border-neutral-700 text-[10px] break-all h-16 overflow-y-auto">
                            {payingOrder.copiaecola}
                          </code>
                          <Button size="icon" variant="secondary" className="h-8 w-8 shrink-0" onClick={() => {
                            navigator.clipboard.writeText(payingOrder.copiaecola!)
                            toast.success("Copiado!")
                          }}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {payingOrder.invoiceUrl && (
                      <Button asChild variant="outline" size="sm" className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                        <a href={payingOrder.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          Abrir Link de Pagamento <ArrowRight className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Método de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {['DINHEIRO', 'PIX', 'CREDIT_CARD', 'MAQUININHA'].map(m => (
                  <Button
                    key={m}
                    variant={paymentMethod === m ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod(m as any)}
                    className={cn(
                      "h-12",
                      paymentMethod === m
                        ? "bg-amber-500 text-black hover:bg-amber-600 border-transparent shadow-lg shadow-amber-500/20"
                        : "bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    )}
                  >
                    {m === 'CREDIT_CARD' ? 'CARTÃO' : m}
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === 'DINHEIRO' && (
              <div className="space-y-2 bg-neutral-800/30 p-4 rounded-xl border border-neutral-800">
                <Label>Valor Recebido (Dinheiro)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R$</span>
                  <Input
                    type="number"
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(e.target.value)}
                    className="bg-neutral-950 border-neutral-700 pl-8 font-mono text-lg"
                  />
                </div>
                {receivedAmount && parseFloat(receivedAmount) > (Math.max(0, payingOrder?.total || 0)) && (
                  <div className="flex justify-between items-center pt-2 text-emerald-500">
                    <span className="font-bold">Troco:</span>
                    <span className="font-bold font-mono text-lg">
                      {formatCurrency(parseFloat(receivedAmount) - (payingOrder?.total || calculateOrderTotal(payingOrder?.items || null)))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleProcessPayment} disabled={paymentProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-bold shadow-lg shadow-emerald-500/20">
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
