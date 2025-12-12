"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Star, Search, UtensilsCrossed, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CategoriesGrid } from "@/components/categories-grid"
import { Input } from "@/components/ui/input"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMenu } from "@/hooks/use-menu"
import { ProductCustomizer, Product } from "@/components/product-customizer"
import { useCart } from "@/contexts/cart-context"

// Helper to slugify category names
const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-').replace(/[^\w-]+/g, '')

const BANNERS = [
  {
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop",
    name: "Banner 1",
    link: "/cardapio/churrasco",
    title: "Sabores que Incendeiam",
    subtitle: "Experimente o melhor da parrilla."
  },
  {
    image: "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2080&auto=format&fit=crop",
    name: "Banner 2",
    link: "/cardapio/bebidas",
    title: "Refresque-se",
    subtitle: "As melhores bebidas para acompanhar."
  }
]

export default function CardapioPage() {
  const { menu, loading } = useMenu()
  const { addToCart } = useCart()
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Categories State
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Items State
  const [sortBy, setSortBy] = useState("recommended")
  const [visibleItemsCount, setVisibleItemsCount] = useState(12)

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim() || !menu.length) return []
    const query = searchQuery.toLowerCase()
    return menu.flatMap((cat) => cat.items).filter((item) =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  }, [searchQuery, menu])

  // Get all items for the "All Items" section
  const allItems = useMemo(() => {
    if (!menu.length) return []
    // Inject category name into items to allow sorting by category
    let items = menu.flatMap((cat) =>
      cat.items.map((item) => ({ ...item, categoryName: cat.name }))
    )

    // Sort
    items.sort((a, b) => {
      if (sortBy === 'recommended') {
        const priorityOrder = [
          'Cortes de carne',
          'Hambúrguer Artesanal',
          'RISOTOS',
          'Refrigerantes',
          'Cervejas'
        ]

        const idxA = priorityOrder.indexOf(a.categoryName)
        const idxB = priorityOrder.indexOf(b.categoryName)

        // If both are in the priority list, sort by index
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        // If only A is in the list, A comes first
        if (idxA !== -1) return -1
        // If only B is in the list, B comes first
        if (idxB !== -1) return 1

        // If neither is in the list, maintain original order (roughly)
        return 0
      }
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
      return 0
    })

    return items
  }, [sortBy, menu])

  const visibleItems = allItems.slice(0, visibleItemsCount)

  // Get some "offers" - for now, let's pick the first 4 items from the first category (usually burgers/main)
  const offers = menu[0]?.items.slice(0, 4) || []

  // Categories logic
  const sortedCategories = useMemo(() => {
    if (!menu.length) return []
    const priorityOrder = [
      'Cortes de carne',
      'Hambúrguer Artesanal',
      'Refrigerantes',
      'Cervejas',
      'RISOTOS',
    ]

    return [...menu].sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.name)
      const idxB = priorityOrder.indexOf(b.name)

      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return 0
    })
  }, [menu])

  const displayedCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, 4)

  return (
    <div className="min-h-screen  bg-background/80 pb-20">
      {/* Header with Logo and Search */}
      <header className="sticky top-0 sm:top-[56px] z-40 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-20 flex items-center sm:justify-center justify-between gap-4 bg-white dark:bg-black">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="sm:hidden relative h-10 w-20">
              <Image
                src="/logo-light.jpeg" // Default light mode logo
                alt="Ferro e Fogo"
                fill
                className="object-cover light-mode-logo"
                priority
              />
              <Image
                src="/logo-dark.jpeg" // Dark mode logo
                alt="Ferro e Fogo"
                fill
                className="object-cover dark-mode-logo"
                priority
              />
            </div>
          </Link>
          <Link href="/" className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="relative h-10 w-28 block sm:hidden">
              <Image
                src="/logo-light.jpeg" // Default light mode logo
                alt="Ferro e Fogo"
                fill
                className="object-contain light-mode-logo"
                priority
              />
              <Image
                src="/logo-dark.jpeg" // Dark mode logo
                alt="Ferro e Fogo"
                fill
                className="object-contain dark-mode-logo"
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

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Banner Carousel */}
        {!searchQuery && (
          <section className="space-y-6 relative">
            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 h-[220px] w-screen bg-gradient-to-tr from-red-500 to-red-800"></div>
            <Carousel className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <CarouselContent>
                {BANNERS.map((banner, index) => (
                  <CarouselItem key={index}>
                    <Link href={banner.link} className="block relative h-[180px] w-full group rounded-2xl overflow-hidden">
                      <Image
                        src={banner.image}
                        alt={banner.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-10">
                        <div className="flex flex-col space-y-2 md:space-y-3 w-full max-w-2xl">
                          <h2 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight">
                            {banner.title}
                          </h2>
                          <p className="text-white/90 text-sm md:text-xl font-medium drop-shadow-md line-clamp-2">
                            {banner.subtitle}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bottom-4" />
              <CarouselNext className="right-4 bottom-4" />
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
        {/* Categories Section */}
        {!searchQuery && (
          <CategoriesGrid />
        )}

        {/* All Items Section (Infinite Scroll) */}
        {!searchQuery && (
          <section className="space-y-6 pt-8 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-red-500" />
                Destaques & Todos os Itens
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recomendados</SelectItem>
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
