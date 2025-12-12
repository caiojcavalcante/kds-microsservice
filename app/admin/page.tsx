import { createServerClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AlertTriangle, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AdminClient } from "./client"

type OrderItem = {
  product_name: string
  quantity: number
  notes: string | null
}

type OrderRow = {
  id: string
  code: string
  table_number: string | null
  customer_name: string | null
  customer_phone: string | null
  status: string
  source: string | null
  service_type: string | null
  motoboy_name: string | null
  motoboy_phone: string | null
  created_at: string
  updated_at: string
  items: OrderItem[] | null
  // Payment fields
  obs: string | null
  payment: string | null
  payment_status: string | null
  billingType: string | null
  total: number | null
  encodedImage: string | null
  copiaecola: string | null
  invoiceUrl: string | null
  // Delivery signature
  delivered_by_id: string | null
  delivered_by_name: string | null
  delivered_at: string | null
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = createServerClient()

  // Select all fields for admin access
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  const safeOrders: OrderRow[] = (orders || []) as any

  // Fetch menu
  const fs = require("fs")
  const path = require("path")
  const menuPath = path.join(process.cwd(), "public", "cardapio.json")
  let menu = []
  try {
    const fileContents = fs.readFileSync(menuPath, "utf8")
    menu = JSON.parse(fileContents)
  } catch (e) {
    console.error("Erro ao ler cardapio:", e)
  }

  return (
    <main className="min-h-screen bg-black md:p-4 p-4 pb-36">
      <div className="mx-auto max-w-7xl space-y-8">
        <AdminClient initialOrders={safeOrders} menu={menu} />
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Erro ao carregar pedidos
            </div>
            <p className="text-sm opacity-90">{error.message}</p>
          </div>
        )}

      </div>
    </main>
  )
}
