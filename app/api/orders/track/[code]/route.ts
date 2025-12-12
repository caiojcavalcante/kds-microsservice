
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const supabase = createServerClient();
    const { code } = await params;

    if (!code) {
        return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    try {
        // Admin client bypasses RLS
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("code", code)
            .single();

        if (error) {
            console.error("Order fetch error:", error.message);
            return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
        }

        let total = data.total;
        if (!total && data.items) {
            total = data.items.reduce((acc: number, item: any) => acc + (Number(item.price) * Number(item.quantity)), 0);
        }

        return NextResponse.json({ ...data, total });

    } catch (error: any) {
        console.error("Internal error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
