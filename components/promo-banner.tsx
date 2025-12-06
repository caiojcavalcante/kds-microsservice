"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star, Loader2 } from "lucide-react"
import { useMenu, type MenuItem } from "@/hooks/use-menu"
import { ProductCustomizer, Product } from "@/components/product-customizer"
import { useCart } from "@/contexts/cart-context"

// IDs of the burgers to display (these are legacy numeric IDs - we'll match by name instead)
const PROMO_NAMES = [
    { name: "GIGA BURGUER", highlight: false },
    { name: "SUPREMACIA CARNE DO SOL", highlight: false },
    { name: "TOSCANO", highlight: false },
]

export function PromoBanner() {
    const { menu, loading } = useMenu()
    const { addToCart } = useCart()
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

    // Find products from menu
    const burgers = useMemo(() => {
        if (!menu.length) return []
        const allItems = menu.flatMap((cat) => cat.items)
        return PROMO_NAMES.map(promo => {
            const product = allItems.find((item) =>
                item.name.toUpperCase().includes(promo.name.toUpperCase()) ||
                promo.name.toUpperCase().includes(item.name.toUpperCase())
            )
            if (!product) return null
            return {
                ...product,
                highlight: promo.highlight,
                promotional_percentage: product.promotional_price
                    ? Math.round((1 - product.promotional_price / product.price) * 100)
                    : null
            }
        }).filter(Boolean) as (MenuItem & { highlight: boolean; promotional_percentage: number | null })[]
    }, [menu])

    if (loading) {
        return (
            <section className="relative w-full overflow-hidden py-12 md:py-24 bg-black">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,80,0,0.15)_0%,rgba(0,0,0,1)_80%)]" />
                </div>
                <div className="container relative z-10 mx-auto px-4 flex items-center justify-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-red-500" />
                </div>
            </section>
        )
    }

    return (
        <section className="relative w-full overflow-hidden py-12 md:py-24 bg-black">
            {/* Background with Fire/Parrilla effect */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,80,0,0.15)_0%,rgba(0,0,0,1)_80%)]" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay" />
                {/* Animated embers/fire glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 via-transparent to-transparent animate-pulse-slow" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-6"
                >
                    <div className="inline-block rounded-full bg-gradient-to-r from-red-700 to-red-600 px-6 py-2 text-sm font-bold text-white mb-6 shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-500/30">
                        OFERTA IMPERDÍVEL
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
                        Os Favoritos da <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 animate-text-shimmer">Galera</span>
                    </h2>
                    <p>
                        <span className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto mt-4 font-medium leading-relaxed">
                            Descubra os hambúrgueres que conquistaram o coração e o paladar dos nossos clientes.
                        </span>

                    </p>
                </motion.div>

                {/* Swipe Hint (Mobile Only) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="flex md:hidden items-center justify-center gap-2 text-neutral-400 text-sm mb-4 animate-pulse"
                >
                    <span>Arraste para o lado</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce-x">
                        <path d="M13 7L18 12L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>

                <div className="flex overflow-x-auto overflow-y-auto snap-x snap-mandatory pb-8 gap-4 px-4 -mx-4 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:px-0 md:mx-auto items-center max-w-6xl scrollbar-hide">
                    {burgers.map((burger, index) => (
                        <motion.div
                            key={burger.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className={`relative group min-w-[85vw] h-full snap-center md:min-w-0 ${burger.highlight ? "md:-mt-12 md:scale-105 z-20" : "z-10"}`}
                            onClick={() => setConfiguringProduct(burger as any)}
                        >
                            {/* Card Container with Iron/Metal effect */}

                            <div className="relative overflow-hidden rounded-2xl bg-neutral-900/10 border border-neutral-700/50 shadow-2xl transition-all duration-300 group-hover:border-red-500/30 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] cursor-pointer">

                                <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-md rounded-2xl" />
                                {/* Iron Shimmer Effect */}
                                <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                {/* Image Container with Thin Bezel */}
                                <div className="relative w-full aspect-[3/4] mb-6 rounded-xl overflow-hidden border border-white/5 bg-black/20">
                                    {/* Inner glow behind burger */}

                                    <div className="absolute inset-0 bg-radial-gradient from-red-500/10 to-transparent opacity-50" />
                                    {/* <div className="absolute inset-0 z-0 bg-white/5 backdrop-blur-md rounded-2xl" /> */}

                                    {/* Promotional Flag */}
                                    {burger.promotional_percentage && (
                                        <div className="absolute top-0 right-0 z-20 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-lg">
                                            -{burger.promotional_percentage}%
                                        </div>
                                    )}

                                    <div className={`relative w-full h-full transition-transform duration-500 group-hover:scale-105 ${burger.highlight ? "scale-110" : ""}`}>
                                        {burger.img ? (
                                            <Image
                                                src={burger.img}
                                                alt={burger.name}
                                                fill
                                                className="object-cover drop-shadow-2xl"
                                                quality={100}
                                                priority
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                                Sem imagem
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-left text-left z-10"></div>
                                {/* Content */}
                                <div className="relative flex flex-col p-2 z-20">
                                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-wide">
                                        {burger.name}
                                    </h3>
                                    <p className="text-neutral-400 text-sm mb-4 line-clamp-2 font-medium">
                                        {burger.description}
                                    </p>

                                    <div className="flex items-center gap-1 mb-6 ml-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between w-full bg-black/40 rounded-lg p-1.5 border border-white/5">
                                        <span className="text-xl font-black text-white px-3">
                                            {burger.promotional_price ? (
                                                <div className="flex items-center">
                                                    <span className="text-green-400 font-bold">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(burger.promotional_price)}
                                                    </span>
                                                    <span className="text-xs text-white/60 line-through">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(burger.price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(burger.price)
                                            )}
                                        </span>
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider shadow-lg hover:shadow-red-900/20 transition-all">
                                            Pedir <ShoppingCart className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>

                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Product Customizer Modal */}
            <AnimatePresence>
                {configuringProduct && (
                    <ProductCustomizer
                        product={configuringProduct as any}
                        onClose={() => setConfiguringProduct(null)}
                        onConfirm={(item, redirect) => {
                            addToCart(item)
                            setConfiguringProduct(null)
                            if (redirect) {
                                window.location.href = "/carrinho"
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </section >
    )
}
