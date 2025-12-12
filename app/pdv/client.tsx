"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Send, User, Search, Package, MapPin, Wallet, Settings, CheckCircle2, Printer, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ProductCustomizer, Product, CartItem } from "@/components/product-customizer"
import { CustomerSearch } from "@/components/pdv/customer-search"
import { AddressSelector } from "@/components/pdv/address-selector"
import { PaymentModal } from "@/components/pdv/payment-modal"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type Category = {
    id: number
    name: string
    items: Product[]
}

type ServiceType = "MESA" | "BALCAO" | "DELIVERY"
type PaymentMethod = 'DINHEIRO' | 'CREDIT_CARD' | 'PIX' | 'MAQUININHA'

// Product Search Component
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
        return results.slice(0, 10)
    }, [query, menu])

    return (
        <div className="relative w-full z-20">
            <div className="relative flex items-center">
                <Search className="absolute left-4 inset-y-auto h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar produto (nome, código)..."
                    className="pl-10 h-12 bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 backdrop-blur-sm focus:bg-white dark:focus:bg-black/40 transition-all rounded-xl shadow-sm"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            <AnimatePresence>
                {isOpen && filteredProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-50 p-2"
                    >
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className="flex items-center gap-4 p-3 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors rounded-xl"
                                onClick={() => {
                                    onSelect(product)
                                    setIsOpen(false)
                                    setQuery("")
                                }}
                            >
                                {product.img ? (
                                    <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                                        <img
                                            src={product.img}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-12 w-12 rounded-lg bg-linear-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 text-orange-600">
                                        <Package className="h-6 w-6" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-medium truncate text-neutral-900 dark:text-neutral-100">{product.name}</h4>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
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

// Main Client Component
export default function PdvClient() {
    const [serviceType, setServiceType] = useState<ServiceType>("MESA")
    const [tableNumber, setTableNumber] = useState("")

    // Customer Data
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
    const [customerName, setCustomerName] = useState("") // Fallback for manual
    const [customerPhone, setCustomerPhone] = useState("") // Fallback for manual

    // Delivery Data
    const [deliveryAddress, setDeliveryAddress] = useState<string>("")

    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [menu, setMenu] = useState<Category[]>([])
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [createdOrder, setCreatedOrder] = useState<{ id: string, code: string } | null>(null)
    const [isSessionOpen, setIsSessionOpen] = useState<boolean | null>(null)

    useEffect(() => {
        fetch("/cardapio.json")
            .then(res => res.json())
            .then(data => setMenu(data))
            .catch(err => console.error("Erro ao carregar cardapio:", err))

        // Check session status
        fetch("/api/cash-session/status")
            .then(res => res.json())
            .then(data => setIsSessionOpen(data.isOpen))
            .catch(err => console.error("Erro ao verificar caixa:", err))
    }, [])

    const addToCart = (item: Omit<CartItem, "uniqueId">) => {
        setCart(prev => [...prev, { ...item, uniqueId: Math.random().toString(36).substr(2, 9) }])
        setConfiguringProduct(null)
        toast.success("Item adicionado ao pedido")
    }

    const removeFromCart = (uniqueId: string) => {
        setCart(prev => prev.filter(item => item.uniqueId !== uniqueId))
    }

    const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

    const handleCreateOrder = async (method: PaymentMethod, paymentDetails?: any) => {
        setLoading(true)
        try {
            // Prepare Items
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

            // For Delivery Address - Inject into Order Obs/Notes since we don't have address column yet
            const obsPrefix = serviceType === "DELIVERY" && deliveryAddress
                ? `[ENTREGA] ${deliveryAddress}\n\n`
                : ""

            const payload = {
                table_number: serviceType === "MESA" ? tableNumber || null : null,
                customer_name: selectedCustomer ? selectedCustomer.full_name : customerName || "Cliente Balcão",
                customer_phone: selectedCustomer ? selectedCustomer.phone : customerPhone || null,
                service_type: serviceType,
                source: "PDV",
                items: apiItems,
                billingType: method,
                payment_status: (method === 'PIX' || method === 'CREDIT_CARD') ? 'PENDING' : 'PAID',
                obs: obsPrefix + (paymentDetails?.receivedAmount ? `Recebido: R$${paymentDetails.receivedAmount} (Troco: R$${paymentDetails.change})` : ""),
                // Asaas fields
                invoiceUrl: paymentDetails?.invoiceUrl,
                copiaecola: paymentDetails?.asaas_payload?.copypaste,
                encodedImage: paymentDetails?.asaas_payload?.encodedImage,
                payment: paymentDetails?.asaasId
            }

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Falha ao criar pedido")

            toast.success("Pedido finalizado com sucesso!")

            // Show Success Modal instead of just resetting immediately
            setCreatedOrder({ code: data.code, id: data.id })

            // Reset Data
            setCart([])
            setTableNumber("")
            setCustomerName("")
            setCustomerPhone("")
            setSelectedCustomer(null)
            setDeliveryAddress("")
            setShowPaymentModal(false)

        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar pedido")
        } finally {
            setLoading(false)
        }
    }

    const isClientDataValid = () => {
        if (serviceType === "MESA") return tableNumber.trim().length > 0
        if (serviceType === "DELIVERY") {
            return (selectedCustomer || (customerName.trim().length > 0 && customerPhone.trim().length > 0)) && deliveryAddress.length > 0
        }
        // Balcão doesn't strictly require name, but good to have
        return true
    }

    if (isSessionOpen === false) {
        return (
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 space-y-6 shadow-xl border-none">
                    <div className="mx-auto h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Caixa Fechado</h1>
                        <p className="text-neutral-500 mt-2">É necessário abrir o caixa para realizar novas vendas.</p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 rounded-xl"
                        onClick={() => window.location.href = '/admin'}
                    >
                        Ir para Abertura de Caixa
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-4 md:p-6 lg:p-8 flex gap-6">
            {/* Left Side: Order Builder */}
            <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                {/* Header */}
                <header className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mb-1">PDV</h1>
                        <p className="text-neutral-500">Nova Venda</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Online</Badge>
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-12">
                    {/* Product Search & Menu (Could expand later) */}
                    <div className="md:col-span-12 space-y-6 z-50">
                        <Card className="rounded-2xl shadow-sm border-none bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="text-lg">Adicionar Produtos</CardTitle>
                            </CardHeader>
                            <CardContent >
                                <ProductSearch menu={menu} onSelect={setConfiguringProduct} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Customer & Service Info */}
                    <div className="md:col-span-6 space-y-6">
                        <Card className="rounded-2xl shadow-sm border-none bg-white/80 dark:bg-neutral-900/80 backdrop-blur h-full">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-indigo-500" />
                                    Cliente e Serviço
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Service Type Tabs */}
                                <Tabs value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
                                        <TabsTrigger value="MESA" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm">Mesa</TabsTrigger>
                                        <TabsTrigger value="BALCAO" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm">Balcão</TabsTrigger>
                                        <TabsTrigger value="DELIVERY" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 data-[state=active]:shadow-sm">Delivery</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Conditional Inputs */}
                                {serviceType === "MESA" && (
                                    <div className="space-y-2">
                                        <Label>Número da Mesa</Label>
                                        <Input
                                            placeholder="Ex: 05"
                                            value={tableNumber}
                                            onChange={e => setTableNumber(e.target.value)}
                                            className="h-12 text-lg font-medium"
                                        />
                                    </div>
                                )}

                                {/* Customer Search / Manual Input */}
                                <div className="space-y-3">
                                    <Label>Cliente</Label>
                                    <CustomerSearch
                                        onSelect={setSelectedCustomer}
                                        selectedCustomer={selectedCustomer}
                                        onClear={() => setSelectedCustomer(null)}
                                    />
                                    {!selectedCustomer && (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <Input
                                                placeholder="Nome (Opcional)"
                                                value={customerName}
                                                onChange={e => setCustomerName(e.target.value)}
                                            />
                                            <Input
                                                placeholder="Telefone (Opcional)"
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Delivery Address */}
                                {serviceType === "DELIVERY" && (
                                    <div className="space-y-3 pt-4 border-t border-dashed">
                                        <Label className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-red-500" /> Endereço de Entrega
                                        </Label>
                                        <AddressSelector
                                            userId={selectedCustomer?.id}
                                            onSelect={setDeliveryAddress}
                                        />
                                        {deliveryAddress && (
                                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm text-neutral-600 dark:text-neutral-400">
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-200">Entrega para:</span> {deliveryAddress}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </div>

                    {/* Cart Summary (Desktop: Right Side of grid, Mobile: below) */}
                    <div className="md:col-span-6 h-full flex flex-col">
                        <Card className="rounded-2xl shadow-lg border-none bg-white dark:bg-neutral-900 flex-1 flex flex-col overflow-hidden ring-1 ring-black/5">
                            <CardHeader className="bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                <CardTitle className="flex justify-between items-center">
                                    <span>Carrinho</span>
                                    <Badge variant="secondary" className="rounded-lg px-2">{cart.length} itens</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-0 bg-neutral-50/20">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8 space-y-4">
                                        <div className="h-20 w-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                            <Package className="h-10 w-10 opacity-50" />
                                        </div>
                                        <p>Seu carrinho está vazio</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {cart.map(item => (
                                            <div key={item.uniqueId} className="p-4 hover:bg-white dark:hover:bg-neutral-800 transition-colors group">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-medium flex gap-2">
                                                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 shrink-0 border-neutral-300">{item.quantity}</Badge>
                                                        <span className="text-neutral-900 dark:text-neutral-100">{item.product.name}</span>
                                                    </div>
                                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                                                    </div>
                                                </div>
                                                <div className="pl-8 text-sm text-neutral-500 space-y-0.5">
                                                    {Object.values(item.selectedOptions).flat().map((opt, idx) => (
                                                        <div key={idx} className="flex justify-between">
                                                            <span>+ {opt.name}</span>
                                                            {opt.price > 0 && <span>+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.price)}</span>}
                                                        </div>
                                                    ))}
                                                    {item.notes && <p className="italic text-orange-600/80 text-xs">Obs: {item.notes}</p>}
                                                </div>
                                                <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => removeFromCart(item.uniqueId)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-6 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 shadow-up-lg z-10">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-base font-medium text-neutral-500">Total</span>
                                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                                    </span>
                                </div>
                                <Button
                                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-emerald-500/20 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transition-all transform active:scale-[0.98]"
                                    disabled={cart.length === 0 || !isClientDataValid()}
                                    onClick={() => setShowPaymentModal(true)}
                                >
                                    {serviceType === "DELIVERY" && !isClientDataValid() ? "Selecione o Endereço" : (
                                        <>
                                            <Wallet className="mr-2 h-5 w-5" /> Ir para Pagamento
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {configuringProduct && (
                    <ProductCustomizer
                        product={configuringProduct}
                        onClose={() => setConfiguringProduct(null)}
                        onConfirm={addToCart}
                        showBuyNow={false}
                    />
                )}
            </AnimatePresence>

            {showPaymentModal && (
                <PaymentModal
                    total={cartTotal}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={handleCreateOrder}
                    customer={selectedCustomer || (customerName ? { name: customerName, phone: customerPhone } : null)}
                />
            )}

            {createdOrder && (
                <Dialog open={true} onOpenChange={() => setCreatedOrder(null)}>
                    <DialogContent className="sm:max-w-md text-center">
                        <DialogHeader>
                            <DialogTitle className="text-center flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                                Pedido Criado!
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-6">
                            <p className="text-muted-foreground mb-2">Código do Pedido</p>
                            <div className="text-4xl font-mono font-bold text-neutral-900 dark:text-neutral-100 tracking-wider">
                                {createdOrder.code}
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:justify-center gap-2">
                            <Button className="w-full" size="lg" onClick={() => window.open(`/recibo/${createdOrder.id}`, '_blank')}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setCreatedOrder(null)}>
                                Nova Venda
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
