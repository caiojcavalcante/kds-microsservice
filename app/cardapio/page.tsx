"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Star, Search, UtensilsCrossed, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import menuData from "@/app/data/menu.json"
import { ProductCustomizer, Product } from "@/components/product-customizer"
import { useCart } from "@/contexts/cart-context"

// Helper to slugify category names
const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2080&auto=format&fit=crop"
]

export default function CardapioPage() {
  const { addToCart } = useCart()
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Categories State
  const [showAllCategories, setShowAllCategories] = useState(false)
  
  // Items State
  const [sortBy, setSortBy] = useState("name_asc")
  const [visibleItemsCount, setVisibleItemsCount] = useState(12)

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return (menuData as any).flatMap((cat: any) => cat.items).filter((item: any) => 
      item.name.toLowerCase().includes(query) || 
      (item.description && item.description.toLowerCase().includes(query))
    )
  }, [searchQuery])

  // Get all items for the "All Items" section
  const allItems = useMemo(() => {
    let items = (menuData as any).flatMap((cat: any) => cat.items)
    
    // Sort
    items.sort((a: any, b: any) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      return 0
    })

    return items
  }, [sortBy])

  const visibleItems = allItems.slice(0, visibleItemsCount)

  // Get some "offers" - for now, let's pick the first 4 items from the first category (usually burgers/main)
  const offers = menuData[0]?.items.slice(0, 4) || []

  // Categories logic
  const displayedCategories = showAllCategories ? menuData : menuData.slice(0, 8)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Logo and Search */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-20 flex items-center sm:justify-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="sm:hidden relative h-10 w-20">
              <Image 
                src="/logo.jpeg" 
                alt="Ferro e Fogo" 
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          <div className="flex-1 max-w-md relative sm:max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar itens..." 
              className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-10">
        
        {/* Banner Carousel */}
        {!searchQuery && (
          <section>
            <Carousel className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <CarouselContent>
                {BANNER_IMAGES.map((src, index) => (
                  <CarouselItem key={index}>
                    <div className="relative aspect-[628/160] w-full">
                      <Image 
                        src={src} 
                        alt={`Banner ${index + 1}`} 
                        fill 
                        className="object-cover"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 md:p-8">
                        <div className="space-y-1 md:space-y-2">
                          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Sabores que Incendeiam</h2>
                          <p className="text-white/90 text-sm md:text-lg max-w-xl">
                            Experimente o melhor da parrilla.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </section>
        )}

        {/* Search Results */}
        {searchQuery && (
          <section className="space-y-4">
             <h2 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-5 w-5" />
              Resultados para "{searchQuery}"
            </h2>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredItems.map((item: any) => (
                  <Card 
                    key={item.id}
                    className="overflow-hidden h-full hover:shadow-fire transition-all duration-300 border-muted group cursor-pointer"
                    onClick={() => setConfiguringProduct(item as Product)}
                  >
                    <div className="relative aspect-[32/9] overflow-hidden">
                      {item.img ? (
                        <Image 
                          src={item.img} 
                          alt={item.name} 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                          Sem Imagem
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-red-500 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {item.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-green-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                        <Button size="sm" variant="outline" className="group-hover:bg-red-500 group-hover:text-white transition-colors">
                          Pedir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum item encontrado.
              </div>
            )}
          </section>
        )}

        {/* Categories Section */}
        {!searchQuery && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Categorias
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedCategories.map((category, idx) => {
                const categoryImage = category.items.find(i => i.img)?.img || null
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
                      className="relative aspect-square rounded-xl overflow-hidden shadow-md border border-muted"
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
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground">Sem Imagem</span>
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
            
            {menuData.length > 8 && (
              <div className="flex justify-center pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="gap-2"
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
        )}

        {/* All Items Section (Infinite Scroll) */}
        {!searchQuery && (
          <section className="space-y-6 pt-8 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-red-500" />
                Todos os Itens
              </h2>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                    <SelectItem value="price_asc">Preço (Menor)</SelectItem>
                    <SelectItem value="price_desc">Preço (Maior)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {visibleItems.map((item: any, idx: number) => (
                <motion.div
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 }}
                >
                  <Card 
                    className="overflow-hidden h-full hover:shadow-fire transition-all duration-300 border-muted group cursor-pointer"
                    onClick={() => setConfiguringProduct(item as Product)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {item.img ? (
                        <Image 
                          src={item.img} 
                          alt={item.name} 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                          Sem Imagem
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-red-500 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {item.description}
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xl font-bold text-green-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                        </span>
                        <Button size="sm" variant="outline" className="group-hover:bg-red-500 group-hover:text-white transition-colors">
                          Pedir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {visibleItemsCount < allItems.length && (
              <div className="flex justify-center pt-8">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setVisibleItemsCount(prev => prev + 12)}
                  className="min-w-[200px]"
                >
                  Carregar mais itens
                </Button>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Product Customizer Modal */}
      <AnimatePresence>
        {configuringProduct && (
          <ProductCustomizer 
            product={configuringProduct} 
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
    </div>
  )
}
