import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/admin"

export type CashSession = {
    id: string
    opened_at: string
    closed_at: string | null
    opened_by_id: string
    opened_by_name: string
    closed_by_id: string | null
    closed_by_name: string | null
    initial_balance: number
    expected_cash: number | null
    counted_cash: number | null
    variance: number | null
    total_sales: number
    total_pix: number
    total_card: number
    total_cash_sales: number
    order_count: number
    notes: string | null
    status: 'OPEN' | 'CLOSED'
}

// GET /api/caixa - Get current session or session history
export async function GET(req: NextRequest) {
    const supabase = createServerClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") // 'OPEN', 'CLOSED', or null for all
    const current = searchParams.get("current") // 'true' to get only the current open session

    let query = supabase
        .from("cash_sessions")
        .select("*")
        .order("opened_at", { ascending: false })

    if (current === "true") {
        query = query.eq("status", "OPEN").limit(1)
    } else if (status) {
        query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching cash sessions:", error.message)
        return NextResponse.json({ error: "Erro ao buscar sessões de caixa" }, { status: 500 })
    }

    // If looking for current session, return single object or null
    if (current === "true") {
        return NextResponse.json(data?.[0] || null)
    }

    return NextResponse.json(data ?? [])
}

// POST /api/caixa - Open a new cash session
export async function POST(req: NextRequest) {
    const supabase = createServerClient()

    try {
        const body = await req.json()
        const { initial_balance, opened_by_id, opened_by_name } = body

        if (!opened_by_name) {
            return NextResponse.json({ error: "Nome do operador é obrigatório" }, { status: 400 })
        }

        // Check if there's already an open session
        const { data: existingOpen } = await supabase
            .from("cash_sessions")
            .select("id")
            .eq("status", "OPEN")
            .limit(1)

        if (existingOpen && existingOpen.length > 0) {
            return NextResponse.json(
                { error: "Já existe um caixa aberto. Feche-o antes de abrir um novo." },
                { status: 400 }
            )
        }

        // Create new session
        const { data, error } = await supabase
            .from("cash_sessions")
            .insert({
                initial_balance: initial_balance || 0,
                opened_by_id,
                opened_by_name,
                status: "OPEN"
            })
            .select()
            .single()

        if (error) {
            console.error("Error opening cash session:", error.message)
            return NextResponse.json({ error: "Erro ao abrir caixa" }, { status: 500 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error("Error in POST /api/caixa:", err)
        return NextResponse.json({ error: "Erro ao processar requisição" }, { status: 500 })
    }
}
