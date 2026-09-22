import { request } from "./client"
import type { Cart, CartItem, CartItemInput, UpdateCartItemInput } from "./types"

export const cartService = {
  get: () => request<Cart>("/cart", { authenticated: true }),
  addItem: (input: CartItemInput) => request<CartItem>("/cart/items", { method: "POST", body: input, authenticated: true }),
  updateItem: ({ itemId, ...input }: UpdateCartItemInput) => request<CartItem>(`/cart/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: input, authenticated: true }),
  removeItem: (itemId: string) => request<void>(`/cart/items/${encodeURIComponent(itemId)}`, { method: "DELETE", authenticated: true }),
}
