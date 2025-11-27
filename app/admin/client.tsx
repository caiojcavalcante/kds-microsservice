"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, CheckCircle2, Clock, Flame, Package, Settings, Search, X, Save, Trash2, Plus, Minus, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

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

  // Edit State
  const [editForm, setEditForm] = useState<Partial<OrderRow>>({})
  
  // Add Item State
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [itemSearch, setItemSearch] = useState("")
  const [newItem, setNewItem] = useState<OrderItem>({ product_name: "", quantity: 1, notes: "", price: 0, total_price: 0 })

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
    return items.reduce((acc, item) => acc + (item.total_price || 0), 0)
  }

  return (
    <div className="space-y-8">
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
          title="Total"
          value={total}
          icon={Package}
          description="Últimos 100 pedidos"
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

      {/* Edit Panel (Sheet) */}
      <AnimatePresence>
        {isPanelOpen && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClosePanel}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 h-full w-full sm:w-[600px] bg-background shadow-2xl border-l flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-lg font-semibold">Editar Pedido</h2>
                  <p className="text-sm text-muted-foreground">#{selectedOrder.code}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClosePanel}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Status */}
                <div className="space-y-4">
                  <Label>Status do Pedido</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["PENDENTE", "EM_PREPARO", "PRONTO", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].map(status => (
                      <Button
                        key={status}
                        variant={editForm.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditForm(prev => ({ ...prev, status }))}
                        className={cn(
                          "justify-start font-medium",
                          editForm.status === status && getStatusColor(status),
                          editForm.status === status ? "ring-2 ring-offset-2 ring-offset-background bg-transparent" : "opacity-70 hover:opacity-100"
                        )}
                      >
                        {formatStatus(status)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Client Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">Informações do Cliente</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Nome do Cliente</Label>
                      <Input 
                        value={editForm.customer_name || ""} 
                        onChange={e => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                      />
                    </div>
                    {selectedOrder.service_type === "MESA" && (
                      <div className="grid gap-2">
                        <Label>Mesa</Label>
                        <Input 
                          value={editForm.table_number || ""} 
                          onChange={e => setEditForm(prev => ({ ...prev, table_number: e.target.value }))}
                        />
                      </div>
                    )}
                    {selectedOrder.service_type === "DELIVERY" && (
                      <div className="grid gap-2">
                        <Label>Telefone</Label>
                        <Input 
                          value={editForm.customer_phone || ""} 
                          onChange={e => setEditForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Itens do Pedido</h3>
                    <Button variant="outline" size="sm" onClick={() => setIsAddingItem(!isAddingItem)}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                    </Button>
                  </div>

                  {isAddingItem && (
                    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                      <Label>Buscar Produto</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Digite o nome do produto..." 
                          className="pl-8"
                          value={itemSearch}
                          onChange={e => setItemSearch(e.target.value)}
                          autoFocus
                        />
                        {filteredProducts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto z-10">
                            {filteredProducts.map(product => (
                              <div 
                                key={product.id}
                                className="p-2 hover:bg-accent cursor-pointer flex justify-between"
                                onClick={() => handleAddItem(product)}
                              >
                                <span>{product.name}</span>
                                <span className="text-green-600 font-medium">
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
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div className="font-medium flex items-center gap-2">
                            <span className="text-xs bg-background border px-1.5 py-0.5 rounded font-bold">
                              {item.quantity}x
                            </span>
                            {item.product_name}
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-semibold text-green-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_price || 0)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                const newItems = [...(editForm.items || [])]
                                newItems.splice(idx, 1)
                                setEditForm(prev => ({ ...prev, items: newItems }))
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                           <Label className="text-xs text-muted-foreground">Observações / Opcionais</Label>
                           <Textarea 
                              className="h-14 text-xs resize-none"
                              value={item.notes || ""}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                const newItems = [...(editForm.items || [])]
                                newItems[idx] = { ...newItems[idx], notes: e.target.value }
                                setEditForm(prev => ({ ...prev, items: newItems }))
                              }}
                           />
                        </div>
                      </div>
                    ))}
                    {editForm.items?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum item neste pedido.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-lg font-bold">
                      Total: <span className="text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(editForm.items || []))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
                <Button 
                  variant="destructive" 
                  className="text-destructive hover:bg-destructive/10 bg-destructive/10 hover:text-white hover:bg-destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClosePanel} disabled={isLoading}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} className="shadow-fire" variant="fire">
                    {isLoading ? "Salvando..." : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
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
