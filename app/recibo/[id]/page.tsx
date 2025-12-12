"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Printer } from "lucide-react"

type OrderItem = {
    id: string
    name?: string
    product_name?: string
    quantity: number
    price: number
}

type OrderRow = {
    id: string
    code: string
    total: number | null
    created_at: string
    payment: string | null
    billingType: string | null
    payment_status: string | null
    status: string | null
    items: OrderItem[] | null
    customer_name: string | null
    customer_phone: string | null
    table_number: string | null
    encodedImage?: string | null
    copiaecola?: string | null
}

export default function ReceiptPage() {
    const { id } = useParams()
    const [order, setOrder] = useState<OrderRow | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchOrder() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", id)
                .single()

            if (data) {
                setOrder(data)
            }
            setLoading(false)
        }
        fetchOrder()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center text-muted-foreground">
                Pedido não encontrado
            </div>
        )
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

    const calculateTotal = (items: OrderItem[] | null) => {
        if (!items) return 0
        return items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    }

    const orderTotal = order.total || calculateTotal(order.items)

    // Payment method label
    const paymentMethodLabels: Record<string, string> = {
        PIX: 'PIX',
        CREDIT_CARD: 'Cartão Online',
        MAQUININHA: 'Maquininha',
        DINHEIRO: 'Dinheiro',
    }
    const paymentMethod = paymentMethodLabels[order.billingType?.toUpperCase() || ''] || order.billingType || 'Dinheiro'

    return (
        <div className="min-h-screen bg-neutral-100 p-8 flex flex-col items-center print:bg-white print:p-0">
            {/* Print Controls - Hidden when printing */}
            <div className="mb-8 flex gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white shadow-lg hover:bg-neutral-800 transition-colors"
                >
                    <Printer className="h-4 w-4" />
                    Imprimir Recibo
                </button>
            </div>

            {/* Receipt Paper */}
            <div id="receipt-content" className="w-[80mm] bg-white p-4 shadow-xl print:w-full print:shadow-none print:p-0 text-black font-mono text-sm leading-tight">

                {/* Header */}
                <div className="text-center mb-4 border-b border-dashed border-black pb-4">
                    <div className="relative h-12 w-24 mx-auto mb-2 grayscale">
                        {/* Use text instead of image for thermal printers usually, or simplified logo */}
                        <div className="font-bold text-xl">FERRO E FOGO</div>
                    </div>
                    <p className="font-bold">Ferro e Fogo Parrilla</p>
                    <p>Rua Silas Tavares – Nossa Senhora da Saúde, Piranhas – AL, 57460-000</p>
                    <p>CNPJ: XX.XXX.XXX/0001-XX</p>
                </div>

                {/* Order Info */}
                <div className="mb-4 text-xs">
                    <p>Pedido: <span className="font-bold">#{order.code}</span></p>
                    <p>Data: {new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    {order.customer_name && <p>Cliente: {order.customer_name}</p>}
                    {order.table_number && <p>Mesa: {order.table_number}</p>}
                </div>

                {/* Items */}
                <div className="mb-4 border-b border-dashed border-black pb-4">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-left">
                                <th className="pb-2">Qtd/Item</th>
                                <th className="text-right pb-2">Vl. Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-1">
                                        <div className="font-bold">{item.quantity}x {item.product_name || item.name}</div>
                                    </td>
                                    <td className="text-right align-top py-1">
                                        {formatCurrency(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mb-4 border-b border-dashed border-black pb-4">
                    <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL</span>
                        <span>{formatCurrency(orderTotal)}</span>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mb-6 text-xs">
                    <p>Forma de Pagamento:</p>
                    <p className="font-bold uppercase">{paymentMethod}</p>
                    {order.payment_status && (
                        <p className="mt-1">Status: {order.payment_status === 'PAYMENT_RECEIVED' ? 'PAGO' : order.payment_status}</p>
                    )}
                </div>

                {/* Pix QR Code Section */}
                {order.encodedImage && order.billingType === 'PIX' && order.status !== 'PAID' && (
                    <div className="mb-6 text-center border-b border-dashed border-black pb-4">
                        <p className="font-bold mb-2 text-sm">Escaneie para Pagar (Pix)</p>
                        <div className="mx-auto w-40 h-40 border-2 border-black p-1 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`data:image/png;base64,${order.encodedImage}`}
                                alt="QR Code Pix"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center text-xs">
                    <p className="font-bold">Obrigado pela preferência!</p>
                    <p className="mt-2">Volte sempre!</p>
                </div>

            </div>

            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
        </div>
    )
}
