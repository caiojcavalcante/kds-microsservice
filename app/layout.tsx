import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { MainNav } from "@/components/main-nav";
import { SmoothScrolling } from "@/components/smooth-scrolling";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ferro e Fogo Parrilla - KDS",
  description: "Sistema de KDS e PDV para Ferro e Fogo Parrilla",
};

import { createClient } from "@/utils/supabase/server";

// ...

import { CartProvider } from "@/contexts/cart-context";

// ...

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  return (
    <html lang="pt-BR" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <CartProvider>
          <SmoothScrolling>
            <MainNav user={user} profile={profile} />
            {children}
          </SmoothScrolling>
        </CartProvider>
      </body>
    </html>
  );
}
