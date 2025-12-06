"use client"

import { useState, useEffect, useTransition, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    FolderOpen,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Loader2,
    Upload,
    Link as LinkIcon,
    Image as ImageIcon
} from "lucide-react"
import {
    getCategories,
    updateCategory,
    deleteCategory,
    addCategory
} from "@/app/actions/menu"

interface CategoryItem {
    id: string
    name: string
    img: string | null
}

export function CategoryManager() {
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Edit state
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
    const [editForm, setEditForm] = useState<{ name: string; img: string }>({ name: "", img: "" })

    // Add state
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryItem | null>(null)

    // Image input mode
    const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url')
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadCategories()
    }, [])

    // Lock body scroll when modal is open
    useEffect(() => {
        const isModalOpen = !!editingCategory || !!deleteConfirm || showAddCategory
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
    }, [editingCategory, deleteConfirm, showAddCategory])

    const loadCategories = async () => {
        setLoading(true)
        const data = await getCategories()
        setCategories(data)
        setLoading(false)
    }

    // Add category handler
    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return
        startTransition(async () => {
            const result = await addCategory(newCategoryName)
            if (result.success) {
                await loadCategories()
                setNewCategoryName("")
                setShowAddCategory(false)
            }
        })
    }

    // Open edit modal
    const openEditCategory = (category: CategoryItem) => {
        setEditingCategory(category)
        setEditForm({ name: category.name, img: category.img || "" })
        setImageInputMode('url')
    }

    // Save category updates
    const handleSaveCategory = async () => {
        if (!editingCategory || !editForm.name.trim()) return
        startTransition(async () => {
            const result = await updateCategory(editingCategory.id, {
                name: editForm.name,
                img: editForm.img || null
            })
            if (result.success) {
                await loadCategories()
                setEditingCategory(null)
            }
        })
    }

    // Delete category
    const handleDeleteCategory = async () => {
        if (!deleteConfirm) return
        startTransition(async () => {
            const result = await deleteCategory(deleteConfirm.id)
            if (result.success) {
                await loadCategories()
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
                setEditForm(prev => ({ ...prev, img: e.target!.result as string }))
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Categorias</h2>
                    <p className="text-sm text-neutral-500">Gerencie as categorias e suas imagens</p>
                </div>
                <Button
                    onClick={() => setShowAddCategory(true)}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg shadow-red-500/20"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Nova Categoria
                </Button>
            </div>

            {/* Categories Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-red-500/50 transition-colors"
                    >
                        {/* Image area */}
                        <div className="relative h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                            {category.img ? (
                                <img
                                    src={category.img}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
                                </div>
                            )}
                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openEditCategory(category)}
                                    className="rounded-xl"
                                >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Editar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteConfirm(category)}
                                    className="rounded-xl"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Category name */}
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <FolderOpen className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <p className="text-xs text-neutral-500">
                                        {category.img ? "Com imagem" : "Sem imagem"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty state */}
            {categories.length === 0 && (
                <div className="text-center py-16">
                    <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma categoria</h3>
                    <p className="text-neutral-500 mb-4">Comece criando sua primeira categoria</p>
                    <Button
                        onClick={() => setShowAddCategory(true)}
                        className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Categoria
                    </Button>
                </div>
            )}

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

            {/* Edit Category Modal */}
            <AnimatePresence>
                {editingCategory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingCategory(null)}
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
                                            <h3 className="text-xl font-bold">Editar Categoria</h3>
                                            <p className="text-sm text-neutral-500">Altere o nome e a imagem</p>
                                        </div>
                                        <button
                                            onClick={() => setEditingCategory(null)}
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
                                            value={editForm.name}
                                            onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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
                                                editForm.img && "border-solid border-red-500/50"
                                            )}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                        >
                                            {editForm.img ? (
                                                <>
                                                    <img src={editForm.img} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => setEditForm(prev => ({ ...prev, img: "" }))}
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
                                                value={editForm.img}
                                                onChange={e => setEditForm(prev => ({ ...prev, img: e.target.value }))}
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
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-black/5 dark:border-white/10 flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setEditingCategory(null)}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSaveCategory}
                                        disabled={isPending || !editForm.name.trim()}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white"
                                    >
                                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <>
                                                <Save className="h-5 w-5 mr-2" />
                                                Salvar
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
                            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10">
                                <div className="text-center">
                                    <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <Trash2 className="h-8 w-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Excluir Categoria?</h3>
                                    <p className="text-neutral-500 mb-6">
                                        Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>?
                                        <br />
                                        <span className="text-red-500 text-sm">Todos os produtos desta categoria serão excluídos!</span>
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setDeleteConfirm(null)}
                                            className="flex-1 h-12 rounded-xl"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteCategory}
                                            disabled={isPending}
                                            className="flex-1 h-12 rounded-xl"
                                        >
                                            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Excluir"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
