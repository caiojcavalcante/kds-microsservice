"use server"

import { promises as fs } from 'fs'
import path from 'path'

const menuFilePath = path.join(process.cwd(), 'app', 'data', 'menu.json')

export interface MenuOption {
    id: number
    name: string
    description: string | null
    max: number
    price: number
    img: string | null
}

export interface MenuChoice {
    id: number
    name: string
    required: number
    min: number
    max: number
    use_greater_option_price: number
    options: MenuOption[]
}

export interface MenuItem {
    id: number
    idi?: number
    name: string
    description: string
    price: number
    promotional_price: number | null
    promotional_percentage: number | null
    img: string | null
    schedule_available: string
    schedule_type: number
    min_value: number
    min_value_promotional: number
    featured: any[]
    choices: MenuChoice[]
}

export interface MenuCategory {
    id: number
    name: string
    schedule_available: string
    schedule_type: number
    has_multiple_selection: any
    items: MenuItem[]
}

export async function getMenu(): Promise<MenuCategory[]> {
    try {
        const data = await fs.readFile(menuFilePath, 'utf-8')
        return JSON.parse(data)
    } catch (error) {
        console.error('Error reading menu:', error)
        return []
    }
}

export async function addCategory(name: string): Promise<{ success: boolean; category?: MenuCategory; error?: string }> {
    try {
        const menu = await getMenu()
        const newCategory: MenuCategory = {
            id: Date.now(),
            name,
            schedule_available: "1111111",
            schedule_type: 0,
            has_multiple_selection: null,
            items: []
        }
        menu.push(newCategory)
        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true, category: newCategory }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function updateCategory(categoryId: number, name: string): Promise<{ success: boolean; error?: string }> {
    try {
        const menu = await getMenu()
        const category = menu.find(c => c.id === categoryId)
        if (!category) return { success: false, error: 'Categoria não encontrada' }
        category.name = name
        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function deleteCategory(categoryId: number): Promise<{ success: boolean; error?: string }> {
    try {
        let menu = await getMenu()
        menu = menu.filter(c => c.id !== categoryId)
        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function addProduct(
    categoryId: number,
    product: Partial<MenuItem>
): Promise<{ success: boolean; product?: MenuItem; error?: string }> {
    try {
        const menu = await getMenu()
        const category = menu.find(c => c.id === categoryId)
        if (!category) return { success: false, error: 'Categoria não encontrada' }

        const newProduct: MenuItem = {
            id: Date.now(),
            name: product.name || 'Novo Produto',
            description: product.description || '',
            price: product.price || 0,
            promotional_price: product.promotional_price || null,
            promotional_percentage: product.promotional_percentage || null,
            img: product.img || null,
            schedule_available: "1111111",
            schedule_type: 0,
            min_value: product.price || 0,
            min_value_promotional: 0,
            featured: [],
            choices: []
        }

        category.items.push(newProduct)
        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true, product: newProduct }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function updateProduct(
    categoryId: number,
    productId: number,
    updates: Partial<MenuItem>
): Promise<{ success: boolean; error?: string }> {
    try {
        const menu = await getMenu()
        const category = menu.find(c => c.id === categoryId)
        if (!category) return { success: false, error: 'Categoria não encontrada' }

        const product = category.items.find(p => p.id === productId)
        if (!product) return { success: false, error: 'Produto não encontrado' }

        Object.assign(product, updates)
        if (updates.price !== undefined) product.min_value = updates.price

        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function deleteProduct(categoryId: number, productId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const menu = await getMenu()
        const category = menu.find(c => c.id === categoryId)
        if (!category) return { success: false, error: 'Categoria não encontrada' }

        category.items = category.items.filter(p => p.id !== productId)
        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function moveProduct(
    productId: number,
    fromCategoryId: number,
    toCategoryId: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const menu = await getMenu()
        const fromCategory = menu.find(c => c.id === fromCategoryId)
        const toCategory = menu.find(c => c.id === toCategoryId)

        if (!fromCategory || !toCategory) return { success: false, error: 'Categoria não encontrada' }

        const productIndex = fromCategory.items.findIndex(p => p.id === productId)
        if (productIndex === -1) return { success: false, error: 'Produto não encontrado' }

        const [product] = fromCategory.items.splice(productIndex, 1)
        toCategory.items.push(product)

        await fs.writeFile(menuFilePath, JSON.stringify(menu, null, 4), 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}
