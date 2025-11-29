"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { X, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Types
export type Option = {
  id: number
  name: string
  price: number
  max?: number
  description?: string | null
}

export type Choice = {
  id: number
  name: string
  min: number
  max: number
  options: Option[]
}

export type Product = {
  id: number
  name: string
  description?: string | null
  price: number
  img?: string | null
  choices?: Choice[]
}

export type CartItem = {
  uniqueId: string
  product: Product
  quantity: number
  selectedOptions: { [choiceId: number]: Option[] }
  notes: string
  totalPrice: number
}

export function ProductCustomizer({
  product,
  onClose,
  onConfirm
}: {
  product: Product
  onClose: () => void
  onConfirm: (cartItem: Omit<CartItem, "uniqueId">, redirect?: boolean) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<{ [choiceId: number]: Option[] }>({})
  const [notes, setNotes] = useState("")

  const toggleOption = (choice: Choice, option: Option) => {
    setSelectedOptions(prev => {
      const current = prev[choice.id] || []
      const isSelected = current.find(o => o.id === option.id)

      if (isSelected) {
        return { ...prev, [choice.id]: current.filter(o => o.id !== option.id) }
      } else {
        // Check max
        if (choice.max === 1) {
          return { ...prev, [choice.id]: [option] }
        }
        if (current.length >= choice.max) return prev
        return { ...prev, [choice.id]: [...current, option] }
      }
    })
  }

  const calculateTotal = () => {
    let total = product.price
    Object.values(selectedOptions).flat().forEach(opt => {
      total += opt.price
    })
    return total * quantity
  }

  const isValid = () => {
    if (!product.choices) return true
    return product.choices.every(choice => {
      if (choice.min > 0) {
        const selected = selectedOptions[choice.id] || []
        return selected.length >= choice.min
      }
      return true
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 flex gap-6 relative">
           {product.img && (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <Image src={product.img} alt={product.name} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 pr-8">
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground text-sm mt-1">{product.description}</p>
            <div className="mt-2 text-xl font-semibold text-green-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {product.choices?.map(choice => {
            const currentSelected = selectedOptions[choice.id] || []
            const isSatisfied = choice.min > 0 ? currentSelected.length >= choice.min : true
            
            return (
              <div key={choice.id} className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <h3 className={cn("font-semibold text-lg", !isSatisfied && "text-red-500")}>
                    {choice.name} {!isSatisfied && "*"}
                  </h3>
                  <span className={cn("text-xs px-2 py-1 rounded", !isSatisfied ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "text-muted-foreground bg-muted")}>
                    {choice.min > 0 ? `Obrigatório (Min ${choice.min})` : "Opcional"} • Max {choice.max}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {choice.options.map(option => {
                    const isSelected = currentSelected.find(o => o.id === option.id)
                    return (
                      <div
                        key={option.id}
                        onClick={() => toggleOption(choice, option)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                          isSelected 
                            ? "border-red-600 bg-red-500/5 shadow-sm" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                            isSelected ? "bg-red-600 border-red-600 text-white" : "border-muted-foreground"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{option.name}</span>
                            {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                          </div>
                        </div>
                        {option.price > 0 && (
                          <span className="text-sm font-medium text-green-500">
                            +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(option.price)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Input 
              placeholder="Ex: Sem cebola, ponto da carne..." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 bg-background rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
          </div>
          
            <Button 
              size="lg" 
              variant="outline" 
              className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => onConfirm({
                product,
                quantity,
                selectedOptions,
                notes,
                totalPrice: calculateTotal()
              }, true)}
              disabled={!isValid()}
            >
              Comprar Agora
            </Button>
            <Button 
              size="lg" 
              variant="fire" 
              className="flex-1 shadow-fire"
              onClick={() => onConfirm({
                product,
                quantity,
                selectedOptions,
                notes,
                totalPrice: calculateTotal()
              }, false)}
              disabled={!isValid()}
            >
              {isValid() ? (
                <>Adicionar • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}</>
              ) : (
                "Selecione obrigatórios"
              )}
            </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
