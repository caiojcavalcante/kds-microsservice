import { redirect } from "next/navigation"
import { User, LogOut, Shield } from "lucide-react"

import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { logout } from "./actions"
import { AddressManager } from "@/components/address-manager"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const { data: addresses } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false })

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
          <p className="text-muted-foreground">Gerencie suas informações de acesso</p>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">{profile?.full_name || user.email}</CardTitle>
                <CardDescription>{profile?.role === 'admin' ? 'Administrador' : 'Cliente'}</CardDescription>
                {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Sua conta está protegida e ativa.</span>
            </div>

            <Separator />

            <AddressManager addresses={addresses || []} />

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Ações</h3>
              <form action={logout}>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair da Conta
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
