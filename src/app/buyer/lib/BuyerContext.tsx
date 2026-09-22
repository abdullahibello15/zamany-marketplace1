import React, { createContext, useContext, useMemo, useState } from "react"
import type { AuthRole } from "../../api"
import { buyerApi } from "./buyerApi"
import type { BuyerCartItem, BuyerProduct, BuyerUser } from "./buyerTypes"

interface BuyerContextValue {
  user: BuyerUser | null
  isLoggedIn: boolean
  cart: BuyerCartItem[]
  wishlist: string[]
  cartCount: number
  cartTotal: number
  login: (email: string, password: string) => Promise<AuthRole>
  register: (payload: Partial<BuyerUser> & { password?: string }) => Promise<void>
  verifyAccount: (code: string) => Promise<void>
  updateProfile: (updates: Partial<BuyerUser>) => Promise<void>
  logout: () => void
  addToCart: (product: BuyerProduct, quantity?: number, variantId?: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => Promise<void>
}

const BuyerContext = createContext<BuyerContextValue | null>(null)

export function BuyerProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BuyerUser | null>(null)
  const [cart, setCart] = useState<BuyerCartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>(["bp_001"])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const value = useMemo<BuyerContextValue>(() => ({
    user,
    isLoggedIn: Boolean(user),
    cart,
    wishlist,
    cartCount,
    cartTotal,
    login: async (email: string, password: string) => {
      const result = await buyerApi.login(email, password)
      setUser({ ...result.user, verified: true })
      return "BUYER"
    },
    register: async (payload) => {
      if (!payload.email || !payload.password) throw new Error("Email and password are required")
      const result = await buyerApi.register(payload)
      setUser(result.user)
    },
    verifyAccount: async (code) => {
      setUser(await buyerApi.verifyAccount(code))
    },
    updateProfile: async (updates) => {
      setUser(await buyerApi.saveMe(updates))
    },
    logout: () => {
      setUser(null)
      setCart([])
    },
    addToCart: (product, quantity = 1, variantId) => {
      setCart((current) => {
        const existing = current.find((item) => item.product.id === product.id && item.variantId === variantId)
        if (existing) return current.map((item) => item === existing ? { ...item, quantity: item.quantity + quantity } : item)
        return [...current, { product, quantity, variantId }]
      })
    },
    updateCartQuantity: (productId, quantity) => {
      if (quantity < 1) {
        setCart((current) => current.filter((item) => item.product.id !== productId))
        return
      }
      setCart((current) => current.map((item) => item.product.id === productId ? { ...item, quantity } : item))
    },
    removeFromCart: (productId) => setCart((current) => current.filter((item) => item.product.id !== productId)),
    clearCart: () => setCart([]),
    toggleWishlist: async (productId) => {
      setWishlist(await buyerApi.toggleWishlist(productId))
    },
  }), [cart, cartCount, cartTotal, user, wishlist])

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>
}

export function useBuyer() {
  const context = useContext(BuyerContext)
  if (!context) throw new Error("useBuyer must be used within BuyerProvider")
  return context
}
