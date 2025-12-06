"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Trash2, Send, CreditCard, Wallet, Banknote, ShoppingCart, ChevronLeft, ChevronRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/contexts/cart-context"
import { cn } from "@/lib/utils"
import { useMenu } from "@/hooks/use-menu"
import Image from "next/image"

type ServiceType = "MESA" | "DELIVERY" | "BALCAO"

function UpsellItem({ drink, addToCart }: { drink: any, addToCart: any }) {
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = () => {
    addToCart({
      product: drink,
      quantity: 1,
      selectedOptions: {},
      notes: "",
      totalPrice: drink.price
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <div className="relative flex-shrink-0 w-32 bg-background rounded-xl border p-2 shadow-sm flex flex-col gap-2 group">
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
        {drink.img && (
          <Image src={drink.img} alt={drink.name} fill className="object-cover" />
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleAdd}
        className={cn(
          "absolute top-1 right-1 h-8 w-8 rounded-full shadow-md z-10 flex items-center justify-center transition-colors duration-300",
          isAdded ? "bg-green-500 text-white" : "bg-black text-red-500 hover:bg-black/90"
        )}
      >
        <AnimatePresence mode="wait">
          {isAdded ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="cart"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.2 }}
            >
              <ShoppingCart className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium line-clamp-2 leading-tight" title={drink.name}>{drink.name}</p>
        <p className="text-sm text-green-600 font-bold">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(drink.price)}
        </p>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { menu } = useMenu()
  const { cart, removeFromCart, cartTotal, clearCart, addToCart, updateQuantity } = useCart()
  const [loading, setLoading] = useState(false)
  const [successCode, setSuccessCode] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = 200
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" })
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" })
      }
    }
  }

  // Get drinks for upsell (assuming category id 2 is drinks or searching by name)
  // For now, let's find the category named "Bebidas" or similar, or just take the last category
  const drinksCategory = menu.find((cat) => cat.name.toLowerCase().includes("cervejas")) || menu[menu.length - 1]
  const drinks = drinksCategory?.items.slice(0, 5) || []

  // Form State
  const [serviceType, setServiceType] = useState<ServiceType>("MESA")
  const [tableNumber, setTableNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CREDITO")

  const isClientDataValid = () => {
    if (serviceType === "MESA") return tableNumber.trim().length > 0
    if (serviceType === "DELIVERY") return customerName.trim().length > 0 && customerPhone.trim().length > 0
    if (serviceType === "BALCAO") return customerName.trim().length > 0
    return false
  }

  async function submitOrder() {
    setLoading(true)
    try {
      // Map cart items to API format
      const apiItems = cart.map(item => {
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
        customer_phone: serviceType === "DELIVERY" ? customerPhone : null,
        service_type: serviceType,
        source: "AUTO_ATENDIMENTO", // Distinguish from PDV
        items: apiItems,
        payment_method: paymentMethod // Assuming API handles this or we add it to notes
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
        setSuccessCode(data.code)
        clearCart()
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (successCode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"
        >
          <Send className="h-12 w-12" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Pedido Enviado!</h1>
          <p className="text-muted-foreground">Seu pedido foi recebido pela cozinha.</p>
        </div>
        <div className="bg-muted p-6 rounded-xl border border-border w-full max-w-sm">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Código do Pedido</p>
          <p className="text-4xl font-mono font-bold text-foreground mt-2">{successCode}</p>
        </div>
        <Link href="/cardapio">
          <Button size="lg" variant="outline">Voltar ao Cardápio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-screen overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-red-950/20">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/cardapio">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-950/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Seu Carrinho</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-7 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Trash2 className="h-10 w-10 opacity-50" />
              </div>
              <h2 className="text-xl font-semibold">Seu carrinho está vazio</h2>
              <p className="text-muted-foreground">Adicione itens deliciosos do nosso cardápio.</p>
              <Link href="/cardapio">
                <Button variant="fire" className="mt-4">Ver Cardápio</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {cart.map((item) => (
                  <motion.div
                    key={item.uniqueId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-card border rounded-xl p-1 md:p-2 flex gap-2 md:gap-3 shadow-sm items-center max-w-[calc(100vw-2rem)]"
                  >
                    {/* Image */}
                    <div className="relative h-30 w-30 md:h-24 md:w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product.img && (
                        <Image src={item.product.img} alt={item.product.name} fill className="object-cover" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 px-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg leading-tight">{item.product.name}</h3>
                        <span className="font-bold text-green-500 whitespace-nowrap ml-2">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1 mb-3">
                        {Object.values(item.selectedOptions).flat().map((opt, i) => (
                          <p key={i} className="line-clamp-1">+ {opt.name}</p>
                        ))}
                        {item.notes && <p className="italic text-yellow-600/80 line-clamp-2">Obs: {item.notes}</p>}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.uniqueId, -1)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.uniqueId, 1)}
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => removeFromCart(item.uniqueId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        {cart.length > 0 && (
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-red-950/20 shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle>Finalizar Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Type */}
                <div className="space-y-3">
                  <Label>Como deseja receber?</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["MESA", "BALCAO", "DELIVERY"] as ServiceType[]).map((type) => (
                      <div
                        key={type}
                        onClick={() => setServiceType(type)}
                        className={cn(
                          "cursor-pointer rounded-lg border-2 p-2 md:p-3 text-center text-xs md:text-sm font-medium transition-all hover:bg-accent",
                          serviceType === type
                            ? "border-red-600 bg-red-600/5 text-red-600"
                            : "border-muted bg-transparent text-muted-foreground"
                        )}
                      >
                        {type === "MESA" ? "Na Mesa" : type === "BALCAO" ? "Retirar" : "Delivery"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                  {serviceType === "MESA" && (
                    <div className="space-y-2">
                      <Label>Número da Mesa</Label>
                      <Input
                        placeholder="Ex: 12"
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Seu Nome</Label>
                    <Input
                      placeholder="Como podemos te chamar?"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>

                  {serviceType === "DELIVERY" && (
                    <div className="space-y-2">
                      <Label>Telefone / WhatsApp</Label>
                      <Input
                        placeholder="(xx) xxxxx-xxxx"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label>Forma de Pagamento</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
                    {[
                      { id: "CREDITO", label: "Crédito", icon: CreditCard },
                      { id: "DEBITO", label: "Débito", icon: CreditCard },
                      { id: "DINHEIRO", label: "Dinheiro", icon: Banknote },
                      { id: "PIX", label: "Pix", icon: Wallet },
                    ].map((method) => (
                      <div key={method.id}>
                        <RadioGroupItem value={method.id} id={method.id} className="peer sr-only" />
                        <Label
                          htmlFor={method.id}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:text-red-600 cursor-pointer"
                        >
                          <method.icon className="mb-2 h-5 w-5" />
                          <span className="text-xs">{method.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Upsell Section */}
                <div className="rounded-xl p-2 md:p-2 border border-dashed border-red-500 relative group/upsell max-w-[calc(100vw-4rem)] overflow-x-auto">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <span role="img" aria-label="beer">🍺</span> Que tal uma gelada?
                  </h3>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 z-20 h-8 w-8 rounded-full shadow-md opacity-0 group-hover/upsell:opacity-100 transition-opacity hidden md:flex"
                    onClick={() => scroll("left")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 z-20 h-8 w-8 rounded-full shadow-md opacity-0 group-hover/upsell:opacity-100 transition-opacity hidden md:flex"
                    onClick={() => scroll("right")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div ref={scrollRef} className="flex w-full overflow-x-auto gap-3 pb-2 -mx-3 px-3 md:-mx-4 md:px-4 scrollbar-hide scroll-smooth">
                    {drinks.map((drink: any) => (
                      <UpsellItem key={drink.id} drink={drink} addToCart={addToCart} />
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t flex justify-between items-end">
                  <span className="text-muted-foreground">Total a pagar</span>
                  <span className="text-3xl font-bold text-green-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-12 text-lg shadow-fire"
                  variant="fire"
                  onClick={submitOrder}
                  disabled={loading || !isClientDataValid()}
                >
                  {loading ? "Enviando..." : "Confirmar Pedido"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
