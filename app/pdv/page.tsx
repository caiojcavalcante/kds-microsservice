"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Send, User, Phone, Hash, Search, X, ChevronDown, ChevronUp, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ProductCustomizer, Product, CartItem, Option, Choice } from "@/components/product-customizer"

type Category = {
  id: number
  name: string
  items: Product[]
}

type ServiceType = "MESA" | "BALCAO" | "DELIVERY"

// --- Components ---

function ProductSearch({
  menu,
  onSelect
}: {
  menu: Category[],
  onSelect: (product: Product) => void
}) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    const results: Product[] = []

    menu.forEach(category => {
      category.items.forEach(item => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
          results.push(item)
        }
      })
    })
    return results.slice(0, 10) // Limit results
  }, [query, menu])

  return (
    <div className="relative w-full z-20">
      <div className="relative flex items-center">
        <Search className="absolute left-5 inset-y-auto h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          className="pl-12 h-12 text-lg"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false) }}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-lg shadow-xl overflow-hidden max-h-[400px] overflow-y-auto"
          >
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 hover:bg-accent cursor-pointer transition-colors last:border-0"
                onClick={() => {
                  onSelect(product)
                  setIsOpen(false)
                  setQuery("")
                }}
              >
                {product.img ? (
                  <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    <Image
                      src={product.img}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <span className="text-xs">Sem img</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium truncate">{product.name}</h4>
                    <span className="text-sm font-semibold text-green-500 whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}



// --- Main Page ---

export default function PdvPage() {
  const [serviceType, setServiceType] = useState<ServiceType>("MESA")
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)

  const [menu, setMenu] = useState<Category[]>([])
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetch("/cardapio.json")
      .then(res => res.json())
      .then(data => setMenu(data))
      .catch(err => console.error("Erro ao carregar cardapio:", err))
  }, [])

  const addToCart = (item: Omit<CartItem, "uniqueId">) => {
    setCart(prev => [...prev, { ...item, uniqueId: Math.random().toString(36).substr(2, 9) }])
    setConfiguringProduct(null)
  }

  const removeFromCart = (uniqueId: string) => {
    setCart(prev => prev.filter(item => item.uniqueId !== uniqueId))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

  async function submitOrder() {
    setLoading(true)
    try {
      if (cart.length === 0) {
        alert("Adicione ao menos 1 item")
        setLoading(false)
        return
      }

      // Map cart items to API format
      const apiItems = cart.map(item => {
        // Format options into notes or name
        let formattedNotes = item.notes
        const optionsList = Object.values(item.selectedOptions).flat()
        if (optionsList.length > 0) {
          const optionsText = optionsList.map(o => {
            const priceStr = o.price > 0 ? ` (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.price)})` : ""
            return `+ ${o.name}${priceStr}`
          }).join("\n")
          formattedNotes = formattedNotes ? `${formattedNotes}\n${optionsText}` : optionsText
        }

        return {
          product_name: item.product.name,
          quantity: item.quantity,
          notes: formattedNotes,
          price: item.product.price
        }
      })

      const body = {
        table_number: serviceType === "MESA" ? tableNumber || null : null,
        customer_name: customerName || null,
        customer_phone: serviceType === "DELIVERY" && customerPhone.trim() !== "" ? customerPhone : null,
        service_type: serviceType,
        source: "PDV",
        items: apiItems,
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
        // Reset form
        setTableNumber("")
        setCustomerName("")
        setCustomerPhone("")
        setCart([])
      }
    } finally {
      setLoading(false)
    }
  }

  const isClientDataValid = () => {
    if (serviceType === "MESA") return tableNumber.trim().length > 0
    if (serviceType === "DELIVERY") return customerName.trim().length > 0 && customerPhone.trim().length > 0
    if (serviceType === "BALCAO") return customerName.trim().length > 0
    return false
  }

  const isDelivery = serviceType === "DELIVERY"
  const isMesa = serviceType === "MESA"

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 pb-32 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PDV</h1>
            <p className="text-muted-foreground">Novo Pedido</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8">Modo Interno</Badge>
            <Badge variant="secondary" className="h-8">Online</Badge>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12 h-full">
          {/* Left Column: Customer Info & Search */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Info Card */}
            <Card className={cn("border-l-4 shadow-lg transition-colors", isClientDataValid() ? "border-l-green-500" : "border-l-red-600")}>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  Dados do Cliente
                  {!isClientDataValid() && <span className="text-xs text-red-500 font-normal">* Obrigatório</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(["MESA", "BALCAO", "DELIVERY"] as ServiceType[]).map((type) => (
                    <Button
                      key={type}
                      variant={serviceType === type ? "fire" : "outline"}
                      size="sm"
                      onClick={() => setServiceType(type)}
                      className={cn("w-full text-xs", serviceType === type && "shadow-fire")}
                    >
                      {type === "MESA" ? "Mesa" : type === "BALCAO" ? "Balcão" : "Delivery"}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isMesa && (
                    <div className="space-y-2">
                      <Label className={cn(tableNumber.trim() === "" && "text-red-500")}>Mesa *</Label>
                      <div className="relative">
                        <Hash className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nº"
                          className="pl-8"
                          value={tableNumber}
                          onChange={e => setTableNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className={cn((isDelivery || serviceType === "BALCAO") && customerName.trim() === "" && "text-red-500")}>
                      Cliente {(isDelivery || serviceType === "BALCAO") && "*"}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nome"
                        className="pl-8"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                      />
                    </div>
                  </div>
                  {isDelivery && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className={cn(customerPhone.trim() === "" && "text-red-500")}>Telefone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="(xx) xxxxx-xxxx"
                          className="pl-8"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Adicionar Produto</Label>
              <ProductSearch menu={menu} onSelect={setConfiguringProduct} />
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <Card className="flex-1 flex flex-col shadow-lg border-t-4 border-t-red-600 h-[calc(100vh-200px)] sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle>Resumo do Pedido</CardTitle>
                  <Badge variant="secondary">{cart.length} itens</Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-0">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="h-8 w-8 opacity-50" />
                    </div>
                    <p>Nenhum item adicionado.</p>
                    <p className="text-sm">Busque produtos ao lado para começar.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.uniqueId} className="p-4 hover:bg-muted/30 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium">
                            <span className="text-red-600 font-bold mr-2">{item.quantity}x</span>
                            {item.product.name}
                          </div>
                          <div className="font-semibold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                          </div>
                        </div>

                        {/* Options */}
                        <div className="text-sm text-muted-foreground pl-6 space-y-1">
                          {Object.values(item.selectedOptions).flat().map((opt, i) => (
                            <div key={i} className="flex justify-between">
                              <span>+ {opt.name}</span>
                              {opt.price > 0 && <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.price)}</span>}
                            </div>
                          ))}
                          {item.notes && (
                            <div className="text-xs italic mt-1 text-yellow-600/80 dark:text-yellow-500/80">
                              Obs: {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.uniqueId)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex-col gap-4 p-6 bg-muted/10">
                <div className="flex justify-between w-full text-lg font-bold">
                  <span>Total</span>
                  <span className="text-2xl text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                  </span>
                </div>

                <Button
                  className="w-full shadow-fire h-12 text-lg"
                  variant="fire"
                  onClick={submitOrder}
                  disabled={loading || cart.length === 0 || !isClientDataValid()}
                >
                  {loading ? "Enviando..." : !isClientDataValid() ? "Preencha os dados do cliente" : (
                    <>Enviar Pedido <Send className="ml-2 h-5 w-5" /></>
                  )}
                </Button>

                {lastCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full rounded-md bg-green-500/10 p-3 text-center text-sm text-green-500 border border-green-500/20"
                  >
                    Pedido criado com sucesso: <span className="font-bold text-lg block">{lastCode}</span>
                  </motion.div>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Product Customizer Modal */}
      <AnimatePresence>
        {configuringProduct && (
          <ProductCustomizer
            product={configuringProduct}
            onClose={() => setConfiguringProduct(null)}
            onConfirm={addToCart}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
