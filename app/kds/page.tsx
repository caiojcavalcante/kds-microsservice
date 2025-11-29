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

  return <KdsClient />
}
