/** Types inferred from the published endpoint contract. Refine fields when the API schema is published. */
export type UserRole = "buyer" | "vendor" | "admin"
export type AuthRole = "BUYER" | "VENDOR" | "ADMIN"

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
  name?: string
}

export interface AuthResponse extends AuthTokens {
  user: AuthenticatedUser
}

export interface RegisterBuyerInput {
  email: string
  password: string
}

export interface RegisterVendorInput {
  fullName: string
  email: string
  phoneNumber: string
  nin: string
  password: string
  confirmPassword: string
}

export interface LoginInput {
  email: string
  password: string
  deviceName?: string
}

export interface VendorLoginInput {
  email: string
  password: string
}

export interface ProductQuery {
  q?: string
  category?: string
  vendorId?: string
  page?: number
  limit?: number
}

export interface ProductImage {
  url: string
  alt?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  stock?: number
  status?: "draft" | "pending" | "active" | "rejected"
  images?: ProductImage[]
  vendorId?: string
  categoryId?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductListResponse {
  data: Product[]
  page?: number
  limit?: number
  total?: number
}

export interface CreateProductInput {
  name: string
  description?: string
  price: number
  stock: number
  categoryId: string
  images?: ProductImage[]
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface StockAdjustmentInput {
  quantity: number
  reason?: string
}

export interface VendorOnboardingInput {
  businessName?: string
  phone?: string
  address?: string
  documents?: Array<{ type: string; url: string }>
  [field: string]: unknown
}

export interface PayoutRequestInput {
  amount: number
  bankAccountId?: string
}

export interface LedgerBalance {
  available: number
  pending: number
  currency?: string
}

export interface CartItemInput {
  productId: string
  quantity: number
  variantId?: string
}

export interface CartItem extends CartItemInput {
  id: string
  product?: Product
  unitPrice?: number
}

export interface Cart {
  id: string
  items: CartItem[]
  subtotal?: number
  currency?: string
}

export interface UpdateCartItemInput {
  itemId: string
  quantity: number
}

export interface CheckoutInput {
  addressId?: string
  paymentMethodId?: string
  items?: CartItemInput[]
  [field: string]: unknown
}

export interface CheckoutResponse {
  orderId: string
  paymentUrl?: string
  reference?: string
  [field: string]: unknown
}
