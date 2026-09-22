import { request } from "./client"
import type { CheckoutInput, CheckoutResponse } from "./types"

export const ordersService = {
  checkout: (input: CheckoutInput) => request<CheckoutResponse>("/orders/checkout", { method: "POST", body: input, authenticated: true }),
}
