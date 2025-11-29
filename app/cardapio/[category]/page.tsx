"use client"

import { use, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import menuData from "@/app/data/menu.json"
import { ProductCustomizer, Product } from "@/components/product-customizer"
import { useCart } from "@/contexts/cart-context"

// Helper to slugify category names (must match the one in main page)
const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = use(params)
  const { addToCart } = useCart()
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

  const category = menuData.find(c => slugify(c.name) === categorySlug)

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-red-950/20">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/cardapio">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-950/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold truncate">{category.name}</h1>
        </div>
      </div>

      {/* Hero Image (Optional - using first item image) */}
      {category.items[0]?.img && (
        <div className="relative h-48 md:h-64 w-full overflow-hidden">
           <Image 
              src={category.items[0].img} 
              alt={category.name} 
              fill 
              priority
              sizes="100vw"
              className="object-cover opacity-50 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 container mx-auto">
               <h2 className="text-3xl md:text-4xl font-bold text-foreground">{category.name}</h2>
               <p className="text-muted-foreground">{category.items.length} opções deliciosas</p>
            </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="overflow-hidden h-full hover:shadow-fire transition-all duration-300 border-red-950/30 group flex flex-col cursor-pointer"
                onClick={() => setConfiguringProduct(item as Product)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {item.img ? (
                    <Image 
                      src={item.img} 
                      alt={item.name} 
                      fill 
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-10 w-10 opacity-20" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-red-500 transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-bold text-green-500 whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {item.description}
                  </p>
                  <Button className="w-full shadow-sm group-hover:shadow-fire transition-all" variant="outline">
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Product Customizer Modal */}
      <AnimatePresence>
        {configuringProduct && (
          <ProductCustomizer 
            product={configuringProduct} 
            onClose={() => setConfiguringProduct(null)}
            onConfirm={(item) => {
              addToCart(item)
              setConfiguringProduct(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
