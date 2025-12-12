import { NextRequest, NextResponse } from "next/server";
import { createAsaasCharge, createAsaasCustomer, getPixQrCode } from "@/utils/asaas";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customer, billingType, value, dueDate, description, externalReference, mobilePhone, email, name, cpfCnpj } = body;

        // 1. Get or Create Customer
        let asaasCustomerId = customer;
        if (!asaasCustomerId && name && cpfCnpj) {
            const customerData = await createAsaasCustomer({ name, cpfCnpj, mobilePhone, email });
            asaasCustomerId = customerData.id;
        }

        if (!asaasCustomerId) {
            return NextResponse.json({ error: "Customer ID or Customer Data (name, cpfCnpj) is required" }, { status: 400 });
        }

        // 2. Create Charge
        const charge = await createAsaasCharge({
            customer: asaasCustomerId,
            billingType,
            value,
            dueDate: dueDate || new Date().toISOString().split('T')[0], // Today if not provided
            description,
            externalReference,
        });

        let result = { ...charge };

        // 3. If PIX, fetch QR Code
        if (billingType === "PIX") {
            try {
                const pixData = await getPixQrCode(charge.id);
                result.pixQrCode = pixData;
            } catch (e) {
                console.error("Error fetching pix qrcode", e);
                // Don't fail the whole request, just return without pix details
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("API Asaas Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
