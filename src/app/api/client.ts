import type { AuthTokens } from "./types"

const DEFAULT_BASE_URL = "https://zamany-marketplace.onrender.com"
const REFRESH_TOKEN_STORAGE_KEY = "zamany.marketplace.refresh-token"

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly body?: unknown) {
    super(message)
    this.name = "ApiError"
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  onUnauthorized?: () => void
  onForbidden?: () => void
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown; authenticated?: boolean; retry?: boolean }

let options: ApiClientOptions = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  onUnauthorized: () => window.location.assign("/auth"),
  onForbidden: () => window.dispatchEvent(new CustomEvent("zamany:forbidden")),
}
let refreshInFlight: Promise<AuthTokens | null> | null = null
let inMemoryTokens: AuthTokens | null = null

export function configureApiClient(next: ApiClientOptions) {
  options = { ...options, ...next }
}

export function getTokens(): AuthTokens | null {
  return inMemoryTokens
}

export function setTokens(tokens: AuthTokens) {
  inMemoryTokens = tokens
  // The API returns refresh tokens in JSON rather than an httpOnly cookie. Keep it
  // only for this browser session; the short-lived access token stays in memory.
  if (tokens.refreshToken) {
    try {
      window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
    } catch {
      // Browser privacy settings can block storage; the active in-memory session remains valid.
    }
  }
}

export function clearTokens() {
  inMemoryTokens = null
  try {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  } catch {
    // There is no persisted token to clear when storage is unavailable.
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  try { return JSON.parse(text) } catch { return text }
}

async function refreshTokens(): Promise<AuthTokens | null> {
  const refreshToken = getTokens()?.refreshToken || window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  if (!refreshToken) return null
  if (!refreshInFlight) {
    refreshInFlight = request<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      authenticated: false,
      retry: false,
    }).then((tokens) => {
      setTokens({ ...getTokens(), ...tokens })
      return tokens
    }).catch(() => null).finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

/** Recreates the short-lived in-memory access token after a browser reload. */
export async function restoreSession(): Promise<AuthTokens | null> {
  return refreshTokens()
}

/** Shared request function. Service modules are the only place that should call it. */
export async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
  const { body, authenticated = false, retry = true, headers: requestHeaders, ...init } = requestOptions
  const headers = new Headers(requestHeaders)
  headers.set("Accept", "application/json")
  if (body !== undefined && !(body instanceof FormData)) headers.set("Content-Type", "application/json")
  if (authenticated) {
    const accessToken = getTokens()?.accessToken
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(path.startsWith("http") ? path : `${options.baseUrl?.replace(/\/$/, "")}${path}`, {
    ...init,
    headers,
    body: body === undefined || body instanceof FormData ? body : JSON.stringify(body),
  })

  if (response.status === 401 && authenticated && retry) {
    const tokens = await refreshTokens()
    if (tokens) return request<T>(path, { ...requestOptions, retry: false })
    clearTokens()
    options.onUnauthorized?.()
  }
  if (response.status === 403) options.onForbidden?.()

  const data = await parseResponse(response)
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String(data.message) : `Request failed with status ${response.status}`
    throw new ApiError(response.status, message, data)
  }
  return data as T
}
