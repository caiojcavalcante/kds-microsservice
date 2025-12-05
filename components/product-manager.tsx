"use client"

import { useState, useEffect, useTransition, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Package,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Search,
    FolderOpen,
    Image as ImageIcon,
    Tag,
    ChevronDown,
    ChevronRight,
    Loader2,
    Sparkles,
    Upload,
    Link as LinkIcon,
    AlertTriangle
} from "lucide-react"
import {
    getMenu,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    type MenuCategory,
    type MenuItem
} from "@/app/actions/menu"

export function ProductManager() {
    const [menu, setMenu] = useState<MenuCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState("")
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

    // Edit states
    const [editingCategory, setEditingCategory] = useState<number | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [showAddCategory, setShowAddCategory] = useState(false)

    // Product modal state
    const [productModal, setProductModal] = useState<{
        mode: 'add' | 'edit'
        categoryId: number
        product?: MenuItem
    } | null>(null)

    // Product form state
    const [productForm, setProductForm] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        price: 0,
        promotional_price: null,
        img: ""
    })

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'category' | 'product'
        categoryId: number
        productId?: number
        name: string
    } | null>(null)

    // Image input mode: 'url' | 'file'
    const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadMenu()
    }, [])

    const loadMenu = async () => {
        setLoading(true)
        const data = await getMenu()
        setMenu(data)
        setLoading(false)
    }

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(categoryId)) next.delete(categoryId)
            else next.add(categoryId)
            return next
        })
    }

    // Category handlers
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        startTransition(async () => {
            const result = await addCategory(newCategoryName)
            if (result.success) {
                await loadMenu()
                setNewCategoryName("")
                setShowAddCategory(false)
            }
        })
    }

    const handleUpdateCategory = async (categoryId: number, name: string) => {
        startTransition(async () => {
            const result = await updateCategory(categoryId, name)
            if (result.success) {
                await loadMenu()
                setEditingCategory(null)
            }
        })
    }

    const handleDeleteCategory = async () => {
        if (!deleteConfirm || deleteConfirm.type !== 'category') return
        startTransition(async () => {
            const result = await deleteCategory(deleteConfirm.categoryId)
            if (result.success) {
                await loadMenu()
                setDeleteConfirm(null)
            }
        })
    }

    // Product handlers
    const openAddProduct = (categoryId: number) => {
        setProductForm({ name: "", description: "", price: 0, promotional_price: null, img: "" })
        setProductModal({ mode: 'add', categoryId })
        setImageInputMode('url')
    }

    const openEditProduct = (categoryId: number, product: MenuItem) => {
        setProductForm({
            name: product.name,
            description: product.description,
            price: product.price,
            promotional_price: product.promotional_price,
            img: product.img
        })
        setProductModal({ mode: 'edit', categoryId, product })
        setImageInputMode('url')
    }

    const handleSaveProduct = async () => {
        if (!productModal || !productForm.name?.trim()) return
        startTransition(async () => {
            if (productModal.mode === 'add') {
                const result = await addProduct(productModal.categoryId, productForm)
                if (result.success) {
                    await loadMenu()
                    setProductModal(null)
                    setExpandedCategories(prev => new Set(prev).add(productModal.categoryId))
                }
            } else if (productModal.product) {
                const result = await updateProduct(productModal.categoryId, productModal.product.id, productForm)
                if (result.success) {
                    await loadMenu()
                    setProductModal(null)
                }
            }
        })
    }

    const handleDeleteProduct = async () => {
        if (!deleteConfirm || deleteConfirm.type !== 'product' || !deleteConfirm.productId) return
        startTransition(async () => {
            const result = await deleteProduct(deleteConfirm.categoryId, deleteConfirm.productId!)
            if (result.success) {
                await loadMenu()
                setDeleteConfirm(null)
            }
        })
    }

    // Image handling
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result) {
                setProductForm(p => ({ ...p, img: e.target!.result as string }))
            }
        }
        reader.readAsDataURL(file)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }, [handleFileSelect])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    // Filter products
    const filteredMenu = menu.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(category =>
        search === "" || category.items.length > 0 || category.name.toLowerCase().includes(search.toLowerCase())
    )

    const totalProducts = menu.reduce((acc, cat) => acc + cat.items.length, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent border border-red-500/20 p-6">
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Categorias</p>
                            <p className="text-3xl font-bold text-red-600">{menu.length}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20 p-6">
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Produtos</p>
                            <p className="text-3xl font-bold text-blue-600">{totalProducts}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Package className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-500/20 p-6">
                    <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Com Promoção</p>
                            <p className="text-3xl font-bold text-emerald-600">
                                {menu.reduce((acc, cat) => acc + cat.items.filter(i => i.promotional_price).length, 0)}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Tag className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Add */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <Input
                        placeholder="Buscar produtos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-12 h-12 rounded-xl"
                    />
                </div>
                <Button
                    onClick={() => setShowAddCategory(true)}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg shadow-red-500/20"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            {/* Add Category Modal */}
            <AnimatePresence>
                {showAddCategory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddCategory(false)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                        <FolderOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Nova Categoria</h3>
                                        <p className="text-sm text-neutral-500">Adicione uma categoria ao cardápio</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome da Categoria</Label>
                                        <Input
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            placeholder="Ex: Bebidas, Sobremesas..."
                                            className="h-12 rounded-xl"
                                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1 h-12 rounded-xl">
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleAddCategory}
                                            disabled={isPending || !newCategoryName.trim()}
                                            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white"
                                        >
                                            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Criar Categoria"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {productModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setProductModal(null)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                        >
                            <div
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-2xl my-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <Sparkles className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {productModal.mode === 'add' ? 'Novo Produto' : 'Editar Produto'}
                                            </h3>
                                            <p className="text-sm text-neutral-500">
                                                {productModal.mode === 'add' ? 'Adicione um novo produto ao cardápio' : 'Altere as informações do produto'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setProductModal(null)}
                                            className="ml-auto p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6">
                                    {/* Image Section */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Imagem do Produto</Label>

                                        {/* Image Preview */}
                                        <div
                                            className={cn(
                                                "relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden",
                                                isDragging
                                                    ? "border-emerald-500 bg-emerald-500/10"
                                                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50",
                                                productForm.img && "border-solid border-emerald-500/50"
                                            )}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                        >
                                            {productForm.img ? (
                                                <>
                                                    <img
                                                        src={productForm.img}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => setProductForm(p => ({ ...p, img: "" }))}
                                                            className="rounded-xl"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remover
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                                                    <Upload className="h-10 w-10 mb-3" />
                                                    <p className="text-sm font-medium">Arraste uma imagem aqui</p>
                                                    <p className="text-xs">ou use as opções abaixo</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Image Input Toggle */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setImageInputMode('url')}
                                                className={cn(
                                                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all",
                                                    imageInputMode === 'url'
                                                        ? "bg-emerald-500 text-white"
                                                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                                                )}
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                URL
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Arquivo
                                            </button>
                                        </div>

                                        {/* URL Input */}
                                        {imageInputMode === 'url' && (
                                            <Input
                                                value={productForm.img || ""}
                                                onChange={e => setProductForm(p => ({ ...p, img: e.target.value }))}
                                                placeholder="https://exemplo.com/imagem.jpg"
                                                className="h-12 rounded-xl"
                                            />
                                        )}

                                        {/* Hidden File Input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                if (file) handleFileSelect(file)
                                            }}
                                        />
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-sm font-medium">Nome do Produto</Label>
                                            <Input
                                                value={productForm.name || ""}
                                                onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                                                placeholder="Ex: Hambúrguer Artesanal"
                                                className="h-12 rounded-xl"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Preço (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={productForm.price || ""}
                                                onChange={e => setProductForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                                placeholder="0,00"
                                                className="h-12 rounded-xl text-lg font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Preço Promocional (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={productForm.promotional_price || ""}
                                                onChange={e => setProductForm(p => ({ ...p, promotional_price: parseFloat(e.target.value) || null }))}
                                                placeholder="Opcional"
                                                className="h-12 rounded-xl"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label className="text-sm font-medium">Descrição</Label>
                                            <Textarea
                                                value={productForm.description || ""}
                                                onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))}
                                                placeholder="Descreva os ingredientes e detalhes do produto..."
                                                className="min-h-[100px] rounded-xl resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 bg-neutral-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setProductModal(null)}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSaveProduct}
                                        disabled={isPending || !productForm.name?.trim()}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white shadow-lg shadow-emerald-500/20"
                                    >
                                        {isPending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5 mr-2" />
                                                {productModal.mode === 'add' ? 'Criar Produto' : 'Salvar Alterações'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteConfirm(null)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                                        <AlertTriangle className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-red-600">Confirmar Exclusão</h3>
                                        <p className="text-sm text-neutral-500">Esta ação não pode ser desfeita</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                                    <p className="text-sm">
                                        Você está prestes a excluir {deleteConfirm.type === 'category' ? 'a categoria' : 'o produto'}{' '}
                                        <span className="font-bold">&quot;{deleteConfirm.name}&quot;</span>
                                        {deleteConfirm.type === 'category' && ' e todos os seus produtos'}.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={deleteConfirm.type === 'category' ? handleDeleteCategory : handleDeleteProduct}
                                        disabled={isPending}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white"
                                    >
                                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <>
                                                <Trash2 className="h-5 w-5 mr-2" />
                                                Excluir
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Categories List */}
            <div className="space-y-4">
                {filteredMenu.map(category => (
                    <div
                        key={category.id}
                        className="rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-black/5 dark:border-white/10 overflow-hidden"
                    >
                        {/* Category Header */}
                        <div
                            className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <button className="p-1">
                                {expandedCategories.has(category.id) ? (
                                    <ChevronDown className="h-5 w-5 text-neutral-400" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                                )}
                            </button>

                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                                <FolderOpen className="h-5 w-5 text-red-600" />
                            </div>

                            {editingCategory === category.id ? (
                                <Input
                                    autoFocus
                                    defaultValue={category.name}
                                    onClick={e => e.stopPropagation()}
                                    onBlur={e => handleUpdateCategory(category.id, e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") handleUpdateCategory(category.id, e.currentTarget.value)
                                        if (e.key === "Escape") setEditingCategory(null)
                                    }}
                                    className="h-8 max-w-xs"
                                />
                            ) : (
                                <span className="font-bold text-lg flex-1">{category.name}</span>
                            )}

                            <Badge variant="secondary" className="ml-auto">
                                {category.items.length} produtos
                            </Badge>

                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category.id)} className="h-8 w-8 rounded-lg">
                                    <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openAddProduct(category.id)} className="h-8 w-8 rounded-lg text-emerald-600">
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteConfirm({ type: 'category', categoryId: category.id, name: category.name })}
                                    className="h-8 w-8 rounded-lg text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Products */}
                        <AnimatePresence>
                            {expandedCategories.has(category.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0 space-y-3">
                                        {category.items.map(product => (
                                            <div
                                                key={product.id}
                                                className="p-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Product Image */}
                                                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex-shrink-0">
                                                        {product.img ? (
                                                            <img src={product.img} alt={product.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                                                                <ImageIcon className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium truncate">{product.name}</span>
                                                            {product.promotional_price && (
                                                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 text-xs">
                                                                    Promoção
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-neutral-500 truncate">{product.description}</p>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right">
                                                        {product.promotional_price ? (
                                                            <>
                                                                <span className="text-sm text-neutral-400 line-through">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                                                </span>
                                                                <span className="block text-lg font-bold text-emerald-600">
                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.promotional_price)}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-bold text-neutral-900 dark:text-white">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditProduct(category.id, product)} className="h-8 w-8 rounded-lg">
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setDeleteConfirm({ type: 'product', categoryId: category.id, productId: product.id, name: product.name })}
                                                            className="h-8 w-8 rounded-lg text-red-500"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {category.items.length === 0 && (
                                            <div className="text-center py-8 text-neutral-500">
                                                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-sm">Nenhum produto nesta categoria.</p>
                                                <Button variant="link" onClick={() => openAddProduct(category.id)} className="mt-2 text-red-600">
                                                    Adicionar primeiro produto
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {filteredMenu.length === 0 && (
                    <div className="text-center py-16 text-neutral-500">
                        <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
                        <p className="text-sm">Crie uma categoria para começar a adicionar produtos.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
