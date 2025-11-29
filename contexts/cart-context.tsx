"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { CartItem } from "@/components/product-customizer"

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, "uniqueId">) => void
  removeFromCart: (uniqueId: string) => void
  updateQuantity: (uniqueId: string, delta: number) => void
  clearCart: () => void
  cartTotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse cart", e)
      }
    }
  }, [])

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: Omit<CartItem, "uniqueId">) => {
    const newItem = { ...item, uniqueId: Math.random().toString(36).substr(2, 9) }
    setCart(prev => [...prev, newItem])
  }

  const removeFromCart = (uniqueId: string) => {
    setCart(prev => prev.filter(item => item.uniqueId !== uniqueId))
  }

  const clearCart = () => {
    setCart([])
  }

  const updateQuantity = (uniqueId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.uniqueId === uniqueId) {
        const newQuantity = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQuantity, totalPrice: (item.totalPrice / item.quantity) * newQuantity }
      }
      return item
    }))
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
