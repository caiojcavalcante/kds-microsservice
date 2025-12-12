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
    AlertTriangle,
    Layers,
    GripVertical,
    Settings2,
    ToggleLeft,
    ToggleRight
} from "lucide-react"
import {
    getMenu,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductChoices,
    addChoiceGroup,
    updateChoiceGroup,
    deleteChoiceGroup,
    addChoiceOption,
    updateChoiceOption,
    deleteChoiceOption,
    type MenuCategory,
    type MenuItem,
    type MenuChoice,
    type MenuOption
} from "@/app/actions/menu"
import { Switch } from "@/components/ui/switch"
import { uploadImageToStorage } from "@/lib/image-utils"

export function ProductManager() {
    const [menu, setMenu] = useState<MenuCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [search, setSearch] = useState("")
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    // Edit states
    const [editingCategory, setEditingCategory] = useState<string | null>(null)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [showAddCategory, setShowAddCategory] = useState(false)

    // Category modal state (for add/edit with image)
    const [categoryModal, setCategoryModal] = useState<{
        mode: 'add' | 'edit'
        category?: MenuCategory
    } | null>(null)
    const [categoryForm, setCategoryForm] = useState<{ name: string; img: string }>({
        name: "",
        img: ""
    })

    // Product modal state
    const [productModal, setProductModal] = useState<{
        mode: 'add' | 'edit'
        categoryId: string
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
        categoryId: string
        productId?: string
        name: string
    } | null>(null)

    // Image input mode: 'url' | 'file'
    const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Choices management state
    const [choices, setChoices] = useState<MenuChoice[]>([])
    const [loadingChoices, setLoadingChoices] = useState(false)
    const [expandedChoices, setExpandedChoices] = useState<Set<string>>(new Set())
    const [editingGroup, setEditingGroup] = useState<string | null>(null)
    const [editingOption, setEditingOption] = useState<string | null>(null)
    const [newGroupName, setNewGroupName] = useState("")
    const [newOptionData, setNewOptionData] = useState<{ groupId: string; name: string; price: number }>({ groupId: "", name: "", price: 0 })
    const [showAddGroup, setShowAddGroup] = useState(false)
    const [showAddOption, setShowAddOption] = useState<string | null>(null) // groupId or null
    const [activeTab, setActiveTab] = useState<'info' | 'choices'>('info')

    useEffect(() => {
        loadMenu()
    }, [])

    // Lock body scroll when any modal is open
    useEffect(() => {
        const isModalOpen = !!productModal || !!deleteConfirm || showAddCategory || !!categoryModal
        if (isModalOpen) {
            document.body.style.overflow = 'hidden'
            document.documentElement.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
            document.documentElement.style.overflow = ''
        }
    }, [productModal, deleteConfirm, showAddCategory, categoryModal])

    const loadMenu = async () => {
        setLoading(true)
        const data = await getMenu()
        setMenu(data)
        setLoading(false)
    }

    const toggleCategory = (categoryId: string) => {
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

    const handleUpdateCategory = async (categoryId: string, name: string) => {
        startTransition(async () => {
            const result = await updateCategory(categoryId, { name })
            if (result.success) {
                await loadMenu()
                setEditingCategory(null)
            }
        })
    }

    // Open category modal for adding
    const openAddCategory = () => {
        setCategoryForm({ name: "", img: "" })
        setCategoryModal({ mode: 'add' })
    }

    // Open category edit modal
    const openEditCategory = (category: MenuCategory) => {
        setCategoryForm({ name: category.name, img: category.img || "" })
        setCategoryModal({ mode: 'edit', category })
    }

    // Save category with image (add or edit)
    const handleSaveCategoryModal = async () => {
        if (!categoryModal || !categoryForm.name.trim()) return
        startTransition(async () => {
            if (categoryModal.mode === 'add') {
                // Add new category
                const result = await addCategory(categoryForm.name)
                if (result.success && result.category) {
                    // Now update it with the image if provided
                    if (categoryForm.img) {
                        await updateCategory(result.category.id, { img: categoryForm.img })
                    }
                    await loadMenu()
                    setCategoryModal(null)
                }
            } else if (categoryModal.category) {
                // Edit existing category
                const result = await updateCategory(categoryModal.category.id, {
                    name: categoryForm.name,
                    img: categoryForm.img || null
                })
                if (result.success) {
                    await loadMenu()
                    setCategoryModal(null)
                }
            }
        })
    }

    // Handle category image file select
    const handleCategoryFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return
        try {
            const imageUrl = await uploadImageToStorage(file, 'images', 'categories')
            setCategoryForm(prev => ({ ...prev, img: imageUrl }))
        } catch (error) {
            console.error('Failed to upload image:', error)
        }
    }, [])

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
    const openAddProduct = (categoryId: string) => {
        setProductForm({ name: "", description: "", price: 0, promotional_price: null, img: "" })
        setProductModal({ mode: 'add', categoryId })
        setImageInputMode('url')
        setChoices([])
        setActiveTab('info')
        setShowAddGroup(false)
        setShowAddOption(null)
    }

    const openEditProduct = async (categoryId: string, product: MenuItem) => {
        setProductForm({
            name: product.name,
            description: product.description,
            price: product.price,
            promotional_price: product.promotional_price,
            img: product.img
        })
        setProductModal({ mode: 'edit', categoryId, product })
        setImageInputMode('url')
        setActiveTab('info')
        setShowAddGroup(false)
        setShowAddOption(null)

        // Load choices for existing product
        setLoadingChoices(true)
        const productChoices = await getProductChoices(product.id)
        setChoices(productChoices)
        setLoadingChoices(false)
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

    // Choice Group handlers
    const handleAddChoiceGroup = async () => {
        if (!productModal?.product || !newGroupName.trim()) return
        startTransition(async () => {
            const result = await addChoiceGroup(productModal.product!.id, {
                name: newGroupName,
                required: false,
                min: 0,
                max: 1
            })
            if (result.success && result.choiceGroup) {
                setChoices(prev => [...prev, result.choiceGroup!])
                setNewGroupName("")
                setShowAddGroup(false)
                setExpandedChoices(prev => new Set(prev).add(result.choiceGroup!.id))
            }
        })
    }

    const handleUpdateChoiceGroup = async (groupId: string, updates: { name?: string; required?: boolean; min?: number; max?: number }) => {
        startTransition(async () => {
            const result = await updateChoiceGroup(groupId, updates)
            if (result.success) {
                setChoices(prev => prev.map(g =>
                    g.id === groupId ? { ...g, ...updates } : g
                ))
                setEditingGroup(null)
            }
        })
    }

    const handleDeleteChoiceGroup = async (groupId: string) => {
        startTransition(async () => {
            const result = await deleteChoiceGroup(groupId)
            if (result.success) {
                setChoices(prev => prev.filter(g => g.id !== groupId))
            }
        })
    }

    // Choice Option handlers
    const handleAddChoiceOption = async (groupId: string) => {
        if (!newOptionData.name.trim()) return
        startTransition(async () => {
            const result = await addChoiceOption(groupId, {
                name: newOptionData.name,
                price: newOptionData.price,
                max: 1
            })
            if (result.success && result.option) {
                setChoices(prev => prev.map(g =>
                    g.id === groupId
                        ? { ...g, options: [...g.options, result.option!] }
                        : g
                ))
                setNewOptionData({ groupId: "", name: "", price: 0 })
                setShowAddOption(null)
            }
        })
    }

    const handleUpdateChoiceOption = async (groupId: string, optionId: string, updates: { name?: string; price?: number }) => {
        startTransition(async () => {
            const result = await updateChoiceOption(optionId, updates)
            if (result.success) {
                setChoices(prev => prev.map(g =>
                    g.id === groupId
                        ? { ...g, options: g.options.map(o => o.id === optionId ? { ...o, ...updates } : o) }
                        : g
                ))
                setEditingOption(null)
            }
        })
    }

    const handleDeleteChoiceOption = async (groupId: string, optionId: string) => {
        startTransition(async () => {
            const result = await deleteChoiceOption(optionId)
            if (result.success) {
                setChoices(prev => prev.map(g =>
                    g.id === groupId
                        ? { ...g, options: g.options.filter(o => o.id !== optionId) }
                        : g
                ))
            }
        })
    }

    const toggleChoiceExpanded = (groupId: string) => {
        setExpandedChoices(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    // Image handling
    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return
        try {
            const imageUrl = await uploadImageToStorage(file, 'images', 'products')
            setProductForm(p => ({ ...p, img: imageUrl }))
        } catch (error) {
            console.error('Failed to upload image:', error)
        }
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
                    onClick={openAddCategory}
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

            {/* Category Edit Modal */}
            <AnimatePresence>
                {categoryModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCategoryModal(null)}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-black/5 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                                            <FolderOpen className="h-7 w-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">
                                                {categoryModal.mode === 'add' ? 'Nova Categoria' : 'Editar Categoria'}
                                            </h3>
                                            <p className="text-sm text-neutral-500">
                                                {categoryModal.mode === 'add'
                                                    ? 'Adicione uma nova categoria ao cardápio'
                                                    : 'Altere o nome e a imagem da categoria'
                                                }
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setCategoryModal(null)}
                                            className="ml-auto p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Nome da Categoria</Label>
                                        <Input
                                            value={categoryForm.name}
                                            onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Nome da categoria"
                                            className="h-12 rounded-xl"
                                        />
                                    </div>

                                    {/* Image */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Imagem da Categoria</Label>
                                        <p className="text-xs text-neutral-500">
                                            Imagem com todos os itens e preços da categoria (será enviada no WhatsApp)
                                        </p>
                                        <div
                                            className={cn(
                                                "relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden",
                                                isDragging
                                                    ? "border-red-500 bg-red-500/10"
                                                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50",
                                                categoryForm.img && "border-solid border-red-500/50"
                                            )}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                setIsDragging(false)
                                                const file = e.dataTransfer.files[0]
                                                if (file) handleCategoryFileSelect(file)
                                            }}
                                            onDragOver={(e) => {
                                                e.preventDefault()
                                                setIsDragging(true)
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault()
                                                setIsDragging(false)
                                            }}
                                        >
                                            {categoryForm.img ? (
                                                <>
                                                    <img src={categoryForm.img} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => setCategoryForm(prev => ({ ...prev, img: "" }))}
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

                                        {/* Image input options */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setImageInputMode('url')}
                                                className={cn(
                                                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                    imageInputMode === 'url'
                                                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                                )}
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                URL
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Upload
                                            </button>
                                        </div>

                                        {imageInputMode === 'url' && (
                                            <Input
                                                value={categoryForm.img}
                                                onChange={e => setCategoryForm(prev => ({ ...prev, img: e.target.value }))}
                                                placeholder="https://exemplo.com/imagem.jpg"
                                                className="h-12 rounded-xl"
                                            />
                                        )}

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                if (file) handleCategoryFileSelect(file)
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-black/5 dark:border-white/10 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCategoryModal(null)}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSaveCategoryModal}
                                        disabled={isPending || !categoryForm.name.trim()}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white"
                                    >
                                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <>
                                                <Save className="h-5 w-5 mr-2" />
                                                {categoryModal.mode === 'add' ? 'Criar Categoria' : 'Salvar'}
                                            </>
                                        )}
                                    </Button>
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
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm m-0"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto h-screen p-4"
                            onWheel={e => e.stopPropagation()}
                        >
                            <div
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-3xl my-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto overscroll-contain"
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

                                {/* Tab Navigation */}
                                <div className="px-6 pt-4 border-b border-black/5 dark:border-white/10">
                                    <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
                                        <button
                                            onClick={() => setActiveTab('info')}
                                            className={cn(
                                                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                activeTab === 'info'
                                                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                            )}
                                        >
                                            <Package className="h-4 w-4" />
                                            Informações
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('choices')}
                                            disabled={productModal.mode === 'add'}
                                            className={cn(
                                                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                activeTab === 'choices'
                                                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
                                                productModal.mode === 'add' && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <Layers className="h-4 w-4" />
                                            Opções
                                            {choices.length > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                                                    {choices.length}
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    {productModal.mode === 'add' && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Salve o produto primeiro para adicionar opções
                                        </p>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6 min-h-[300px]">
                                    {activeTab === 'info' ? (
                                        <div className="space-y-6">
                                            {/* Image Section */}
                                            <div className="space-y-3">
                                                <Label className="text-sm font-medium">Imagem do Produto</Label>
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
                                                            <img src={productForm.img} alt="Preview" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Button variant="secondary" onClick={() => setProductForm(p => ({ ...p, img: "" }))} className="rounded-xl">
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
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setImageInputMode('url')}
                                                        className={cn(
                                                            "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                            imageInputMode === 'url'
                                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                                        )}
                                                    >
                                                        <LinkIcon className="h-4 w-4" />
                                                        URL
                                                    </button>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 py-2 px-3 rounded-xl text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                                    >
                                                        <Upload className="h-4 w-4" />
                                                        Upload
                                                    </button>
                                                </div>
                                                {imageInputMode === 'url' && (
                                                    <Input
                                                        value={productForm.img || ""}
                                                        onChange={e => setProductForm(p => ({ ...p, img: e.target.value }))}
                                                        placeholder="https://exemplo.com/imagem.jpg"
                                                        className="h-12 rounded-xl"
                                                    />
                                                )}
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
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Choices Header */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-lg">Grupos de Opções</h4>
                                                    <p className="text-sm text-neutral-500">Configure as personalizações disponíveis</p>
                                                </div>
                                                <Button
                                                    onClick={() => setShowAddGroup(true)}
                                                    size="sm"
                                                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-500/20"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Novo Grupo
                                                </Button>
                                            </div>

                                            {/* Loading */}
                                            {loadingChoices && (
                                                <div className="flex items-center justify-center py-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-red-500" />
                                                </div>
                                            )}

                                            {/* Add Group Form */}
                                            {showAddGroup && (
                                                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20 border border-red-200 dark:border-red-800">
                                                    <Label className="text-sm font-medium mb-2 block">Nome do Grupo</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={newGroupName}
                                                            onChange={e => setNewGroupName(e.target.value)}
                                                            placeholder="Ex: Ponto da Carne, Adicionais..."
                                                            className="flex-1 rounded-xl"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && handleAddChoiceGroup()}
                                                        />
                                                        <Button
                                                            onClick={handleAddChoiceGroup}
                                                            disabled={isPending || !newGroupName.trim()}
                                                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => { setShowAddGroup(false); setNewGroupName("") }}
                                                            className="rounded-xl"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Empty State */}
                                            {!loadingChoices && choices.length === 0 && !showAddGroup && (
                                                <div className="py-12 text-center">
                                                    <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                        <Layers className="h-8 w-8 text-red-500" />
                                                    </div>
                                                    <h4 className="font-semibold text-lg mb-1">Nenhum grupo de opções</h4>
                                                    <p className="text-sm text-neutral-500 mb-4">Adicione grupos para permitir personalizações</p>
                                                    <Button
                                                        onClick={() => setShowAddGroup(true)}
                                                        variant="outline"
                                                        className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Criar primeiro grupo
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Choice Groups List */}
                                            <div className="space-y-3">
                                                {choices.map((group) => (
                                                    <div
                                                        key={group.id}
                                                        className={cn(
                                                            "rounded-2xl border transition-all",
                                                            expandedChoices.has(group.id)
                                                                ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10"
                                                                : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50"
                                                        )}
                                                    >
                                                        {/* Group Header */}
                                                        <div
                                                            onClick={() => toggleChoiceExpanded(group.id)}
                                                            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-2xl transition-colors"
                                                        >
                                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                                                                <Layers className="h-5 w-5 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-semibold truncate">{group.name}</h5>
                                                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                                    <span>{group.options.length} opções</span>
                                                                    {group.required && (
                                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                                            Obrigatório
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    onClick={() => handleDeleteChoiceGroup(group.id)}
                                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </button>
                                                            </div>
                                                            <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform", expandedChoices.has(group.id) && "rotate-180")} />
                                                        </div>

                                                        {/* Group Expanded Content */}
                                                        {expandedChoices.has(group.id) && (
                                                            <div className="px-4 pb-4 space-y-4">
                                                                {/* Group Settings */}
                                                                <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={group.required}
                                                                            onCheckedChange={checked => handleUpdateChoiceGroup(group.id, { required: checked })}
                                                                        />
                                                                        <span className="text-sm">Obrigatório</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-sm">Min:</Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            value={group.min}
                                                                            onChange={e => handleUpdateChoiceGroup(group.id, { min: parseInt(e.target.value) || 0 })}
                                                                            className="w-16 h-8 text-center rounded-lg"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-sm">Max:</Label>
                                                                        <Input
                                                                            type="number"
                                                                            min={1}
                                                                            value={group.max}
                                                                            onChange={e => handleUpdateChoiceGroup(group.id, { max: parseInt(e.target.value) || 1 })}
                                                                            className="w-16 h-8 text-center rounded-lg"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Options List */}
                                                                <div className="space-y-2">
                                                                    {group.options.map((option) => (
                                                                        <div
                                                                            key={option.id}
                                                                            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 group/option"
                                                                        >
                                                                            <GripVertical className="h-4 w-4 text-neutral-300" />
                                                                            <span className="flex-1 text-sm font-medium">{option.name}</span>
                                                                            <span className={cn(
                                                                                "text-sm font-bold",
                                                                                option.price > 0 ? "text-emerald-600" : "text-neutral-400"
                                                                            )}>
                                                                                {option.price > 0 ? `+R$ ${option.price.toFixed(2)}` : 'Grátis'}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleDeleteChoiceOption(group.id, option.id)}
                                                                                className="p-1.5 opacity-0 group-hover/option:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                                            </button>
                                                                        </div>
                                                                    ))}

                                                                    {/* Add Option */}
                                                                    {showAddOption === group.id ? (
                                                                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                                                            <Input
                                                                                value={newOptionData.name}
                                                                                onChange={e => setNewOptionData(p => ({ ...p, name: e.target.value }))}
                                                                                placeholder="Nome da opção"
                                                                                className="flex-1 h-8 rounded-lg"
                                                                                autoFocus
                                                                            />
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={newOptionData.price || ""}
                                                                                onChange={e => setNewOptionData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                                                                placeholder="R$ 0,00"
                                                                                className="w-24 h-8 rounded-lg"
                                                                            />
                                                                            <Button
                                                                                onClick={() => handleAddChoiceOption(group.id)}
                                                                                disabled={isPending || !newOptionData.name.trim()}
                                                                                size="sm"
                                                                                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                                                            >
                                                                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => { setShowAddOption(null); setNewOptionData({ groupId: "", name: "", price: 0 }) }}
                                                                                className="h-8 rounded-lg"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setShowAddOption(group.id)}
                                                                            className="w-full p-3 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                            Adicionar opção
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
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
                            className="p-4 flex flex-wrap items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            onClick={() => toggleCategory(category.id)}
                        >
                            <button className="p-1">
                                {expandedCategories.has(category.id) ? (
                                    <ChevronDown className="h-5 w-5 text-neutral-400" />
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                                )}
                            </button>

                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center overflow-hidden">
                                {category.img ? (
                                    <img src={category.img} alt={category.name} className="h-full w-full object-cover" />
                                ) : (
                                    <FolderOpen className="h-5 w-5 text-red-600" />
                                )}
                            </div>

                            <span className="font-bold text-lg flex-1">{category.name}</span>

                            <Badge variant="secondary" className="ml-auto">
                                {category.items.length} produtos
                            </Badge>

                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => openEditCategory(category)} className="h-8 px-3 rounded-lg text-xs">
                                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => openAddProduct(category.id)} className="h-8 px-3 rounded-lg text-xs text-emerald-600">
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add Produto
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({ type: 'category', categoryId: category.id, name: category.name })}
                                    className="h-8 px-3 rounded-lg text-xs text-red-500"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    Excluir
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
