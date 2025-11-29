"use client"

import { useState } from "react"
import { MapPin, Plus, Pencil, Trash2, Check, Star, Home } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/app/account/actions"
import { cn } from "@/lib/utils"

export type Address = {
  id: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState<Address | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultAddress = addresses.find(a => a.is_default) || addresses[0]

  async function handleSave(formData: FormData) {
    setLoading(true)
    try {
      if (isEditing) {
        formData.append("id", isEditing.id)
        const res = await updateAddress(formData)
        if (res.error) throw new Error(res.error)
        toast.success("Endereço atualizado!")
      } else {
        const res = await addAddress(formData)
        if (res.error) throw new Error(res.error)
        toast.success("Endereço adicionado!")
      }
      setIsEditing(null)
      setIsAdding(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return
    const res = await deleteAddress(id)
    if (res.error) toast.error(res.error)
    else toast.success("Endereço removido!")
  }

  async function handleSetDefault(id: string) {
    const res = await setDefaultAddress(id)
    if (res.error) toast.error(res.error)
    else toast.success("Endereço padrão atualizado!")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">Endereço de Entrega</h3>
          <p className="text-sm text-muted-foreground">Gerencie onde você recebe seus pedidos.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) {
            setIsAdding(false)
            setIsEditing(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">Gerenciar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            <div className="p-6 pb-4 border-b">
              <DialogHeader>
                <DialogTitle>{isAdding ? "Novo Endereço" : isEditing ? "Editar Endereço" : "Meus Endereços"}</DialogTitle>
                <DialogDescription>
                  {isAdding || isEditing ? "Preencha os dados abaixo." : "Selecione um endereço ou adicione um novo."}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {!isAdding && !isEditing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full h-auto py-8 border-dashed border-2 hover:border-primary hover:bg-accent/50 group flex flex-col gap-2" 
                      onClick={() => setIsAdding(true)}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted group-hover:bg-background flex items-center justify-center transition-colors border">
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                      </div>
                      <span className="font-medium">Adicionar Novo Endereço</span>
                    </Button>
                    
                    <div className="grid gap-3">
                      {addresses.map(address => (
                        <div 
                          key={address.id} 
                          className={cn(
                            "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:shadow-md",
                            address.is_default ? "border-primary/50 bg-primary/5" : "bg-card hover:border-primary/20"
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{address.street}, {address.number}</span>
                              {address.is_default && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                  Padrão
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.neighborhood} • {address.city}/{address.state}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{address.zip_code}</span>
                              {address.complement && (
                                <>
                                  <span>•</span>
                                  <span className="italic">{address.complement}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {!address.is_default && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Definir como padrão" onClick={() => handleSetDefault(address.id)}>
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(address)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(address.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {addresses.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>Nenhum endereço cadastrado.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.form 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    action={handleSave} 
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Rua / Avenida</Label>
                        <Input name="street" defaultValue={isEditing?.street} required placeholder="Ex: Av. Paulista" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input name="number" defaultValue={isEditing?.number} required placeholder="123" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Complemento</Label>
                        <Input name="complement" defaultValue={isEditing?.complement} placeholder="Apto 101" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input name="neighborhood" defaultValue={isEditing?.neighborhood} required placeholder="Bela Vista" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <Input name="zip_code" defaultValue={isEditing?.zip_code} required placeholder="00000-000" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input name="city" defaultValue={isEditing?.city} required placeholder="São Paulo" className="bg-muted/30" />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Input name="state" defaultValue={isEditing?.state} required placeholder="SP" maxLength={2} className="bg-muted/30" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setIsEditing(null); }}>Cancelar</Button>
                      <Button type="submit" disabled={loading} variant="fire" className="shadow-fire">
                        {loading ? "Salvando..." : isEditing ? "Atualizar Endereço" : "Salvar Endereço"}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden border-muted bg-gradient-to-br from-card to-muted/20 transition-all hover:shadow-md">
        <CardContent className="p-0">
          {defaultAddress ? (
            <div className="flex items-stretch">
              <div className="w-16 bg-muted/30 flex items-center justify-center border-r border-muted">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{defaultAddress.street}, {defaultAddress.number}</h4>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Padrão</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {defaultAddress.neighborhood}, {defaultAddress.city} - {defaultAddress.state}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{defaultAddress.zip_code}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Home className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">Nenhum endereço padrão definido</p>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                Adicione um endereço para facilitar seus pedidos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
