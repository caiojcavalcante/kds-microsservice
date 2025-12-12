
import { NextRequest, NextResponse } from "next/server";
import { createAsaasCustomer } from "@/utils/asaas";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, cpfCnpj, mobilePhone, email, address, addressNumber, complement, province, postalCode } = body;

        if (!name || !cpfCnpj) {
            return NextResponse.json({ error: "Name and CPF/CNPJ are required" }, { status: 400 });
        }

        const customer = await createAsaasCustomer({
            name,
            cpfCnpj: cpfCnpj.replace(/\D/g, ""),
            mobilePhone: mobilePhone ? mobilePhone.replace(/\D/g, "") : undefined,
            email,
            address,
            addressNumber,
            complement,
            province,
            postalCode
        });

        return NextResponse.json(customer);

    } catch (error: any) {
        console.error("API Create Customer Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
