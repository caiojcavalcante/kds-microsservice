import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/admin"

// PATCH /api/caixa/[id] - Close a cash session
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServerClient()

    try {
        const body = await req.json()
        const {
            counted_cash,
            closed_by_id,
            closed_by_name,
            notes,
            // These are calculated totals from the frontend
            total_sales,
            total_pix,
            total_card,
            total_cash_sales,
            order_count,
        } = body

        if (counted_cash === undefined || counted_cash === null) {
            return NextResponse.json(
                { error: "Valor contado é obrigatório para fechar o caixa" },
                { status: 400 }
            )
        }

        // Get the session to calculate expected cash
        const { data: session, error: fetchError } = await supabase
            .from("cash_sessions")
            .select("*")
            .eq("id", id)
            .single()

        if (fetchError || !session) {
            return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
        }

        if (session.status === "CLOSED") {
            return NextResponse.json({ error: "Esta sessão já foi fechada" }, { status: 400 })
        }

        // Calculate expected cash: initial balance + cash sales
        const expectedCash = (session.initial_balance || 0) + (total_cash_sales || 0)
        const variance = counted_cash - expectedCash

        // Update the session
        const { data, error } = await supabase
            .from("cash_sessions")
            .update({
                closed_at: new Date().toISOString(),
                closed_by_id,
                closed_by_name,
                expected_cash: expectedCash,
                counted_cash,
                variance,
                total_sales: total_sales || 0,
                total_pix: total_pix || 0,
                total_card: total_card || 0,
                total_cash_sales: total_cash_sales || 0,
                order_count: order_count || 0,
                notes,
                status: "CLOSED",
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("Error closing cash session:", error.message)
            return NextResponse.json({ error: "Erro ao fechar caixa" }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error("Error in PATCH /api/caixa/[id]:", err)
        return NextResponse.json({ error: "Erro ao processar requisição" }, { status: 500 })
    }
}

// GET /api/caixa/[id] - Get a specific session
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
        .from("cash_sessions")
        .select("*")
        .eq("id", id)
        .single()

    if (error) {
        return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    return NextResponse.json(data)
}
