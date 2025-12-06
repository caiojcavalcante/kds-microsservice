"use server"

import { createClient } from "@/utils/supabase/server"

// ============================================
// Types
// ============================================

export interface ChoiceOption {
    id: string
    choice_group_id: string
    name: string
    description: string | null
    price: number
    img: string | null
    max_quantity: number
    sort_order: number
}

export interface ChoiceGroup {
    id: string
    product_id: string
    name: string
    required: boolean
    min_selections: number
    max_selections: number
    use_greater_option_price: boolean
    sort_order: number
    options: ChoiceOption[]
}

export interface Product {
    id: string
    category_id: string
    name: string
    description: string | null
    price: number
    promotional_price: number | null
    img: string | null
    sort_order: number
    schedule_available: string
    schedule_type: number
    created_at: string
    updated_at: string
    choice_groups?: ChoiceGroup[]
}

export interface Category {
    id: string
    name: string
    img: string | null
    sort_order: number
    schedule_available: string
    schedule_type: number
    created_at: string
    updated_at: string
    products?: Product[]
}

// Legacy interface for backward compatibility with existing components
export interface MenuCategory {
    id: string
    name: string
    img: string | null
    schedule_available: string
    schedule_type: number
    items: MenuItem[]
}

export interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    promotional_price: number | null
    img: string | null
    choices: MenuChoice[]
}

export interface MenuChoice {
    id: string
    name: string
    required: boolean
    min: number
    max: number
    options: MenuOption[]
}

export interface MenuOption {
    id: string
    name: string
    description: string | null
    price: number
    img: string | null
    max: number
}

// ============================================
// Helper: Transform Supabase data to legacy format
// ============================================

function transformToLegacyFormat(categories: Category[]): MenuCategory[] {
    return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        img: cat.img,
        schedule_available: cat.schedule_available,
        schedule_type: cat.schedule_type,
        items: (cat.products || []).map(prod => ({
            id: prod.id,
            name: prod.name,
            description: prod.description || '',
            price: prod.price,
            promotional_price: prod.promotional_price,
            img: prod.img,
            choices: (prod.choice_groups || []).map(group => ({
                id: group.id,
                name: group.name,
                required: group.required,
                min: group.min_selections,
                max: group.max_selections,
                options: group.options.map(opt => ({
                    id: opt.id,
                    name: opt.name,
                    description: opt.description,
                    price: opt.price,
                    img: opt.img,
                    max: opt.max_quantity
                }))
            }))
        }))
    }))
}

// ============================================
// Get Menu (with full nested data)
// ============================================

export async function getMenu(): Promise<MenuCategory[]> {
    const supabase = await createClient()

    // Fetch categories with products
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select(`
            *,
            products (
                *,
                choice_groups (
                    *,
                    choice_options (*)
                )
            )
        `)
        .order('sort_order', { ascending: true })

    if (catError) {
        console.error('Error fetching menu:', catError)
        return []
    }

    // Transform the data to include choice_groups properly
    const transformedCategories = (categories || []).map(cat => ({
        ...cat,
        products: (cat.products || [])
            .sort((a: Product, b: Product) => a.sort_order - b.sort_order)
            .map((prod: any) => ({
                ...prod,
                choice_groups: (prod.choice_groups || [])
                    .sort((a: ChoiceGroup, b: ChoiceGroup) => a.sort_order - b.sort_order)
                    .map((group: any) => ({
                        ...group,
                        options: (group.choice_options || [])
                            .sort((a: ChoiceOption, b: ChoiceOption) => a.sort_order - b.sort_order)
                    }))
            }))
    }))

    return transformToLegacyFormat(transformedCategories as Category[])
}

// ============================================
// Categories CRUD
// ============================================

export async function addCategory(name: string): Promise<{ success: boolean; category?: MenuCategory; error?: string }> {
    const supabase = await createClient()

    // Get max sort_order
    const { data: maxOrder } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name,
            sort_order: sortOrder,
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding category:', error)
        return { success: false, error: error.message }
    }

    return {
        success: true,
        category: {
            id: data.id,
            name: data.name,
            img: null,
            schedule_available: data.schedule_available,
            schedule_type: data.schedule_type,
            items: []
        }
    }
}

export async function updateCategory(
    categoryId: string,
    updates: { name?: string; img?: string | null }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.img !== undefined) updateData.img = updates.img

    const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)

    if (error) {
        console.error('Error updating category:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// Get only categories (no products) for lighter queries
export async function getCategories(): Promise<{ id: string; name: string; img: string | null }[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('categories')
        .select('id, name, img')
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data || []
}

export async function deleteCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

    if (error) {
        console.error('Error deleting category:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ============================================
// Products CRUD
// ============================================

export async function addProduct(
    categoryId: string,
    product: Partial<MenuItem>
): Promise<{ success: boolean; product?: MenuItem; error?: string }> {
    const supabase = await createClient()

    // Get max sort_order for this category
    const { data: maxOrder } = await supabase
        .from('products')
        .select('sort_order')
        .eq('category_id', categoryId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { data, error } = await supabase
        .from('products')
        .insert({
            category_id: categoryId,
            name: product.name || 'Novo Produto',
            description: product.description || null,
            price: product.price || 0,
            promotional_price: product.promotional_price || null,
            img: product.img || null,
            sort_order: sortOrder,
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding product:', error)
        return { success: false, error: error.message }
    }

    return {
        success: true,
        product: {
            id: data.id,
            name: data.name,
            description: data.description || '',
            price: data.price,
            promotional_price: data.promotional_price,
            img: data.img,
            choices: []
        }
    }
}

export async function updateProduct(
    categoryId: string,
    productId: string,
    updates: Partial<MenuItem>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.price !== undefined) updateData.price = updates.price
    if (updates.promotional_price !== undefined) updateData.promotional_price = updates.promotional_price
    if (updates.img !== undefined) updateData.img = updates.img

    const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

    if (error) {
        console.error('Error updating product:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteProduct(categoryId: string, productId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

    if (error) {
        console.error('Error deleting product:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function moveProduct(
    productId: string,
    fromCategoryId: string,
    toCategoryId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Get max sort_order in target category
    const { data: maxOrder } = await supabase
        .from('products')
        .select('sort_order')
        .eq('category_id', toCategoryId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { error } = await supabase
        .from('products')
        .update({
            category_id: toCategoryId,
            sort_order: sortOrder
        })
        .eq('id', productId)

    if (error) {
        console.error('Error moving product:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ============================================
// Choice Group Actions
// ============================================

export async function getProductChoices(productId: string): Promise<MenuChoice[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('choice_groups')
        .select(`
            *,
            choice_options (*)
        `)
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })

    if (error) {
        console.error('Error fetching choices:', error)
        return []
    }

    return (data || []).map(group => ({
        id: group.id,
        name: group.name,
        required: group.required,
        min: group.min_selections,
        max: group.max_selections,
        options: (group.choice_options || [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((opt: any) => ({
                id: opt.id,
                name: opt.name,
                description: opt.description,
                price: opt.price,
                img: opt.img,
                max: opt.max_quantity
            }))
    }))
}

export async function addChoiceGroup(
    productId: string,
    data: { name: string; required?: boolean; min?: number; max?: number }
): Promise<{ success: boolean; choiceGroup?: MenuChoice; error?: string }> {
    const supabase = await createClient()

    // Get max sort_order
    const { data: maxOrder } = await supabase
        .from('choice_groups')
        .select('sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { data: newGroup, error } = await supabase
        .from('choice_groups')
        .insert({
            product_id: productId,
            name: data.name,
            required: data.required ?? false,
            min_selections: data.min ?? 0,
            max_selections: data.max ?? 1,
            use_greater_option_price: false,
            sort_order: sortOrder
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding choice group:', error)
        return { success: false, error: error.message }
    }

    return {
        success: true,
        choiceGroup: {
            id: newGroup.id,
            name: newGroup.name,
            required: newGroup.required,
            min: newGroup.min_selections,
            max: newGroup.max_selections,
            options: []
        }
    }
}

export async function updateChoiceGroup(
    groupId: string,
    updates: { name?: string; required?: boolean; min?: number; max?: number }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.required !== undefined) updateData.required = updates.required
    if (updates.min !== undefined) updateData.min_selections = updates.min
    if (updates.max !== undefined) updateData.max_selections = updates.max

    const { error } = await supabase
        .from('choice_groups')
        .update(updateData)
        .eq('id', groupId)

    if (error) {
        console.error('Error updating choice group:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteChoiceGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // Delete options first (cascade should handle this, but just in case)
    await supabase.from('choice_options').delete().eq('choice_group_id', groupId)

    const { error } = await supabase
        .from('choice_groups')
        .delete()
        .eq('id', groupId)

    if (error) {
        console.error('Error deleting choice group:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

// ============================================
// Choice Option Actions
// ============================================

export async function addChoiceOption(
    groupId: string,
    data: { name: string; price?: number; description?: string; max?: number }
): Promise<{ success: boolean; option?: MenuOption; error?: string }> {
    const supabase = await createClient()

    // Get max sort_order
    const { data: maxOrder } = await supabase
        .from('choice_options')
        .select('sort_order')
        .eq('choice_group_id', groupId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const sortOrder = (maxOrder?.sort_order || 0) + 1

    const { data: newOption, error } = await supabase
        .from('choice_options')
        .insert({
            choice_group_id: groupId,
            name: data.name,
            price: data.price ?? 0,
            description: data.description ?? null,
            max_quantity: data.max ?? 1,
            sort_order: sortOrder
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding choice option:', error)
        return { success: false, error: error.message }
    }

    return {
        success: true,
        option: {
            id: newOption.id,
            name: newOption.name,
            description: newOption.description,
            price: newOption.price,
            img: newOption.img,
            max: newOption.max_quantity
        }
    }
}

export async function updateChoiceOption(
    optionId: string,
    updates: { name?: string; price?: number; description?: string; max?: number }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.price !== undefined) updateData.price = updates.price
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.max !== undefined) updateData.max_quantity = updates.max

    const { error } = await supabase
        .from('choice_options')
        .update(updateData)
        .eq('id', optionId)

    if (error) {
        console.error('Error updating choice option:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteChoiceOption(optionId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('choice_options')
        .delete()
        .eq('id', optionId)

    if (error) {
        console.error('Error deleting choice option:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
