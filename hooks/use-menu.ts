"use client"

import { useState, useEffect } from 'react'
import { createClient } from "@/utils/supabase/client"

export interface MenuOption {
    id: string
    name: string
    description: string | null
    price: number
    img: string | null
    max: number
}

export interface MenuChoice {
    id: string
    name: string
    required: boolean
    min: number
    max: number
    options: MenuOption[]
}

export interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    promotional_price: number | null
    promotional_percentage?: number | null
    img: string | null
    choices: MenuChoice[]
}

export interface MenuCategory {
    id: string
    name: string
    schedule_available: string
    schedule_type: number
    items: MenuItem[]
}

// Cache for menu data (avoids refetching on every component)
let menuCache: MenuCategory[] | null = null
let menuCacheTimestamp: number = 0
const CACHE_DURATION = 60000 // 1 minute cache

export function useMenu() {
    const [menu, setMenu] = useState<MenuCategory[]>(menuCache || [])
    const [loading, setLoading] = useState(!menuCache)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchMenu() {
            // Check cache first
            if (menuCache && Date.now() - menuCacheTimestamp < CACHE_DURATION) {
                setMenu(menuCache)
                setLoading(false)
                return
            }

            const supabase = createClient()

            try {
                // Fetch categories with products and their choices
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

                if (catError) throw catError

                // Transform to legacy format
                const transformedMenu: MenuCategory[] = (categories || []).map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    schedule_available: cat.schedule_available,
                    schedule_type: cat.schedule_type,
                    items: (cat.products || [])
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                        .map((prod: any) => ({
                            id: prod.id,
                            name: prod.name,
                            description: prod.description || '',
                            price: prod.price,
                            promotional_price: prod.promotional_price,
                            promotional_percentage: prod.promotional_price
                                ? Math.round((1 - prod.promotional_price / prod.price) * 100)
                                : null,
                            img: prod.img,
                            choices: (prod.choice_groups || [])
                                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                                .map((group: any) => ({
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
                        }))
                }))

                // Update cache
                menuCache = transformedMenu
                menuCacheTimestamp = Date.now()

                setMenu(transformedMenu)
                setLoading(false)
            } catch (err) {
                console.error('Error fetching menu:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch menu')
                setLoading(false)
            }
        }

        fetchMenu()
    }, [])

    // Function to invalidate cache and refetch
    const refetch = async () => {
        menuCache = null
        setLoading(true)
        // Let the useEffect handle refetching
    }

    return { menu, loading, error, refetch }
}

// Utility to clear cache (useful after mutations)
export function invalidateMenuCache() {
    menuCache = null
    menuCacheTimestamp = 0
}
