"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ChefHat, Monitor, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import Image from "next/image"
import { PromoBanner } from "@/components/promo-banner"
import { CategoriesGrid } from "@/components/categories-grid"
import { InstagramFeed } from "@/components/instagram-feed"
import { useMenu, type MenuItem } from "@/hooks/use-menu"
import { ProductCustomizer, Product, Choice } from "@/components/product-customizer"
import { useCart } from "@/contexts/cart-context"

const FEATURED_CATEGORY_NAMES = [
    "Cortes de carne",
    "Hambúrguer Artesanal",
    "Cervejas",
    "Refrigerantes",
    "RISOTOS",
]

export function HomeContent({ profile }: { profile?: any }) {
    const { menu, loading } = useMenu()
    const isAdmin = profile?.role === 'admin'
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
    const { addToCart } = useCart()

    // Find featured categories by name
    const featuredCategories = FEATURED_CATEGORY_NAMES
        .map(name => menu.find(cat => cat.name.toLowerCase() === name.toLowerCase()))
        .filter(Boolean) as typeof menu

    const handleProductClick = (item: MenuItem) => {
        const product: Product = {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            promotional_price: item.promotional_price,
            img: item.img,
            choices: item.choices?.map((c) => ({
                id: c.id,
                name: c.name,
                min: c.min,
                max: c.max,
                options: c.options?.map((o) => ({
                    id: o.id,
                    name: o.name,
                    price: o.price,
                    max: o.max,
                    description: o.description,
                    img: o.img
                })) || []
            })) || []
        }
        setConfiguringProduct(product)
    }

    const handleAddToCart = (cartItem: any, redirect?: boolean) => {
        addToCart(cartItem)
        setConfiguringProduct(null)
        if (redirect) {
            // Optional: Redirect to cart or checkout if needed
            // router.push('/cart')
        }
    }

    const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')


    return (
        <main className="flex min-h-screen flex-col bg-background overflow-x-hidden">
            {/* Header Section */}
            <div className="container mx-auto p-4 pt-8 md:pt-24 flex flex-col items-center sm:hidden">
                <div className="z-40 w-full max-w-5xl items-center justify-between text-sm lg:flex mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="sm:hidden fixed left-0 top-0 flex flex-col items-center w-full justify-center border-b bg-black backdrop-blur-2xl border-red-800 lg:static lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30"
                    >
                        <div className="relative w-[100px] h-[100px] mr-2">
                            <Image
                                src="/logo-light.jpeg"
                                alt="Logo"
                                fill
                                className="object-contain dark:hidden mix-blend-multiply dark:mix-blend-normal"
                            />
                            <Image
                                src="/logo-dark.jpeg"
                                alt="Logo"
                                fill
                                className="object-contain hidden dark:block mix-blend-screen"
                            />
                        </div>
                    </motion.div>
                </div>

            </div>

            {/* Full Width Banner */}
            <PromoBanner />

            {/* Categories Grid */}
            <div className="container mx-auto p-4">
                <CategoriesGrid />
            </div>

            {/* Featured Categories */}
            <div className="container mx-auto p-4 space-y-12 pb-12">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                    </div>
                ) : (
                    featuredCategories.map((category) => {
                        if (!category) return null

                        return (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white pl-2 border-l-4 border-red-600">
                                        {category.name}
                                    </h2>
                                    <Link href={`/cardapio/${slugify(category.name)}`} className="text-sm text-red-600 hover:text-red-500 font-medium flex items-center gap-1">
                                        Ver todos <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>

                                <div className="relative">
                                    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                                        {category.items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                whileHover={{ y: -5 }}
                                                className="min-w-[280px] md:min-w-[320px] snap-center"
                                            >
                                                <Card
                                                    className="h-full cursor-pointer group border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg dark:hover:shadow-fire overflow-hidden"
                                                    onClick={() => handleProductClick(item)}
                                                >
                                                    <div className="relative h-48 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                                        {item.img ? (
                                                            <Image
                                                                src={item.img}
                                                                alt={item.name}
                                                                fill
                                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-neutral-400">
                                                                <span className="text-4xl">🍔</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>
                                                    <CardHeader className="p-4">
                                                        <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-red-600 transition-colors">
                                                            {item.name}
                                                        </CardTitle>
                                                        <CardDescription className="text-neutral-500 dark:text-neutral-400 line-clamp-2 text-sm h-10">
                                                            {item.description}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            {item.promotional_price ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs text-neutral-400 line-through">
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                                    </span>
                                                                    <span>
                                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.promotional_price)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)
                                                            )}
                                                        </span>
                                                        <Button size="sm" variant="secondary" className="bg-neutral-100 dark:bg-white/10 hover:bg-red-600 hover:text-white transition-colors">
                                                            Adicionar
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Instagram Feed */}
            <InstagramFeed categories={menu} onProductSelect={handleProductClick} />

            {/* Cards Section - Only for Admins */}
            {isAdmin && (
                <div className="container mx-auto p-4 pb-24 flex flex-col items-center">
                    <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-2 lg:text-left gap-8 mt-16">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <Link href="/pdv" passHref>
                                <Card className="group border-transparent bg-neutral-900/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-fire cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl text-white">
                                            <Monitor className="h-6 w-6 text-red-500" />
                                            PDV
                                        </CardTitle>
                                        <CardDescription className="text-neutral-400">
                                            Ponto de Venda para lançamento de pedidos.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-neutral-500">
                                            Interface otimizada para garçons e caixas lançarem pedidos com rapidez e eficiência.
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="ghost" className="text-white group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                                            Acessar PDV <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <Link href="/kds" passHref>
                                <Card className="group border-transparent bg-neutral-900/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-fire cursor-pointer h-full">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-2xl text-white">
                                            <ChefHat className="h-6 w-6 text-red-500" />
                                            Cozinha (KDS)
                                        </CardTitle>
                                        <CardDescription className="text-neutral-400">
                                            Kitchen Display System para gestão de pedidos.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-neutral-500">
                                            Visualize e gerencie os pedidos em tempo real na cozinha, melhorando o fluxo de trabalho.
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="ghost" className="text-white group-hover:text-red-500 group-hover:translate-x-1 transition-all">
                                            Acessar KDS <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {configuringProduct && (
                    <ProductCustomizer
                        product={configuringProduct}
                        onClose={() => setConfiguringProduct(null)}
                        onConfirm={handleAddToCart}
                    />
                )}
            </AnimatePresence>
        </main>
    )
}
