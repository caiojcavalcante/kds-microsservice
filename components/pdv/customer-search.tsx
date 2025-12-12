import { useState, useEffect, useRef } from "react"
import { Search, User, Check, Plus, Loader2, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"
import { CreateCustomerModal } from "./create-customer-modal"
import { AnimatePresence } from "framer-motion"

type Profile = {
    id: string
    full_name: string | null
    phone: string | null
    cpf: string | null
    email?: string
    source?: 'LOCAL' | 'ASAAS'
}

type CustomerSearchProps = {
    onSelect: (customer: Profile) => void
    selectedCustomer?: Profile | null
    onClear: () => void
}

export function CustomerSearch({ onSelect, selectedCustomer, onClear }: CustomerSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Profile[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Search profiles when query changes
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current)

        if (!query || query.length < 3) {
            setResults([])
            return
        }

        searchTimeout.current = setTimeout(async () => {
            setLoading(true)

            try {
                const res = await fetch(`/api/customers/search?query=${encodeURIComponent(query)}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    setResults(data)
                }
            } catch (err) {
                console.error("Error searching customers:", err)
            } finally {
                setLoading(false)
            }
        }, 500)
    }, [query])

    if (selectedCustomer) {
        // ... (keep existing selected view, using selectedCustomer prop)
        return (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{selectedCustomer.full_name || 'Cliente Sem Nome'}</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone || selectedCustomer.cpf || 'Sem contato'}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                    onClear()
                    setQuery("")
                    setResults([])
                }}>
                    Trocar
                </Button>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cliente (nome, telefone, cpf)..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="pl-9 h-11 transition-all"
                    />
                    {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Novo Cliente"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            {isOpen && query.length >= 3 && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-black/5 dark:border-white/10 z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {results.map((profile) => (
                        <div
                            key={profile.id}
                            onClick={() => {
                                onSelect(profile)
                                setIsOpen(false)
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-black/5 last:border-0"
                        >
                            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-muted-foreground shrink-0">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">{profile.full_name || 'Sem Nome'}</p>
                                    {profile.source === 'ASAAS' && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">ASAAS</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{profile.phone} {profile.cpf ? `• ${profile.cpf}` : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && query.length >= 3 && results.length === 0 && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-black/5 dark:border-white/10 z-50 p-4 flex flex-col items-center gap-3">
                    <p className="text-sm text-neutral-500">Nenhum cliente encontrado.</p>
                    <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                            setIsOpen(false)
                            setIsCreateModalOpen(true)
                        }}
                    >
                        <UserPlus className="mr-2 h-4 w-4" /> Cadastrar "{query}"
                    </Button>
                </div>
            )}

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateCustomerModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        initialName={query}
                        onSuccess={(customer) => {
                            onSelect(customer)
                            setQuery("")
                            setResults([])
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
