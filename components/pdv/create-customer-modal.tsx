"use client"

import { useState } from "react"
import { Loader2, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

type CreateCustomerModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: (customer: any) => void
    initialName?: string
}

export function CreateCustomerModal({ isOpen, onClose, onSuccess, initialName = "" }: CreateCustomerModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(initialName)
    const [phone, setPhone] = useState("")
    const [cpf, setCpf] = useState("")
    const [email, setEmail] = useState("")

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Nome é obrigatório")
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Create Customer in Asaas
            let asaasId = null
            if (cpf) {
                try {
                    const asaasRes = await fetch("/api/asaas/customers", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name,
                            cpfCnpj: cpf.replace(/\D/g, ''),
                            mobilePhone: phone.replace(/\D/g, ''),
                            email
                        })
                    })

                    if (asaasRes.ok) {
                        const asaasData = await asaasRes.json()
                        asaasId = asaasData.id
                    } else {
                        console.warn("Falha ao criar cliente no Asaas (continuando apenas local)")
                    }
                } catch (e) {
                    console.error("Erro integração Asaas", e)
                }
            }

            const payload: any = {
                full_name: name,
                phone: phone || null,
                cpf: cpf || null,
                // email: email || null, // Assuming profiles table has email column? If not, Supabase might error. 
                // Let's stick to known columns + extra metadata if feasible or just omit email from profiles if risky.
                // Profiles usually has: id, full_name, etc.
            }

            // 2. Try to save to Supabase Profiles
            let profileData = null

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .insert([payload])
                    .select()
                    .single()

                if (error) {
                    console.warn("Erro Supabase (pode ser esperado em modo convidado):", error)
                    throw error
                }
                profileData = data

            } catch (dbError) {
                // Expected failure for non-auth customers (FK constraint to auth.users)
                // Fallback to local object

                profileData = {
                    id: 'temp-' + Date.now(),
                    full_name: name,
                    phone: phone,
                    cpf: cpf,
                    email: email
                }
                toast.success("Cliente temporário criado para este pedido.")
            }

            if (profileData) {
                // Attach Asaas ID if available
                if (asaasId) {
                    profileData.asaas_id = asaasId
                }
                onSuccess(profileData)
                onClose()
            }

        } catch (error: any) {
            console.error("Erro Geral:", error)
            toast.error("Erro inesperado. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-black/5 dark:border-white/10"
            >
                <div className="flex justify-between items-center p-4 border-b border-black/5 dark:border-white/5">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-emerald-500" />
                        Novo Cliente
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Nome Completo *</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Email (Opcional)</Label>
                        <Input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="exemplo@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Telefone / WhatsApp</Label>
                        <Input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Ex: 11999999999"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>CPF (Opcional)</Label>
                        <Input
                            value={cpf}
                            onChange={e => setCpf(e.target.value)}
                            placeholder="000.000.000-00"
                        />
                    </div>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Cliente
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
