/**
 * Import menu.json data to Supabase
 * 
 * Usage:
 *   npx ts-node --esm scripts/import-menu-to-supabase.ts
 * 
 * OR add to package.json:
 *   "scripts": { "import-menu": "ts-node --esm scripts/import-menu-to-supabase.ts" }
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local file
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MenuOption {
    id: number
    name: string
    description: string | null
    max: number
    price: number
    img: string | null
}

interface MenuChoice {
    id: number
    name: string
    required: number
    min: number
    max: number
    use_greater_option_price: number
    options: MenuOption[]
}

interface MenuItem {
    id: number
    name: string
    description: string
    price: number
    promotional_price: number | null
    img: string | null
    schedule_available: string
    schedule_type: number
    choices: MenuChoice[]
}

interface MenuCategory {
    id: number
    name: string
    schedule_available: string
    schedule_type: number
    items: MenuItem[]
}

async function importMenu() {
    console.log('🚀 Starting menu import to Supabase...\n')

    // Read menu.json
    const menuPath = path.join(process.cwd(), 'app', 'data', 'menu.json')
    const menuData: MenuCategory[] = JSON.parse(fs.readFileSync(menuPath, 'utf-8'))

    console.log(`📂 Found ${menuData.length} categories in menu.json\n`)

    let totalProducts = 0
    let totalChoiceGroups = 0
    let totalChoiceOptions = 0

    for (let catIndex = 0; catIndex < menuData.length; catIndex++) {
        const category = menuData[catIndex]

        // Insert category
        const { data: insertedCategory, error: catError } = await supabase
            .from('categories')
            .insert({
                name: category.name,
                sort_order: catIndex,
                schedule_available: category.schedule_available || '1111111',
                schedule_type: category.schedule_type || 0,
            })
            .select()
            .single()

        if (catError) {
            console.error(`❌ Failed to insert category "${category.name}":`, catError.message)
            continue
        }

        console.log(`✅ Category: ${category.name} (${category.items.length} products)`)

        // Insert products for this category
        for (let prodIndex = 0; prodIndex < category.items.length; prodIndex++) {
            const product = category.items[prodIndex]

            const { data: insertedProduct, error: prodError } = await supabase
                .from('products')
                .insert({
                    category_id: insertedCategory.id,
                    name: product.name,
                    description: product.description || null,
                    price: product.price || 0,
                    promotional_price: product.promotional_price || null,
                    img: product.img || null,
                    sort_order: prodIndex,
                    schedule_available: product.schedule_available || '1111111',
                    schedule_type: product.schedule_type || 0,
                })
                .select()
                .single()

            if (prodError) {
                console.error(`   ❌ Failed to insert product "${product.name}":`, prodError.message)
                continue
            }

            totalProducts++

            // Insert choice groups for this product
            if (product.choices && product.choices.length > 0) {
                for (let groupIndex = 0; groupIndex < product.choices.length; groupIndex++) {
                    const choiceGroup = product.choices[groupIndex]

                    const { data: insertedGroup, error: groupError } = await supabase
                        .from('choice_groups')
                        .insert({
                            product_id: insertedProduct.id,
                            name: choiceGroup.name,
                            required: choiceGroup.required === 1,
                            min_selections: choiceGroup.min || 0,
                            max_selections: choiceGroup.max || 1,
                            use_greater_option_price: choiceGroup.use_greater_option_price === 1,
                            sort_order: groupIndex,
                        })
                        .select()
                        .single()

                    if (groupError) {
                        console.error(`      ❌ Failed to insert choice group "${choiceGroup.name}":`, groupError.message)
                        continue
                    }

                    totalChoiceGroups++

                    // Insert choice options for this group
                    if (choiceGroup.options && choiceGroup.options.length > 0) {
                        const optionsToInsert = choiceGroup.options.map((option, optIndex) => ({
                            choice_group_id: insertedGroup.id,
                            name: option.name,
                            description: option.description || null,
                            price: option.price || 0,
                            img: option.img || null,
                            max_quantity: option.max || 1,
                            sort_order: optIndex,
                        }))

                        const { error: optionsError, data: insertedOptions } = await supabase
                            .from('choice_options')
                            .insert(optionsToInsert)
                            .select()

                        if (optionsError) {
                            console.error(`      ❌ Failed to insert options for "${choiceGroup.name}":`, optionsError.message)
                        } else {
                            totalChoiceOptions += insertedOptions?.length || 0
                        }
                    }
                }
            }
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Import Summary:')
    console.log(`   Categories:     ${menuData.length}`)
    console.log(`   Products:       ${totalProducts}`)
    console.log(`   Choice Groups:  ${totalChoiceGroups}`)
    console.log(`   Choice Options: ${totalChoiceOptions}`)
    console.log('='.repeat(50))
    console.log('\n✅ Import complete!')
}

importMenu().catch(console.error)
