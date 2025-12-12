"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Trash2, Send, CreditCard, Wallet, Banknote, ShoppingCart, ChevronLeft, ChevronRight, Check, MapPin, User, Loader2, Copy, ExternalLink, Flame, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useCart } from "@/contexts/cart-context"
import { cn } from "@/lib/utils"
import { useMenu } from "@/hooks/use-menu"
import Image from "next/image"
import { toast } from "sonner"
import { AddressSelector } from "@/components/pdv/address-selector"
import { ProductCustomizer, CartItem as OriginalCartItem } from "@/components/product-customizer"

// Map OriginalCartItem to expected local type or just use it directly if compatible
// The local usage seems to rely on the context which uses CartItem from product-customizer
// We'll rely on the context's type mainly.

// --- Types ---

type ServiceType = "MESA" | "DELIVERY" | "BALCAO"
type CheckoutStep = "cart" | "identify" | "address" | "payment" | "success"

type Customer = {
  id: string
  name: string
  mobilePhone?: string // Asaas field
  phone?: string // Local field
  cpfCnpj?: string // Asaas field
  cpf?: string // Local field
  email?: string
  source?: "LOCAL" | "ASAAS"
  address?: any // Active address from search
}

// --- Components ---

function UpsellItem({ item, addToCart }: { item: any, addToCart: any }) {
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = () => {
    addToCart({
      product: item,
      quantity: 1,
      selectedOptions: {},
      notes: "",
      totalPrice: item.price
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
    toast.success(`${item.name} adicionado!`)
  }

  return (
    <div className="relative flex-shrink-0 w-36 md:w-40 bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 flex flex-col gap-2 group hover:border-red-500/30 transition-all">
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-800">
        {item.img ? (
          <Image src={item.img} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-600">
            <Flame className="h-8 w-8" />
          </div>
        )}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleAdd}
        className={cn(
          "absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg z-10 flex items-center justify-center transition-all duration-300",
          isAdded ? "bg-emerald-500 text-white" : "bg-neutral-950 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
        )}
      >
        <AnimatePresence mode="wait">
          {isAdded ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="cart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <PlusIcon className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="flex-1 space-y-1">
        <p className="text-xs font-semibold line-clamp-2 leading-tight text-neutral-200" title={item.name}>{item.name}</p>
        <p className="text-sm text-red-500 font-bold">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
        </p>
      </div>
    </div>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}


export default function CartPage() {
  const { menu } = useMenu()
  const { cart, removeFromCart, cartTotal, clearCart, addToCart, updateQuantity, editItem } = useCart()

  // State
  const [step, setStep] = useState<CheckoutStep>("cart")
  const [loading, setLoading] = useState(false)

  // Upsell Data
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [drinks, setDrinks] = useState<any[]>([])

  // Identification
  const [cpfInput, setCpfInput] = useState("")
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "", email: "" })

  // Service & Address
  const [serviceType, setServiceType] = useState<ServiceType>("DELIVERY")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [tableNumber, setTableNumber] = useState("")

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null)

  // Editing
  const [editingItem, setEditingItem] = useState<any>(null)

  // Scroll Refs
  const upsellRef = useRef<HTMLDivElement>(null)
  const drinksRef = useRef<HTMLDivElement>(null)

  // Check for existing order
  useEffect(() => {
    const code = localStorage.getItem('last_order_code')
    if (code) {
      // Verify status to see if we should still show it
      fetch(`/api/orders/track/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.error || data.status === "ENTREGUE" || data.status === "finalizado" || data.status === "CANCELADO") {
            localStorage.removeItem('last_order_code')
            setLastOrderCode(null)
          } else {
            setLastOrderCode(code)
          }
        })
        .catch(() => {
          // If error fetching, maybe clear it? Or keep it? keeping for now.
          setLastOrderCode(code)
        })
    }
  }, [])

  const dismissActiveOrder = () => {
    localStorage.removeItem('last_order_code')
    setLastOrderCode(null)
  }

  // Load Upsell Items
  useEffect(() => {
    if (menu.length > 0) {
      // Mock Best Sellers: Pick 3 random items from categories not "Bebidas"
      const foodCats = menu.filter(c => !c.name.toLowerCase().includes("bebida") && !c.name.toLowerCase().includes("cerveja"))
      const allFood = foodCats.flatMap(c => c.items)
      const shuffled = [...allFood].sort(() => 0.5 - Math.random())
      setBestSellers(shuffled.slice(0, 3))

      // Drinks
      const drinkCat = menu.find(c => c.name.toLowerCase().includes("bebida") || c.name.toLowerCase().includes("cerveja"))
      if (drinkCat) {
        setDrinks(drinkCat.items.slice(0, 5))
      }
    }
  }, [menu])

  // --- Handlers ---

  const handleIdentification = async () => {
    if (cpfInput.length < 11) {
      toast.error("CPF inválido")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/search?query=${cpfInput}`)
      const data = await res.json()

      if (data && data.length > 0) {
        // Found
        setCustomer(data[0])
        const first = data[0].full_name || data[0].name || ""
        toast.success(`Bem-vindo de volta, ${first.split(' ')[0]}!`)

        // If address is provided in search (smart optimization), we could set it
        if (data[0].address) {
          console.log("Preloading address:", data[0].address)
        }

        setStep("address")
      } else {
        // Not found
        setIsNewCustomer(true)
        toast.info("Cliente não encontrado. Por favor, cadastre-se.")
      }
    } catch (error) {
      toast.error("Erro ao buscar cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      toast.error("Preencha nome e telefone")
      return
    }
    setLoading(true)
    try {
      console.log("Registering customer...", { ...newCustomerData, cpf: cpfInput })

      const res = await fetch("/api/asaas/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomerData.name,
          mobilePhone: newCustomerData.phone.replace(/\D/g, ""), // Sanitize client side too
          cpfCnpj: cpfInput.replace(/\D/g, ""), // Sanitize client side too
          email: newCustomerData.email
        })
      })

      const data = await res.json()
      console.log("Registration response:", data)

      if (data.id) {
        const newCust: Customer = {
          id: `asaas_${data.id}`,
          name: data.name,
          cpf: data.cpfCnpj,
          phone: data.mobilePhone,
          email: data.email,
          source: "ASAAS"
        }
        setCustomer(newCust)
        setStep("address")
        toast.success("Cadastro realizado!")
      } else {
        console.error("Registration error data:", data)
        toast.error("Erro ao cadastrar: " + (data.error || JSON.stringify(data) || "Erro desconhecido"))
      }
    } catch (error: any) {
      console.error("Registration exception:", error)
      toast.error("Erro na comunicação: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrderAndPay = async () => {
    if (!customer) return

    setLoading(true)
    try {
      // 1. Create Order
      const apiItems = cart.map(item => {
        let formattedNotes = item.notes
        const optionsList = Object.values(item.selectedOptions).flat()
        if (optionsList.length > 0) {
          const optionsText = optionsList.map(o => `+ ${o.name}`).join("\n")
          formattedNotes = formattedNotes ? `${formattedNotes}\n${optionsText}` : optionsText
        }
        return {
          product_name: item.product.name,
          quantity: item.quantity,
          notes: formattedNotes,
          price: item.product.price
        }
      })

      // Append address to obs or validation
      const fullAddress = serviceType === "DELIVERY" ? `[DELIVERY] ${deliveryAddress}` : `[${serviceType}] Mesa: ${tableNumber}`

      // Order Payload
      const orderPayload = {
        customer_name: customer.name,
        customer_phone: customer.phone || customer.mobilePhone,
        service_type: serviceType,
        items: apiItems,
        source: "AUTO_ATENDIMENTO",
        payment: paymentMethod === "PIX" ? "PIX" : "CREDIT_CARD",
        notes: fullAddress // Storing address in notes/obs if needed, or rely on internal logic
        // Note: We don't have asaas_id column in orders API yet, but we have the customer linked if we wanted.
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) throw new Error(orderData.error || "Erro ao criar pedido")

      setOrderCode(orderData.code)

      // 2. Create Charge (Asaas)
      // Strip 'asaas_' prefix if present
      const asaasId = customer.id.startsWith('asaas_') ? customer.id.replace('asaas_', '') : customer.id
      // If customer is LOCAL (uuid), this might fail if they aren't in Asaas.
      // Ideally we check if they are in Asaas. 
      // For now, assuming AUTO_ATENDIMENTO flow creates Asaas customers primarily.
      // If 'LOCAL' source, we might try to use cpfCnpj to find/create in Asaas.

      // Let's rely on create-charge logic which can create customer if needed
      const chargeRes = await fetch("/api/asaas/create-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer.source === 'ASAAS' ? asaasId : undefined, // passing ID if known
          name: customer.name,
          cpfCnpj: customer.cpf || customer.cpfCnpj || cpfInput, // Create if needed
          mobilePhone: customer.phone || customer.mobilePhone,
          billingType: paymentMethod === "PIX" ? "PIX" : "CREDIT_CARD",
          value: cartTotal,
          description: `Pedido ${orderData.code} - KDS`,
          externalReference: orderData.id
        })
      })

      const chargeData = await chargeRes.json()


      // Save order to local storage for "My Orders" feature
      localStorage.setItem('last_order_code', orderData.code)

      if (chargeData.error) throw new Error(chargeData.error)

      // UPDATE ORDER WITH PAYMENT INFO
      // This is crucial so the tracking page can show Pix/Invoice
      await fetch(`/api/orders/${orderData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: "PENDING", // Asaas initial status
          billingType: paymentMethod === "PIX" ? "PIX" : "CREDIT_CARD",
          copiaecola: chargeData.pixQrCode?.payload,
          encodedImage: chargeData.pixQrCode?.encodedImage,
          invoiceUrl: chargeData.invoiceUrl
        })
      })

      setPaymentResult(chargeData)
      setStep("success")
      toast.success("Pedido criado! Redirecionando...")
      clearCart()

      // Redirect to tracking page
      window.location.href = `/pedido/${orderData.code}`

    } catch (error: any) {
      console.error(error)
      toast.error("Erro no processamento: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Render ---

  // Clean up success screen as we redirect now
  if (step === "success") {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-red-500" /></div>
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {step === "cart" ? (
            <Link href="/cardapio">
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/10" onClick={() => {
              if (step === "identify") setStep("cart")
              if (step === "address") setStep("identify")
              if (step === "payment") setStep("address")
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
            {step === "cart" && "Seu Carrinho"}
            {step === "identify" && "Identificação"}
            {step === "address" && "Entrega"}
            {step === "payment" && "Pagamento"}
          </h1>
        </div>
      </div>

      <div className="container h-screen mx-auto px-4 py-6 max-w-4xl">

        {/* Active Order Banner */}
        {lastOrderCode && step === "cart" && (
          <div className="mb-6 bg-gradient-to-r from-neutral-900 to-neutral-800 border border-l-4 border-l-red-500 border-y-white/5 border-r-white/5 p-4 rounded-xl flex items-center justify-between shadow-lg shadow-black/20 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/10 p-2 rounded-full hidden sm:block">
                <ShoppingBag className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-red-500 font-bold text-sm uppercase tracking-wider">Pedido em Andamento</p>
                <p className="text-white font-medium">Você tem um pedido recente (#{lastOrderCode})</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/pedido/${lastOrderCode}`}>
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                  Acompanhar
                </Button>
              </Link>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-500 hover:text-white" onClick={dismissActiveOrder}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
              </Button>
            </div>
          </div>
        )}

        {/* STEP: CART */}
        {step === "cart" && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
            {cart.length === 0 ? (
              <div className="text-center py-20 space-y-6">
                <div className="h-24 w-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto text-neutral-700 animate-pulse">
                  <ShoppingCart className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-200">Carrinho Vazio</h2>
                  <p className="text-neutral-500 mt-2">Que tal experimentar algo delicioso?</p>
                </div>
                <Link href="/cardapio">
                  <Button variant="fire" size="lg" className="mt-4 px-8">Ver Cardápio</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.uniqueId}
                      className="bg-neutral-900/50 border border-white/5 rounded-2xl p-3 flex gap-4 items-center relative group cursor-pointer hover:bg-neutral-800/50 transition-colors"
                      onClick={() => setEditingItem(item)}
                    >
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-neutral-800 shrink-0">
                        {item.product.img ? (
                          <Image src={item.product.img} alt={item.product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600"><Flame className="h-6 w-6" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-neutral-200 truncate pr-2">{item.product.name}</h3>
                          <span className="font-bold text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          {Object.values(item.selectedOptions).flat().map(o => o.name).join(", ")}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 bg-neutral-950 rounded-lg p-1 border border-white/5" onClick={(e) => e.stopPropagation()}>
                            <button className="h-6 w-6 flex items-center justify-center text-neutral-400 hover:text-white" onClick={() => updateQuantity(item.uniqueId, -1)} disabled={item.quantity <= 1}>-</button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button className="h-6 w-6 flex items-center justify-center text-neutral-400 hover:text-white" onClick={() => updateQuantity(item.uniqueId, 1)}>+</button>
                          </div>
                          <button
                            className="h-8 w-8 flex items-center justify-center text-red-500/50 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(item.uniqueId)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* UPSELL: Best Sellers */}
                {bestSellers.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-500" /> Mais Vendidos
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                      {bestSellers.map(item => <UpsellItem key={item.id} item={item} addToCart={addToCart} />)}
                    </div>
                  </div>
                )}

                {/* UPSELL: Drinks */}
                {drinks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                      🍺 Bebidas
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                      {drinks.map(item => <UpsellItem key={item.id} item={item} addToCart={addToCart} />)}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="fixed bottom-24 left-0 right-0 bg-neutral-950/80 backdrop-blur-xl border-t border-white/10 p-4 z-10">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <p className="text-neutral-400">Total</p>
                      <p className="text-2xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</p>
                    </div>
                    <Button onClick={() => setStep("identify")} className="h-12 px-8 bg-gradient-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 text-white shadow-lg shadow-red-900/20 font-bold rounded-xl">
                      Finalizar Pedido
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: IDENTIFY */}
        {step === "identify" && (
          <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <User className="h-12 w-12 text-red-500 mx-auto bg-red-500/10 p-2 rounded-full" />
              <h2 className="text-xl font-bold text-white">Quem é você?</h2>
              <p className="text-neutral-400 text-sm">Informe seu CPF para identificarmos seu cadastro.</p>
            </div>

            {!isNewCustomer ? (
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-400">CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    className="bg-neutral-950 border-neutral-800 h-12 text-lg tracking-widest text-center"
                    value={cpfInput}
                    onChange={e => setCpfInput(e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14))}
                  />
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-neutral-200" onClick={handleIdentification} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Continuar"}
                </Button>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4 animate-in fade-in duration-300">
                <div className="text-center mb-4">
                  <p className="text-red-500 font-medium">Cadastro Rápido</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">CPF</Label>
                  <Input
                    className="bg-neutral-900 border-neutral-800 h-10 text-neutral-500"
                    value={cpfInput}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">Nome Completo</Label>
                  <Input
                    className="bg-neutral-950 border-neutral-800 h-10"
                    value={newCustomerData.name}
                    onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">Celular / WhatsApp</Label>
                  <Input
                    className="bg-neutral-950 border-neutral-800 h-10"
                    placeholder="(00) 00000-0000"
                    value={newCustomerData.phone}
                    onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-400">Email (Opcional)</Label>
                  <Input
                    className="bg-neutral-950 border-neutral-800 h-10"
                    type="email"
                    value={newCustomerData.email}
                    onChange={e => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  />
                </div>
                <Button className="w-full h-12 text-lg font-bold bg-red-600 hover:bg-red-700 text-white mt-4" onClick={handleRegister} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Cadastrar e Continuar"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP: ADDRESS */}
        {step === "address" && (
          <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-red-500 mx-auto bg-red-500/10 p-2 rounded-full" />
              <h2 className="text-xl font-bold text-white">Onde você está?</h2>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl grid grid-cols-2 gap-2">
              <button
                onClick={() => setServiceType("DELIVERY")}
                className={cn("py-3 rounded-lg text-sm font-medium transition-colors", serviceType === "DELIVERY" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300")}
              >Delivery</button>
              <button
                onClick={() => setServiceType("MESA")}
                className={cn("py-3 rounded-lg text-sm font-medium transition-colors", serviceType === "MESA" ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300")}
              >Mesa</button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
              {serviceType === "DELIVERY" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-red-500">
                    <Label className="font-bold">Endereço de Entrega</Label>
                  </div>
                  {customer && (
                    <AddressSelector
                      userId={customer.id}
                      preloadedAddress={customer.address}
                      onSelect={(addr) => setDeliveryAddress(addr)}
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Label className="text-neutral-400">Número da Mesa</Label>
                  <Input
                    placeholder="Ex: 05"
                    className="bg-neutral-950 border-neutral-800 h-12 text-lg text-center"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                  />
                </div>
              )}

              <Button
                className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-neutral-200 mt-6"
                onClick={() => {
                  if (serviceType === "DELIVERY" && !deliveryAddress) {
                    toast.error("Selecione um endereço")
                    return
                  }
                  if (serviceType === "MESA" && !tableNumber) {
                    toast.error("Informe a mesa")
                    return
                  }
                  setStep("payment")
                }}
              >
                Ir para Pagamento
              </Button>
            </div>
          </div>
        )}

        {/* STEP: PAYMENT */}
        {step === "payment" && (
          <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <Wallet className="h-12 w-12 text-emerald-500 mx-auto bg-emerald-500/10 p-2 rounded-full" />
              <h2 className="text-xl font-bold text-white">Como deseja pagar?</h2>
              <p className="text-neutral-400 font-mono text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setPaymentMethod("PIX")}
                className={cn(
                  "cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all",
                  paymentMethod === "PIX" ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                )}
              >
                <div className="h-10 w-10 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center">
                  <Copy className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">Pix (Copia e Cola)</p>
                  <p className="text-xs text-neutral-400">Aprovação imediata</p>
                </div>
                {paymentMethod === "PIX" && <div className="h-4 w-4 bg-emerald-500 rounded-full" />}
              </div>

              <div
                onClick={() => setPaymentMethod("CREDIT_CARD")}
                className={cn(
                  "cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all",
                  paymentMethod === "CREDIT_CARD" ? "border-red-500 bg-red-500/10" : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                )}
              >
                <div className="h-10 w-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">Cartão de Crédito</p>
                  <p className="text-xs text-neutral-400">Link de pagamento seguro</p>
                </div>
                {paymentMethod === "CREDIT_CARD" && <div className="h-4 w-4 bg-red-500 rounded-full" />}
              </div>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 mt-6"
              onClick={handleCreateOrderAndPay}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Confirmar e Pagar"}
            </Button>
          </div>
        )}
      </div>

      {editingItem && (
        <ProductCustomizer
          product={editingItem.product}
          initialValues={{
            quantity: editingItem.quantity,
            selectedOptions: editingItem.selectedOptions,
            notes: editingItem.notes
          }}
          onClose={() => setEditingItem(null)}
          onConfirm={(updatedItem) => {
            editItem(editingItem.uniqueId, updatedItem)
            setEditingItem(null)
            toast.success("Item atualizado!")
          }}
          showBuyNow={false}
        />
      )}
    </div>
  )
}

function LinkIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
