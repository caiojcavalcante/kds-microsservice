"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import menuData from "@/app/data/menu.json"

export function CategoriesGrid() {
    const [showAllCategories, setShowAllCategories] = useState(false)

    // Filter categories that have items
    const validCategories = menuData.filter(cat => cat.items && cat.items.length > 0)

    // Sort categories by priority
    const priorityOrder = [
        'Cortes de carne',
        'Hambúrguer Artesanal',
        'RISOTOS',
        'Refrigerantes',
        'Cervejas'
    ]

    validCategories.sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.name)
        const idxB = priorityOrder.indexOf(b.name)

        // If both are in the priority list, sort by index
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        // If only A is in the list, A comes first
        if (idxA !== -1) return -1
        // If only B is in the list, B comes first
        if (idxB !== -1) return 1

        // If neither is in the list, maintain original order
        return 0
    })

    const displayedCategories = showAllCategories
        ? validCategories
        : validCategories.slice(0, 4)

    const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                    <UtensilsCrossed className="h-5 w-5" />
                    Categorias
                </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedCategories.map((category) => {
                    const categoryImage = category.items.find((i: any) => i.img)?.img || null
                    return (
                        <Link
                            href={`/cardapio/${slugify(category.name)}`}
                            key={category.id}
                            className="block group"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="relative aspect-square rounded-xl overflow-hidden shadow-md border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900"
                            >
                                {categoryImage ? (
                                    <Image
                                        src={categoryImage}
                                        alt={category.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110 brightness-75 group-hover:brightness-100"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                        <span className="text-neutral-400">Sem Imagem</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-xl md:text-2xl group-hover:translate-x-2 transition-transform duration-300 flex items-center gap-2">
                                        {category.name}
                                        <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-white/70 text-sm">
                                        {category.items.length} itens
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    )
                })}
            </div>

            {validCategories.length > 4 && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                        {showAllCategories ? (
                            <>Ver menos <ChevronUp className="h-4 w-4" /></>
                        ) : (
                            <>Ver mais categorias <ChevronDown className="h-4 w-4" /></>
                        )}
                    </Button>
                </div>
            )}
        </section>
    )
}
