"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { X, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Types
export type Option = {
  id: string | number
  name: string
  price: number
  max?: number
  description?: string | null
  img?: string | null
}

export type Choice = {
  id: string | number
  name: string
  min: number
  max: number
  options: Option[]
}

export type Product = {
  id: string | number
  name: string
  description?: string | null
  price: number
  promotional_price?: number | null
  promotional_percentage?: number | null
  img?: string | null
  choices?: Choice[]
}

export type CartItem = {
  uniqueId: string
  product: Product
  quantity: number
  selectedOptions: Record<string | number, Option[]>
  notes: string
  totalPrice: number
}

export function ProductCustomizer({
  product,
  onClose,
  onConfirm,
  showBuyNow = true,
  initialValues
}: {
  product: Product
  onClose: () => void
  onConfirm: (cartItem: Omit<CartItem, "uniqueId">, redirect?: boolean) => void
  showBuyNow?: boolean
  initialValues?: Partial<CartItem>
}) {
  const [quantity, setQuantity] = useState(initialValues?.quantity || 1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string | number, Option[]>>(
    initialValues?.selectedOptions || {}
  )
  const [notes, setNotes] = useState(initialValues?.notes || "")

  // Lock body scroll when modal is open
  useEffect(() => {
    // Save original styles
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow

    // Prevent scrolling
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalStyle
      document.documentElement.style.overflow = originalHtmlStyle
    }
  }, [])

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
    let total = product.promotional_price || product.price
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose} // Close on backdrop click
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-black/5 dark:border-white/10"
        onClick={e => e.stopPropagation()} // Prevent close on modal click
      >
        {/* Header */}
        <div className="p-6 flex gap-6 relative border-b border-black/5 dark:border-white/5">
          {product.img && (
            <div className="relative h-24 w-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-black/5 dark:border-white/10">
              <Image src={product.img} alt={product.name} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 pr-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{product.name}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 leading-relaxed">{product.description}</p>
            <div className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
              {product.promotional_price ? (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 line-through text-base">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </span>
                  <span className="text-green-400 font-bold text-xl">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.promotional_price)}
                  </span>
                </div>
              ) : (
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide overscroll-contain">
          {product.choices?.map(choice => {
            const currentSelected = selectedOptions[choice.id] || []
            const isSatisfied = choice.min > 0 ? currentSelected.length >= choice.min : true

            return (
              <div key={choice.id} className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <h3 className={cn("font-bold text-lg tracking-tight", !isSatisfied ? "text-red-500 dark:text-red-400" : "text-neutral-900 dark:text-white")}>
                    {choice.name} {!isSatisfied && "*"}
                  </h3>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium border",
                    !isSatisfied
                      ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      : "text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5"
                  )}>
                    {choice.min > 0 ? `Obrigatório (Min ${choice.min})` : "Opcional"} • Max {choice.max}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {choice.options.map(option => {
                    const isSelected = currentSelected.find(o => o.id === option.id)
                    return (
                      <div
                        key={option.id}
                        onClick={() => toggleOption(choice, option)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                          isSelected
                            ? "border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                            : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Checkbox/Radio Indicator */}
                          <div className={cn(
                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all duration-200 flex-shrink-0",
                            isSelected
                              ? "bg-red-600 border-red-600 text-white scale-110"
                              : "border-neutral-400 dark:border-neutral-600"
                          )}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>

                          {/* Option Image */}
                          {option.img && (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white/50 dark:bg-white/5 flex-shrink-0 border border-black/5 dark:border-white/5">
                              <Image src={option.img} alt={option.name} fill className="object-cover" />
                            </div>
                          )}

                          {/* Option Details */}
                          <div className="flex flex-col flex-1">
                            <span className={cn("font-medium text-sm", isSelected ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-200")}>
                              {option.name}
                            </span>
                            {option.description && (
                              <span className="text-xs text-neutral-500 mt-0.5">{option.description}</span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        {option.price > 0 && (
                          <span className="text-sm font-bold text-green-600 dark:text-green-400 ml-4">
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

          <div className="space-y-3">
            <Label className="text-neutral-900 dark:text-white font-bold text-lg">Observações</Label>
            <Input
              placeholder="Ex: Sem cebola, ponto da carne..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-600 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-100/50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start border border-black/5 dark:border-white/5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="text-neutral-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white h-10 w-10 rounded-lg"
            >
              -
            </Button>
            <span className="w-8 text-center font-bold text-neutral-900 dark:text-white text-lg">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="text-neutral-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white h-10 w-10 rounded-lg"
            >
              +
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1">
            {showBuyNow && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:flex-1 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 hover:border-red-500/50 bg-transparent h-12 rounded-xl text-base font-bold uppercase tracking-wide"
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
            )}
            <Button
              size="lg"
              className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all h-12 rounded-xl text-base font-bold uppercase tracking-wide border-0"
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
                <>{initialValues ? "Atualizar" : "Adicionar"} • {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}</>
              ) : (
                "Selecione obrigatórios"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
