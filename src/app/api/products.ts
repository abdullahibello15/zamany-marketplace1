import { request } from "./client"
import type { CreateProductInput, Product, ProductListResponse, ProductQuery, StockAdjustmentInput, UpdateProductInput } from "./types"

const queryString = (query: ProductQuery) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)))
  const value = params.toString()
  return value ? `?${value}` : ""
}

export const productsService = {
  list: (query: ProductQuery = {}) => request<ProductListResponse>(`/products${queryString(query)}`),
  get: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`),
  create: (input: CreateProductInput) => request<Product>("/products", { method: "POST", body: input, authenticated: true }),
  update: (id: string, input: UpdateProductInput) => request<Product>(`/products/${encodeURIComponent(id)}`, { method: "PATCH", body: input, authenticated: true }),
  submit: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}/submit`, { method: "POST", authenticated: true }),
  adjustStock: (id: string, input: StockAdjustmentInput) => request<Product>(`/products/${encodeURIComponent(id)}/stock-adjustments`, { method: "POST", body: input, authenticated: true }),
}
