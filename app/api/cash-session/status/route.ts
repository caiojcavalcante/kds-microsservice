
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerClient();

        // Check for any session with status 'OPEN'
        // In a multi-user/multi-pos environment, we might filter by user or terminal ID
        // For now, we assume a single store context or global session
        const { data, error } = await supabase
            .from('cash_sessions')
            .select('id, opened_at, initial_balance')
            .eq('status', 'OPEN')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error("Error checking cash session:", error);
            return NextResponse.json({ error: "Failed to check session status" }, { status: 500 });
        }

        if (data) {
            return NextResponse.json({ isOpen: true, session: data });
        } else {
            return NextResponse.json({ isOpen: false });
        }

    } catch (error) {
        console.error("Internal API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
