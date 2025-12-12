"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, Play, Heart, MessageCircle, MapPin, Clock, X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/contexts/cart-context"
import { toast } from "sonner"

interface InstagramFeedProps {
    categories?: any[]
    onProductSelect?: (product: any) => void
}

export function InstagramFeed({ categories = [], onProductSelect }: InstagramFeedProps) {
    const { addToCart } = useCart()

    // Static feed data
    const posts = [
        { id: 1, img: "/thumbnails/497136094_1668874200404642_863514013197056874_n.jpg", likes: 145, comments: 12 },
        { id: 2, img: "/thumbnails/505142399_587824664366099_7093704699311747767_n.jpg", likes: 98, comments: 8 },
        { id: 3, img: "/thumbnails/560534614_18329151379232542_4504627923400247638_n.jpg", likes: 210, comments: 24 },
        { id: 4, img: "/thumbnails/562068625_1256925942856424_501815671438636373_n.jpg", likes: 167, comments: 15 },
    ]

    // Story Viewer State
    const [activeCategory, setActiveCategory] = useState<any | null>(null)
    const [storyIndex, setStoryIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null)

    const validCategories = categories.filter(c => c.items && c.items.length > 0 && c.items.some((i: any) => i.img))

    const handleOpenStory = (category: any) => {
        // Filter items with images only
        const validItems = category.items.filter((i: any) => i.img)
        if (validItems.length === 0) return

        setActiveCategory({ ...category, items: validItems })
        setStoryIndex(0)
        setProgress(0)
    }

    const handleCloseStory = () => {
        setActiveCategory(null)
        setStoryIndex(0)
        setProgress(0)
    }

    const nextStory = () => {
        if (!activeCategory) return
        if (storyIndex < activeCategory.items.length - 1) {
            setStoryIndex(prev => prev + 1)
            setProgress(0)
        } else {
            handleCloseStory()
        }
    }

    const prevStory = () => {
        if (storyIndex > 0) {
            setStoryIndex(prev => prev - 1)
            setProgress(0)
        }
    }

    const handleBuyNow = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent navigation
        if (!activeCategory) return
        const item = activeCategory.items[storyIndex]

        if (onProductSelect) {
            onProductSelect(item)
            handleCloseStory()
            return
        }

        addToCart({
            product: item,
            quantity: 1,
            selectedOptions: {},
            notes: "",
            totalPrice: item.price
        })
        toast.success(`${item.name} adicionado ao carrinho! 🛒`)
    }

    // Auto-advance logic
    useEffect(() => {
        if (!activeCategory) return

        const duration = 5000 // 5 seconds per slide
        const interval = 50   // Update progress every 50ms
        const step = 100 / (duration / interval)

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory()
                    return 0
                }
                return prev + step
            })
        }, interval)

        return () => clearInterval(timer)
    }, [activeCategory, storyIndex]) // Re-run when story index changes to reset timer/logic logic is handled by nextStory calling state update

    // Prevent body scroll when open
    useEffect(() => {
        if (activeCategory) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [activeCategory])

    const currentItem = activeCategory ? activeCategory.items[storyIndex] : null

    return (
        <section className="py-16 bg-neutral-950 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center text-center mb-12 space-y-6">
                    {/* Profile Header (Same as before) */}
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="h-24 w-24 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[3px] rounded-full"
                    >
                        <div className="h-full w-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                            <Instagram className="h-10 w-10 text-white" />
                        </div>
                    </motion.div>

                    <div className="space-y-2">
                        <Link href="https://www.instagram.com/ferroefogopiranhas" target="_blank" className="hover:opacity-80 transition-opacity">
                            <h2 className="text-2xl font-bold text-white">@ferroefogopiranhas</h2>
                        </Link>

                        <div className="flex items-center justify-center gap-6 text-sm">
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">133</span>
                                <span className="text-neutral-500">posts</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">5.9K</span>
                                <span className="text-neutral-500">followers</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-white text-lg">1.9K</span>
                                <span className="text-neutral-500">following</span>
                            </div>
                        </div>

                        <div className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed pt-2">
                            <p className="font-semibold">Hamburgueria & Parrilla em Piranhas-AL</p>
                            <p>Chef. @chef.denissonpaiva</p>
                            <p className="flex items-center justify-center gap-1 mt-1"><Clock className="h-3 w-3" /> 17h às 00h • Fechamos às terças</p>
                            <p className="flex items-center justify-center gap-1"><MapPin className="h-3 w-3" /> Tv Silas Tavares</p>
                            <p className="text-red-400 font-medium mt-1">📲 Pedidos pelo link 👇🏼</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="https://www.instagram.com/ferroefogopiranhas"
                            target="_blank"
                            className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                            Ver Perfil
                        </Link>
                    </div>
                </div>

                {/* HIGHLIGHTS (Dynamic Categories) */}
                <div className="flex justify-start gap-6 md:gap-8 mb-12 overflow-x-scroll overflow-y-hidden pb-4 scrollbar-hide px-4">
                    {validCategories.map((category: any, i: number) => {
                        // Find first valid image for cover
                        const coverItem = category.items.find((it: any) => it.img)
                        const coverImg = category.category_image_url || (coverItem ? coverItem.img : null)

                        if (!coverImg) return null

                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleOpenStory(category)}
                                className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
                            >
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 group-hover:scale-105 transition-transform">
                                    <div className="h-full w-full rounded-full border-2 border-black overflow-hidden relative bg-neutral-900">
                                        <Image src={coverImg} alt={category.name} fill className="object-cover" />
                                    </div>
                                </div>
                                <span className="text-xs text-neutral-400 group-hover:text-white transition-colors max-w-[80px] truncate text-center">{category.name}</span>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Feed Grid (Static) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-4 max-w-4xl mx-auto">
                    {posts.map((post, i) => (
                        <motion.a
                            key={post.id}
                            href="https://www.instagram.com/ferroefogopiranhas"
                            target="_blank"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative aspect-square bg-neutral-900 md:rounded-sm overflow-hidden cursor-pointer"
                        >
                            <Image
                                src={post.img}
                                alt="Post"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white">
                                <div className="flex items-center gap-2 font-bold">
                                    <Heart className="h-6 w-6 fill-white" />
                                    <span>{post.likes}</span>
                                </div>
                                <div className="flex items-center gap-2 font-bold">
                                    <MessageCircle className="h-6 w-6 fill-white" />
                                    <span>{post.comments}</span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>

            {/* FULL SCREEN STORY VIEWER */}
            <AnimatePresence>
                {activeCategory && currentItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 bg-black flex items-center justify-center"
                        onClick={handleCloseStory} // Click outside to close (or navigation zones)
                    >
                        {/* Close Button */}
                        <button onClick={handleCloseStory} className="absolute top-6 right-4 z-50 text-white p-2">
                            <X className="h-8 w-8 drop-shadow-lg" />
                        </button>

                        {/* Background Image (Blured) */}
                        <div className="absolute inset-0 z-0 opacity-30 blur-2xl">
                            <Image src={currentItem.img} alt="bg" fill className="object-cover" />
                        </div>

                        {/* Story Container */}
                        <motion.div
                            className="relative w-full h-full md:w-[400px] md:h-[80vh] md:rounded-2xl overflow-hidden bg-neutral-900 flex flex-col"
                            onClick={(e) => e.stopPropagation()} // Stop click propagation
                        >
                            {/* Progress Bars */}
                            <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2">
                                {activeCategory.items.map((_: any, i: number) => (
                                    <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-100 ease-linear"
                                            style={{
                                                width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Main Image */}
                            <div className="relative flex-1 bg-black">
                                <Image src={currentItem.img} alt={currentItem.name} fill className="object-cover" />
                                {/* Touch Navigation Zones */}
                                <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={prevStory} />
                                <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={nextStory} />
                            </div>

                            {/* Bottom Content / CTA */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-40 pb-12 md:pb-6 text-white space-y-3">
                                <div>
                                    <h3 className="text-2xl font-bold">{currentItem.name}</h3>
                                    <p className="text-sm text-neutral-300 line-clamp-2">{currentItem.description}</p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xl font-bold text-red-500">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentItem.promotional_price || currentItem.price)}
                                    </span>

                                    <button
                                        onClick={handleBuyNow}
                                        className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-neutral-200 transition-colors active:scale-95"
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        Comprar Agora
                                    </button>
                                </div>
                            </div>

                            {/* Header Info */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full border border-white/20 overflow-hidden relative">
                                    <Image src={activeCategory.category_image_url || activeCategory.items[0].img} alt="cat" fill className="object-cover" />
                                </div>
                                <span className="font-semibold text-black text-sm drop-shadow-md">{activeCategory.name}</span>
                                <span className="text-black/60 text-xs">• {storyIndex + 1}/{activeCategory.items.length}</span>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
