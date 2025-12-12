export const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api-sandbox.asaas.com/v3";
export const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";

export type AsaasChargeInput = {
    customer: string; // Customer ID in Asaas
    billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    postalService?: boolean;
};

export async function createAsaasCharge(data: AsaasChargeInput) {
    if (!ASAAS_API_KEY) {
        throw new Error("ASAAS_API_KEY is not defined");
    }

    const response = await fetch(`${ASAAS_API_URL}/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Asaas Create Charge Error:", errorData);
        throw new Error(errorData.errors?.[0]?.description || "Error creating Asaas charge");
    }

    return response.json();
}

export async function createAsaasCustomer(data: {
    name: string;
    cpfCnpj: string;
    mobilePhone?: string;
    email?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
}) {
    if (!ASAAS_API_KEY) {
        throw new Error("ASAAS_API_KEY is not defined");
    }

    console.log("[createAsaasCustomer] Checking existence for:", data.cpfCnpj);
    // First check if customer exists by CPF/CNPJ
    const searchResponse = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${data.cpfCnpj}`, {
        headers: { access_token: ASAAS_API_KEY }
    });

    if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
            console.log("[createAsaasCustomer] Found existing:", searchData.data[0].id);
            return searchData.data[0];
        }
    } else {
        console.warn("[createAsaasCustomer] Search failed:", searchResponse.status);
    }

    console.log("[createAsaasCustomer] Creating new customer with:", JSON.stringify(data, null, 2));

    const response = await fetch(`${ASAAS_API_URL}/customers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Asaas Create Customer Error:", errorData);
        throw new Error(errorData.errors?.[0]?.description || "Error creating Asaas customer");
    }

    return response.json();
}

export async function getPixQrCode(paymentId: string) {
    if (!ASAAS_API_KEY) {
        throw new Error("ASAAS_API_KEY is not defined");
    }

    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: "GET",
        headers: {
            access_token: ASAAS_API_KEY,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Asaas Get Pix QRCode Error:", errorData);
        throw new Error("Error getting Pix QRCode");
    }

    return response.json();
}

export async function searchAsaasCustomers(query: string) {
    if (!ASAAS_API_KEY) {
        throw new Error("ASAAS_API_KEY is not defined");
    }

    // Determine if query is CPF/CNPJ (digits only) or Name
    const isCpfCnpj = /^\d+$/.test(query.replace(/\D/g, ''));
    const param = isCpfCnpj ? `cpfCnpj=${query.replace(/\D/g, '')}` : `name=${encodeURIComponent(query)}`;

    const response = await fetch(`${ASAAS_API_URL}/customers?${param}&limit=10`, {
        method: "GET",
        headers: {
            access_token: ASAAS_API_KEY,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Asaas Search Customer Error:", errorData);
        return { data: [] }; // Fail gracefully
    }

    return response.json();
}
