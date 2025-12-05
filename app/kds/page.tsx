import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { KdsClient } from "./client"

export default async function KdsPage() {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error("Error checking auth:", error)
  }

  if (!user) {
    redirect("/login")
  }

  // Extract user info for delivery signature
  const currentUser = {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Funcionário"
  }

  return <KdsClient currentUser={currentUser} />
}
