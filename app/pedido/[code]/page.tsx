"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, CheckCircle2, ChefHat, Truck, ShoppingBag, MapPin, Copy, ExternalLink, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

// Status mapping
const STATUS_STEPS = [
    { id: "PENDENTE", label: "Recebido", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "EM_PREPARO", label: "Preparando", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "PRONTO", label: "Pronto", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "ENTREGUE", label: "Saiu / Entregue", icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" }
]

const STEPS_ORDER = ["PENDENTE", "EM_PREPARO", "PRONTO", "ENTREGUE"]

export default function OrderTrackingPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params)
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    async function fetchOrder() {
        try {
            const res = await fetch(`/api/orders/track/${code}`)
            if (!res.ok) throw new Error("Pedido não encontrado")
            const data = await res.json()
            setOrder(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar pedido")
        } finally {
            setLoading(false)
        }
    }

    // Poll for updates every 15s
    useEffect(() => {
        fetchOrder()
        const interval = setInterval(fetchOrder, 15000)
        return () => clearInterval(interval)
    }, [code])

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
                <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
                <Link href="/cardapio">
                    <Button variant="outline">Voltar ao Cardápio</Button>
                </Link>
            </div>
        )
    }

    // Determine current step index
    const currentStatus = order.status === "CANCELADO" ? "CANCELADO" : order.status
    const activeStepIndex = STEPS_ORDER.indexOf(currentStatus) >= 0
        ? STEPS_ORDER.indexOf(currentStatus)
        : (currentStatus === "CANCELADO" ? -1 : 0) // Default to first step if unknown, or handle canceled

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/cardapio">
                        <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
                        Acompanhamento
                    </h1>
                    <div className="ml-auto">
                        <Button size="icon" variant="ghost" className="text-neutral-500" onClick={fetchOrder}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">

                {/* Order Header */}
                <div className="text-center space-y-2">
                    <p className="text-neutral-400 uppercase text-xs tracking-widest">Pedido #{order.code}</p>
                    <h2 className="text-3xl font-bold text-white">
                        {currentStatus === "CANCELADO" && <span className="text-red-500">Cancelado</span>}
                        {currentStatus === "finalizado" && <span className="text-emerald-500">Finalizado</span>}
                        {currentStatus !== "CANCELADO" && currentStatus !== "finalizado" && (
                            STEPS_ORDER.includes(currentStatus)
                                ? STATUS_STEPS.find(s => s.id === currentStatus)?.label
                                : "Recebido"
                        )}
                    </h2>
                    <p className="text-neutral-500 text-sm">
                        Atualizado em {new Date(order.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                {/* Steps */}
                {currentStatus !== "CANCELADO" && (
                    <div className="relative flex justify-between items-center px-4">
                        {/* Progress Bar background */}
                        <div className="absolute left-4 right-4 top-1/2 h-1 bg-neutral-900 -z-10 rounded-full" />

                        {/* Active Progress Bar */}
                        <motion.div
                            className="absolute left-4 top-1/2 h-1 bg-amber-600 -z-0 rounded-full origin-left"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(activeStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                            transition={{ duration: 1 }}
                        />

                        {STATUS_STEPS.map((step, index) => {
                            const isActive = index <= activeStepIndex
                            const isCurrent = index === activeStepIndex

                            return (
                                <div key={step.id} className="relative flex flex-col items-center gap-2">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: isActive ? 1 : 0.8 }}
                                        className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 z-10",
                                            isActive ? "bg-neutral-950 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-neutral-900 border-neutral-800"
                                        )}
                                    >
                                        <step.icon className={cn("h-4 w-4", isActive ? "text-amber-500" : "text-neutral-600")} />
                                    </motion.div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider absolute -bottom-6 w-20 text-center transition-colors",
                                        isCurrent ? "text-amber-500" : (isActive ? "text-neutral-400" : "text-neutral-700")
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}



                {/* Order Details */}
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-base">
                            <ShoppingBag className="h-5 w-5 text-neutral-400" /> Detalhes do Pedido
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-neutral-800 last:border-0 border-dashed">
                                    <div>
                                        <span className="font-bold text-neutral-300">{item.quantity}x {item.product_name}</span>
                                        {item.notes && <p className="text-neutral-500 text-xs mt-0.5">{item.notes}</p>}
                                    </div>
                                    <span className="text-neutral-400">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
                            <span className="text-neutral-400">Total</span>
                            <span className="text-xl font-bold text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                            </span>
                        </div>

                        {order.customer_name && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2 bg-neutral-950 p-2 rounded">
                                <MapPin className="h-3 w-3" />
                                {order.service_type === "DELIVERY"
                                    ? "Entrega" // Ideally we would show the address here if we saved it in notes or a specific field
                                    : `Mesa ${order.table_number || '?'}`
                                }
                                <span className="mx-1">•</span>
                                {order.customer_name}
                            </div>
                        )}
                    </CardContent>
                </Card>
                {order.status === "PENDENTE" && (
                    <Card className="bg-neutral-900/50 border-amber-500/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-amber-500 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Aguardando Pagamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.copiaecola ? (
                                <div className="space-y-4 flex flex-col items-center">
                                    {order.encodedImage && (
                                        <div className="bg-white/80 p-4 rounded-lg inline-block mx-auto">
                                            <Image
                                                src={`data:image/png;base64,${order.encodedImage}`}
                                                alt="QR Code Pix"
                                                width={200}
                                                height={200}
                                                className="mix-blend-multiply"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label className="text-neutral-400 text-xs text-center block uppercase tracking-wider">Copia e Cola</Label>
                                        <div className="flex bg-neutral-950 border border-neutral-800 rounded p-2 gap-2 items-center max-w-[250px]">
                                            <code className="flex-1 truncate text-neutral-300 text-xs font-mono text-wrap">{order.copiaecola}</code>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" onClick={() => {
                                                navigator.clipboard.writeText(order.copiaecola)
                                                toast.success("Copiado!")
                                            }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : order.invoiceUrl ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-neutral-400">Pague com Cartão ou Boleto via Link:</p>
                                    <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer" className="block">
                                        <Button variant="outline" className="w-full gap-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white h-12 text-base font-bold">
                                            <ExternalLink className="h-5 w-5" /> Pagar Agora
                                        </Button>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-500">Pague no caixa ou aguarde confirmação.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
