"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, CreditCard, Banknote, Link as LinkIcon, Loader2, Copy, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PaymentMethod = 'DINHEIRO' | 'CREDIT_CARD' | 'PIX' | 'MAQUININHA'

type PaymentModalProps = {
    total: number
    onConfirm: (method: PaymentMethod, details?: any) => Promise<void>
    onClose: () => void
    customer?: { name: string, cpf?: string, phone?: string } | null
}

export function PaymentModal({ total, onConfirm, onClose, customer }: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod>('PIX')
    const [receivedAmount, setReceivedAmount] = useState("")
    const [processing, setProcessing] = useState(false)
    const [step, setStep] = useState<'selection' | 'processing' | 'pix_qrcode' | 'link_generated'>('selection')
    const [pixData, setPixData] = useState<{ encodedImage?: string, payload?: string, copypaste?: string, id?: string } | null>(null)

    // For manual Asaas Pix/Link generation
    const handleAsaasPayment = async (type: 'PIX' | 'CREDIT_CARD') => {
        setProcessing(true)
        try {
            // Call API to create charge
            const res = await fetch('/api/asaas/create-charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: null, // Will use name/cpf to find or create
                    name: customer?.name || 'Cliente Balcão',
                    cpfCnpj: customer?.cpf || '00000000000', // Asaas might require valid CPF, handle fallback
                    mobilePhone: customer?.phone,
                    billingType: type,
                    value: total,
                    description: `Pedido PDV`,
                })
            })

            const data = await res.json()

            if (data.error) throw new Error(data.error)

            if (type === 'PIX' && data.pixQrCode) {
                setPixData({
                    encodedImage: data.pixQrCode.encodedImage,
                    payload: data.pixQrCode.payload,
                    copypaste: data.pixQrCode.payload,
                    id: data.id
                })
                setStep('pix_qrcode')
            } else if (type === 'CREDIT_CARD' && data.invoiceUrl) {
                // For Link, we just show the invoice URL
                setPixData({ copypaste: data.invoiceUrl, id: data.id })
                setStep('link_generated')
            } else {
                // Fallback direct confirmation if no special UI needed
                onConfirm(type, { asaasId: data.id })
            }

        } catch (error) {
            console.error(error)
            alert("Erro ao gerar cobrança Asaas")
        } finally {
            setProcessing(false)
        }
    }

    const handleConfirm = async () => {
        if (method === 'DINHEIRO') {
            await onConfirm(method, { receivedAmount: parseFloat(receivedAmount), change: parseFloat(receivedAmount) - total })
        } else if (method === 'PIX') {
            await handleAsaasPayment('PIX')
        } else if (method === 'CREDIT_CARD') {
            await handleAsaasPayment('CREDIT_CARD')
        } else {
            await onConfirm(method)
        }
    }

    const change = receivedAmount ? Math.max(0, parseFloat(receivedAmount) - total) : 0

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pagamento</DialogTitle>
                </DialogHeader>

                {step === 'selection' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className={cn("h-20 flex flex-col gap-2", method === 'PIX' && "border-teal-500 bg-teal-50 text-teal-700")}
                                onClick={() => setMethod('PIX')}
                            >
                                <QrCode className="h-6 w-6" />
                                Pix (Asaas)
                            </Button>
                            <Button
                                variant="outline"
                                className={cn("h-20 flex flex-col gap-2", method === 'CREDIT_CARD' && "border-blue-500 bg-blue-50 text-blue-700")}
                                onClick={() => setMethod('CREDIT_CARD')}
                            >
                                <LinkIcon className="h-6 w-6" />
                                Link (Asaas)
                            </Button>
                            <Button
                                variant="outline"
                                className={cn("h-20 flex flex-col gap-2", method === 'MAQUININHA' && "border-purple-500 bg-purple-50 text-purple-700")}
                                onClick={() => setMethod('MAQUININHA')}
                            >
                                <CreditCard className="h-6 w-6" />
                                Maquininha
                            </Button>
                            <Button
                                variant="outline"
                                className={cn("h-20 flex flex-col gap-2", method === 'DINHEIRO' && "border-green-500 bg-green-50 text-green-700")}
                                onClick={() => setMethod('DINHEIRO')}
                            >
                                <Banknote className="h-6 w-6" />
                                Dinheiro
                            </Button>
                        </div>

                        {method === 'DINHEIRO' && (
                            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                <Label>Valor Recebido</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="pl-9"
                                        value={receivedAmount}
                                        onChange={e => setReceivedAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                    <span>Troco:</span>
                                    <span className={cn(change < 0 ? "text-red-500" : "text-green-600")}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(change)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-2">
                            <div className="mr-auto text-xl font-bold">
                                Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                            </div>
                            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={processing || (method === 'DINHEIRO' && parseFloat(receivedAmount || '0') < total)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {processing ? <Loader2 className="animate-spin" /> : "Confirmar"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'pix_qrcode' && pixData && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="mx-auto w-48 h-48 relative border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            {pixData.encodedImage ? (
                                <img src={`data:image/png;base64,${pixData.encodedImage}`} alt="Pix QRCode" className="w-full h-full object-contain" />
                            ) : (
                                <QrCode className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Copia e Cola</Label>
                            <div className="flex gap-2">
                                <Input value={pixData.copypaste} readOnly className="text-xs" />
                                <Button size="icon" onClick={() => {
                                    navigator.clipboard.writeText(pixData.copypaste || "")
                                    alert("Copiado!")
                                }}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button className="w-full bg-emerald-600" onClick={() => onConfirm('PIX', { asaas_payload: pixData, asaasId: pixData?.id })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Pedido (Aguardando Pagamento)
                        </Button>
                    </div>
                )}

                {step === 'link_generated' && pixData && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <LinkIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium">Link de Pagamento Gerado</h3>
                        <div className="space-y-2">
                            <Label>Link para compartilhar</Label>
                            <div className="flex gap-2">
                                <Input value={pixData.copypaste} readOnly className="text-sm" />
                                <Button size="icon" onClick={() => {
                                    navigator.clipboard.writeText(pixData.copypaste || "")
                                    alert("Copiado!")
                                }}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" asChild>
                            <a href={pixData.copypaste} target="_blank" rel="noreferrer">Abrir Link</a>
                        </Button>
                        <Button className="w-full bg-emerald-600" onClick={() => onConfirm('CREDIT_CARD', { invoiceUrl: pixData.copypaste, asaasId: pixData.id })}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Pedido (Link Gerado)
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
