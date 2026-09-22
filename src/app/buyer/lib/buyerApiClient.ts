type ApiOptions = RequestInit & { token?: string }

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export const buyerBackendGaps = [
  "No VITE_API_BASE_URL is configured in this workspace; buyerApi currently uses in-memory mocks.",
  "Auth token refresh, email/phone verification delivery, and logout endpoints are not documented.",
  "Cart response shape for multi-vendor grouping is not documented.",
  "Checkout payment initialization/redirect response shape is not documented.",
  "Shipping-method endpoint and delivery fee calculation are not documented.",
  "Review eligibility response shape is not documented; mock uses order item reviewed flags.",
]

export async function buyerApiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("Buyer backend base URL is not configured")
  }

  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json")
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`)

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function hasBuyerBackend() {
  return false
}
