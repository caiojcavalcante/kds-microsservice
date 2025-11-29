"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ChefHat, Home, Monitor, Settings, User, UtensilsCrossed, ShoppingCart } from "lucide-react"
import { type User as SupabaseUser } from "@supabase/supabase-js"

import { cn } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"

export function MainNav({ user, profile }: { user?: SupabaseUser | null, profile?: any }) {
  const pathname = usePathname()
  const { cart } = useCart()

  const isAdmin = profile?.role === 'admin'

  const links = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      show: true
    },
    {
      href: "/cardapio",
      label: "Cardápio",
      icon: UtensilsCrossed,
      show: true
    },
    {
      href: "/pdv",
      label: "PDV",
      icon: Monitor,
      show: isAdmin
    },
    {
      href: "/kds",
      label: "KDS",
      icon: ChefHat,
      show: isAdmin
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
      show: isAdmin
    },
  ]

  const visibleLinks = links.filter(link => link.show)

  return (
    <>
      {/* Desktop Nav */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-red-600/20 bg-black backdrop-blur supports-[backdrop-filter]:bg-black">
        <div className="container flex h-14 items-center justify-between mx-auto my-2">
          <div className="flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="relative h-12 w-24">
                <Image 
                  src="/logo.jpeg" 
                  alt="Ferro e Fogo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium my-2">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 relative",
                    pathname === link.href ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  {pathname === link.href && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-[1.15rem] left-0 right-0 h-[2px] bg-red-600"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/carrinho" className="relative group">
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                cart.length > 0 ? "bg-red-600/10 text-red-600" : "text-muted-foreground hover:bg-muted"
              )}>
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {cart.length}
                  </span>
                )}
              </div>
            </Link>

            {user ? (
              <Link href="/account" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <div className="h-8 w-8 rounded-full bg-red-600/10 flex items-center justify-center border border-red-600/20">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <span className="hidden lg:inline-block truncate max-w-[150px]">{user.email}</span>
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav (Floating Bottom) */}
      <div className="md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-1 rounded-full border bg-background/80 backdrop-blur-md p-2 shadow-lg shadow-black/20">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isActive 
                    ? "bg-red-600 text-white shadow-fire" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <link.icon className="h-5 w-5" />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 rounded-full bg-red-600 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="sr-only">{link.label}</span>
              </Link>
            )
          })}
          
          <div className="w-px h-6 bg-border mx-1" />

          <Link
            href="/carrinho"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              pathname === "/carrinho"
                ? "bg-red-600 text-white shadow-fire" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shadow-sm border border-background">
                {cart.length}
              </span>
            )}
          </Link>
          
          <Link
            href={user ? "/account" : "/login"}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              pathname === "/account"
                ? "bg-red-600 text-white shadow-fire" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <User className="h-5 w-5" />
            {pathname === "/account" && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute inset-0 rounded-full bg-red-600 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        </nav>
      </div>
    </>
  )
}

