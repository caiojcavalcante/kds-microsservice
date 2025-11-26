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

// --- Types ---

type Option = {
  id: number
  name: string
  price: number
  max?: number
  description?: string | null
}

type Choice = {
  id: number
  name: string
  min: number
  max: number
  options: Option[]
}

type Product = {
  id: number
  name: string
  description?: string
  price: number
  img?: string | null
  choices?: Choice[]
}

type Category = {
  id: number
  name: string
  items: Product[]
}

type CartItem = {
  uniqueId: string // internal ID for React keys
  product: Product
  quantity: number
  selectedOptions: { [choiceId: number]: Option[] }
  notes: string
  totalPrice: number
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
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          className="pl-9 h-12 text-lg"
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
            className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl overflow-hidden max-h-[400px] overflow-y-auto"
          >
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 hover:bg-accent cursor-pointer transition-colors border-b last:border-0"
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

function ProductCustomizer({
  product,
  onClose,
  onConfirm
}: {
  product: Product
  onClose: () => void
  onConfirm: (cartItem: Omit<CartItem, "uniqueId">) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<{ [choiceId: number]: Option[] }>({})
  const [notes, setNotes] = useState("")

  // Initialize required options if needed (optional logic, skipping for simplicity/user freedom)

  const toggleOption = (choice: Choice, option: Option) => {
    setSelectedOptions(prev => {
      const current = prev[choice.id] || []
      const isSelected = current.find(o => o.id === option.id)

      if (isSelected) {
        return { ...prev, [choice.id]: current.filter(o => o.id !== option.id) }
      } else {
        // Check max
        if (choice.max === 1) {
          return { ...prev, [choice.id]: [option] }
        }
        if (current.length >= choice.max) return prev
        return { ...prev, [choice.id]: [...current, option] }
      }
    })
  }

  const calculateTotal = () => {
    let total = product.price
    Object.values(selectedOptions).flat().forEach(opt => {
      total += opt.price
    })
    return total * quantity
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border"
      >
        {/* Header */}
        <div className="p-6 border-b flex gap-6 relative">
           {product.img && (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <Image src={product.img} alt={product.name} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 pr-8">
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
            <div className="mt-2 text-xl font-semibold text-green-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {product.choices?.map(choice => (
            <div key={choice.id} className="space-y-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-lg">{choice.name}</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {choice.min > 0 ? `Obrigatório (Min ${choice.min})` : "Opcional"} • Max {choice.max}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {choice.options.map(option => {
                  const isSelected = (selectedOptions[choice.id] || []).find(o => o.id === option.id)
                  return (
                    <div
                      key={option.id}
                      onClick={() => toggleOption(choice, option)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected 
                          ? "border-red-600 bg-red-500/5 shadow-sm" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                          isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{option.name}</span>
                          {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                        </div>
                      </div>
                      {option.price > 0 && (
                        <span className="text-sm font-medium text-green-500">
                          +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input 
              placeholder="Ex: Sem cebola, ponto da carne..." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 bg-background border rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
          </div>
          
          <Button 
            size="lg" 
            variant="fire" 
            className="w-full sm:w-auto shadow-fire min-w-[200px]"
            onClick={() => onConfirm({
              product,
              quantity,
              selectedOptions,
              notes,
              totalPrice: calculateTotal()
            })}
          >
            Adicionar • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
          </Button>
        </div>
      </motion.div>
    </motion.div>
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
          const optionsText = optionsList.map(o => `+ ${o.name}`).join("\n")
          formattedNotes = formattedNotes ? `${formattedNotes}\n${optionsText}` : optionsText
        }

        return {
          product_name: item.product.name,
          quantity: item.quantity,
          notes: formattedNotes
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
            <Card className="border-l-4 border-l-red-600 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle>Dados do Cliente</CardTitle>
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
                      <Label>Mesa</Label>
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
                    <Label>Cliente</Label>
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
                      <Label>Telefone</Label>
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
              <CardHeader className="pb-4 border-b">
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

              <CardFooter className="flex-col gap-4 border-t p-6 bg-muted/10">
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
                  disabled={loading || cart.length === 0}
                >
                  {loading ? "Enviando..." : (
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
