"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ChefHat, Home, Monitor, Settings } from "lucide-react"

import { cn } from "@/lib/utils"

export function MainNav() {
  const pathname = usePathname()

  const links = [
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/pdv",
      label: "PDV",
      icon: Monitor,
    },
    {
      href: "/kds",
      label: "KDS",
      icon: ChefHat,
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Desktop Nav */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <div className="relative h-12 w-24">
                <Image 
                  src="/logo.png" 
                  alt="Ferro e Fogo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="hidden font-bold sm:inline-block text-red-600">
                Ferro e Fogo
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {links.map((link) => (
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
        </div>
      </header>

      {/* Mobile Nav (Floating Bottom) */}
      <div className="md:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <nav className="flex items-center gap-1 rounded-full border bg-background/80 backdrop-blur-md p-2 shadow-lg shadow-black/20">
          {links.map((link) => {
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
        </nav>
      </div>
    </>
  )
}
