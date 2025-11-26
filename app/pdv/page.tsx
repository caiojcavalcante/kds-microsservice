"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Send, Utensils, User, Phone, Hash, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ItemForm = {
  product_name: string
  quantity: number
  notes: string
}

type ServiceType = "MESA" | "BALCAO" | "DELIVERY"

export default function PdvPage() {
  const [serviceType, setServiceType] = useState<ServiceType>("MESA")
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [items, setItems] = useState<ItemForm[]>([
    { product_name: "", quantity: 1, notes: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "quantity" ? Number(value) || 1 : value,
            }
          : item
      )
    )
  }

  function incrementQty(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function decrementQty(index: number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
          : item
      )
    )
  }

  function addItem() {
    setItems((prev) => [...prev, { product_name: "", quantity: 1, notes: "" }])
  }

  function removeItem(index: number) {
    setItems((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  function resetForm() {
    setTableNumber("")
    setCustomerName("")
    setCustomerPhone("")
    setServiceType("MESA")
    setItems([{ product_name: "", quantity: 1, notes: "" }])
    // Keep lastCode visible for a while or clear it? Let's keep it until next submission or manual clear.
  }

  async function submitOrder() {
    setLoading(true)
    try {
      const filteredItems = items.filter((i) => i.product_name.trim() !== "")

      if (filteredItems.length === 0) {
        alert("Adicione ao menos 1 item")
        setLoading(false)
        return
      }

      const body = {
        table_number: serviceType === "MESA" ? tableNumber || null : null,
        customer_name: customerName || null,
        customer_phone:
          serviceType === "DELIVERY" && customerPhone.trim() !== ""
            ? customerPhone
            : null,
        service_type: serviceType,
        source: "PDV",
        items: filteredItems,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Erro ao criar pedido")
      } else {
        const data = await res.json()
        setLastCode(data.code)
        resetForm()
      }
    } finally {
      setLoading(false)
    }
  }

  const isDelivery = serviceType === "DELIVERY"
  const isMesa = serviceType === "MESA"

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDV</h1>
            <p className="text-muted-foreground">
              Ponto de Venda - Lançamento de Pedidos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8">
              Modo Interno
            </Badge>
            <Badge variant="secondary" className="h-8">
              Status: Online
            </Badge>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-l-4 border-l-red-600 shadow-lg">
              <CardHeader>
                <CardTitle>Dados do Pedido</CardTitle>
                <CardDescription>Informações do cliente e serviço</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["MESA", "BALCAO", "DELIVERY"] as ServiceType[]).map(
                      (type) => (
                        <Button
                          key={type}
                          variant={serviceType === type ? "fire" : "outline"}
                          size="sm"
                          onClick={() => setServiceType(type)}
                          className={cn(
                            "w-full text-xs transition-all",
                            serviceType === type && "shadow-fire"
                          )}
                        >
                          {type === "MESA"
                            ? "Mesa"
                            : type === "BALCAO"
                            ? "Balcão"
                            : "Delivery"}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={serviceType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {isMesa && (
                      <div className="space-y-2">
                        <Label htmlFor="table">Número da Mesa</Label>
                        <div className="relative">
                          <Hash className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="table"
                            placeholder="Ex: 10"
                            className="pl-8"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="customer">Nome do Cliente</Label>
                      <div className="relative">
                        <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer"
                          placeholder="Opcional"
                          className="pl-8"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                    </div>

                    {isDelivery && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            placeholder="(xx) xxxxx-xxxx"
                            className="pl-8"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  className="w-full shadow-fire"
                  variant="fire"
                  size="lg"
                  onClick={submitOrder}
                  disabled={loading}
                >
                  {loading ? (
                    "Enviando..."
                  ) : (
                    <>
                      Enviar para Cozinha <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {lastCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full rounded-md bg-green-500/10 p-3 text-center text-sm text-green-500 border border-green-500/20"
                  >
                    Pedido criado: <span className="font-bold">{lastCode}</span>
                  </motion.div>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="h-full shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle>Itens do Pedido</CardTitle>
                  <CardDescription>Adicione os produtos</CardDescription>
                </div>
                <Badge variant="secondary" className="h-6">
                  {items.length} {items.length === 1 ? "item" : "itens"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="group relative grid gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors sm:grid-cols-[1fr,auto,auto]"
                      >
                        <div className="grid gap-2">
                          <div className="relative">
                            <Utensils className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Nome do produto"
                              className="pl-8 font-medium"
                              value={item.product_name}
                              onChange={(e) =>
                                updateItem(idx, "product_name", e.target.value)
                              }
                            />
                          </div>
                          <Input
                            placeholder="Observações (sem cebola, ponto da carne...)"
                            className="text-xs text-muted-foreground"
                            value={item.notes}
                            onChange={(e) =>
                              updateItem(idx, "notes", e.target.value)
                            }
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => decrementQty(idx)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 w-16 text-center"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", e.target.value)
                            }
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => incrementQty(idx)}
                          >
                            +
                          </Button>
                        </div>

                        <div className="flex items-start justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Button
                  variant="outline"
                  className="mt-6 w-full border-dashed"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
