
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
    address?: any; // Include address object
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

    // 1. Search Local (Supabase) by Name, Phone, Email
    // Note: CPF search is tricky with formatting. We'll try to match both specific format or just a string match.
    // Ideally, we should store normalized CPFs. For now, we search looser or ensure frontend sends formatted.

    // We clean the query for phone/cpf matching (digits only)
    const cleanQuery = query.replace(/\D/g, '');

    let queryBuilder = supabase
        .from('profiles')
        .select(`
            id, 
            full_name, 
            phone, 
            cpf, 
            email
        `)
        .limit(5);

    // Build the OR clause with conditional logic for cleaner matching
    // If cleanQuery is long enough, try matching against stored numeric fields if they exist
    // But since we rely on 'ilike' against text columns that might be formatted:

    let orConditions = `full_name.ilike.%${query}%,email.ilike.%${query}%,cpf.ilike.%${query}%,phone.ilike.%${query}%`;

    if (cleanQuery.length > 0) {
        orConditions += `,cpf.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`;
    }

    queryBuilder = queryBuilder.or(orConditions);

    // NOTE: If your DB stores CPFs as "12345678900" but user types "123.456", the above might fail.
    // If DB stores formatted, and user types unformatted, it also fails.
    // Optimally, we search Asaas primarily for CPF, but for local profiles we trust the query string.

    const { data: localData, error } = await queryBuilder;

    if (localData) {
        // Fetch addresses for these users
        const userIds = localData.map((p: any) => p.id);
        const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .in('user_id', userIds)
            .eq('is_default', true); // Prefer default

        localData.forEach((p: any) => {
            const activeAddress = addresses?.find((a: any) => a.user_id === p.id);

            results.push({
                ...p,
                source: "LOCAL",
                address: activeAddress // Attach active address
            });
            if (p.cpf) cpfsFound.add(p.cpf.replace(/\D/g, ''));
        });
    }

    // 2. Search Asaas (Active search)
    // Only search Asaas if query looks like CPF or Email or Name > 3 chars
    if (results.length === 0 || query.length > 3) {
        try {
            const asaasResponse = await searchAsaasCustomers(query);
            const asaasCustomers = asaasResponse.data || [];

            // We also need to fetch addresses for Asaas customers from our local DB if we have them linked?
            // Or usually Asaas users are treated as external. 
            // If we have saved addresses for 'asaas_ID' locally, we should fetch them.

            const asaasIds = asaasCustomers.map((c: any) => c.id);
            let asaasAddresses: any[] = [];

            if (asaasIds.length > 0) {
                const { data: addrData } = await supabase
                    .from('addresses')
                    .select('*')
                    .in('asaas_customer_id', asaasIds)
                    .eq('is_default', true); // Prefer default
                if (addrData) asaasAddresses = addrData;
            }

            asaasCustomers.forEach((c: any) => {
                const cleanCpf = c.cpfCnpj ? c.cpfCnpj.replace(/\D/g, '') : null;

                // Avoid duplicates if already found locally (by CPF)
                if (cleanCpf && cpfsFound.has(cleanCpf)) return;

                const activeAddress = asaasAddresses.find((a: any) => a.asaas_customer_id === c.id);

                results.push({
                    id: `asaas_${c.id}`, // Temporary ID for frontend
                    full_name: c.name,
                    phone: c.mobilePhone,
                    cpf: c.cpfCnpj,
                    email: c.email,
                    source: "ASAAS",
                    address: activeAddress // Attach active address if we have it locally
                });
            });

        } catch (err) {
            console.error("Error searching Asaas:", err);
            // Continue with just local results if Asaas fails
        }
    }

    return NextResponse.json(results);
}
