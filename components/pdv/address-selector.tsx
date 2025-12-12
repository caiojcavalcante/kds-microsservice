"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, Loader2, Home, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Address = {
    id: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zip_code: string
    is_default?: boolean
}

type AddressSelectorProps = {
    userId?: string
    onSelect: (address: string) => void
}

export function AddressSelector({ userId, onSelect }: AddressSelectorProps) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<"list" | "new">("list")
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // New Address Form
    const [newAddress, setNewAddress] = useState<Partial<Address>>({
        city: "Piranhas",
        state: "AL",
        zip_code: ""
    })

    // Fetch addresses when userId changes
    useEffect(() => {
        if (!userId) {
            setAddresses([])
            setMode("new")
            return
        }

        async function fetchAddresses() {
            if (!userId) return

            setLoading(true)
            const supabase = createClient()
            let query = supabase.from('addresses').select('*')

            if (userId.startsWith('asaas_')) {
                query = query.eq('asaas_customer_id', userId.replace('asaas_', ''))
            } else {
                query = query.eq('user_id', userId)
            }

            const { data } = await query

            if (data) {
                setAddresses(data)
                if (data.length > 0) {
                    setMode("list")
                    // Auto select default or first
                    const def = data.find(a => a.is_default) || data[0]
                    handleSelect(def)
                } else {
                    setMode("new")
                }
            }
            setLoading(false)
        }
        fetchAddresses()
    }, [userId])

    const handleSelect = (address: Address) => {
        setSelectedAddressId(address.id)
        const formatted = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}` + (address.complement ? ` (${address.complement})` : "")
        onSelect(formatted)
    }

    const handleManualChange = (field: keyof Address, value: string) => {
        const updated = { ...newAddress, [field]: value }
        setNewAddress(updated)

        // Update parent immediately for manual entry (preview)
        const formatted = `${updated.street || ''}, ${updated.number || ''} - ${updated.neighborhood || '', updated.city || ''}/${updated.state || ''}` + (updated.complement ? ` (${updated.complement})` : "")
        onSelect(formatted)
    }

    const isExternalCustomer = userId?.startsWith('asaas_')

    const handleSaveAddress = async () => {
        if (!userId) {
            toast.error("Usuário não identificado")
            return
        }
        if (!newAddress.street || !newAddress.number || !newAddress.neighborhood) {
            toast.error("Preencha Rua, Número e Bairro")
            return
        }


        setIsSaving(true)
        try {
            const supabase = createClient()

            const insertData: any = {
                street: newAddress.street,
                number: newAddress.number,
                complement: newAddress.complement,
                neighborhood: newAddress.neighborhood,
                city: newAddress.city,
                state: newAddress.state,
                zip_code: newAddress.zip_code || "00000-000",
                is_default: addresses.length === 0
            }

            if (isExternalCustomer) {
                insertData.asaas_customer_id = userId.replace('asaas_', '')
                insertData.user_id = null // Explicitly null for external
            } else {
                insertData.user_id = userId
            }

            const { data, error } = await supabase.from('addresses').insert(insertData).select().single()

            if (error) {
                throw error
            }

            if (data) {
                setAddresses(prev => [...prev, data])
                handleSelect(data)
                setMode("list")
                toast.success("Endereço salvo com sucesso!")

                // Clear form but keep city/state
                setNewAddress({
                    city: newAddress.city,
                    state: newAddress.state,
                    zip_code: ""
                })
            }
        } catch (error: any) {
            console.error("Save Address Error:", error?.message || error)
            toast.error("Erro ao salvar endereço: " + (error?.message || "Erro desconhecido"))
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-4">
            {userId && addresses.length > 0 && (
                <div className="flex gap-2 mb-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <button
                        onClick={() => setMode("list")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                            mode === "list"
                                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                        )}
                    >
                        <MapPin className="h-4 w-4" /> Endereços Salvos
                    </button>
                    <button
                        onClick={() => setMode("new")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                            mode === "new"
                                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
                        )}
                    >
                        <Plus className="h-4 w-4" /> Novo Endereço
                    </button>
                </div>
            )}

            {mode === "list" && userId && (
                <div className="space-y-3">
                    {addresses.map(addr => (
                        <div
                            key={addr.id}
                            onClick={() => handleSelect(addr)}
                            className={cn(
                                "p-3 rounded-xl border cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-start gap-3",
                                selectedAddressId === addr.id
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-sm"
                                    : "border-neutral-200 dark:border-neutral-800"
                            )}
                        >
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                selectedAddressId === addr.id ? "bg-emerald-500 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                            )}>
                                {selectedAddressId === addr.id ? <Check className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                                <p className={cn("font-medium text-sm", selectedAddressId === addr.id ? "text-emerald-900 dark:text-emerald-100" : "text-neutral-900 dark:text-neutral-100")}>
                                    {addr.street}, {addr.number}
                                </p>
                                <p className="text-xs text-neutral-500">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                {addr.complement && <p className="text-xs text-neutral-500 italic mt-0.5">{addr.complement}</p>}
                            </div>
                        </div>
                    ))}
                    {addresses.length === 0 && (
                        <div className="text-center py-8 text-neutral-500">
                            <Home className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Nenhum endereço salvo</p>
                        </div>
                    )}
                </div>
            )}

            {mode === "new" && (
                <div className="space-y-4 p-1">
                    <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3 space-y-1">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Rua</Label>
                            <Input
                                placeholder="Av. Principal"
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.street || ''}
                                onChange={e => handleManualChange('street', e.target.value)}
                            />
                        </div>
                        <div className="col-span-1 space-y-1">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Número</Label>
                            <Input
                                placeholder="123"
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.number || ''}
                                onChange={e => handleManualChange('number', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Bairro</Label>
                            <Input
                                placeholder="Centro"
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.neighborhood || ''}
                                onChange={e => handleManualChange('neighborhood', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Complemento</Label>
                            <Input
                                placeholder="Apto 101"
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.complement || ''}
                                onChange={e => handleManualChange('complement', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-2">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cidade</Label>
                            <Input
                                placeholder="Cidade"
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.city || 'Piranhas'}
                                onChange={e => handleManualChange('city', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">UF</Label>
                            <Input
                                placeholder="AL"
                                maxLength={2}
                                className="bg-white dark:bg-neutral-900"
                                value={newAddress.state || 'AL'}
                                onChange={e => handleManualChange('state', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">CEP (Opcional)</Label>
                        <Input
                            placeholder="00000-000"
                            className="bg-white dark:bg-neutral-900"
                            value={newAddress.zip_code || ''}
                            onChange={e => handleManualChange('zip_code', e.target.value)}
                        />
                    </div>

                    {userId && (
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            onClick={handleSaveAddress}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar e Usar Endereço
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
