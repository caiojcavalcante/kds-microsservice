
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/utils/supabase/admin";
import { searchAsaasCustomers } from "@/utils/asaas";

type Profile = {
    id: string;
    full_name: string | null;
    phone: string | null;
    cpf: string | null;
    email: string | null;
    source?: "LOCAL" | "ASAAS";
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.length < 3) {
        return NextResponse.json([]);
    }

    const supabase = createServerClient();
    const results: Profile[] = [];
    const cpfsFound = new Set<string>();

    // 1. Search Local (Supabase)
    const { data: localData, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, cpf, email')
        .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,cpf.ilike.%${query}%`)
        .limit(5);

    if (localData) {
        localData.forEach((p: any) => {
            results.push({ ...p, source: "LOCAL" });
            if (p.cpf) cpfsFound.add(p.cpf.replace(/\D/g, ''));
        });
    }

    // 2. Search Asaas
    try {
        const asaasResponse = await searchAsaasCustomers(query);
        const asaasCustomers = asaasResponse.data || [];

        asaasCustomers.forEach((c: any) => {
            const cleanCpf = c.cpfCnpj ? c.cpfCnpj.replace(/\D/g, '') : null;

            // Avoid duplicates if already found locally (by CPF)
            if (cleanCpf && cpfsFound.has(cleanCpf)) return;

            results.push({
                id: `asaas_${c.id}`, // Temporary ID for frontend
                full_name: c.name,
                phone: c.mobilePhone,
                cpf: c.cpfCnpj,
                email: c.email,
                source: "ASAAS"
            });
        });

    } catch (err) {
        console.error("Error searching Asaas:", err);
        // Continue with just local results if Asaas fails
    }

    return NextResponse.json(results);
}
