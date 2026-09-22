import { clearTokens, getTokens, request, setTokens } from "./client"
import type { AuthRole, AuthTokens, LoginInput, RegisterBuyerInput, RegisterVendorInput, VendorLoginInput } from "./types"

function save<T extends AuthTokens>(response: T) {
  setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken })
  return response
}

export function getAccessTokenRole(accessToken: string): AuthRole {
  try {
    const payload = accessToken.split(".")[1]
    if (!payload) throw new Error("JWT payload is missing")
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    const role = JSON.parse(json).role
    if (role === "BUYER" || role === "VENDOR" || role === "ADMIN") return role
  } catch {
    // The public error below intentionally does not expose token contents.
  }
  throw new Error("The account role could not be read from the login token")
}

export const authService = {
  registerBuyer: (input: RegisterBuyerInput) => request<AuthTokens>("/auth/register/buyer", { method: "POST", body: input }).then(save),
  registerVendor: (input: RegisterVendorInput) => request<AuthTokens>("https://nseg.onrender.com/auth/register", { method: "POST", body: input }).then(save),
  login: async (input: LoginInput) => {
    const tokens = await request<AuthTokens>("/auth/login", { method: "POST", body: input })
    const role = getAccessTokenRole(tokens.accessToken)
    save(tokens)
    return { ...tokens, role }
  },
  loginVendor: async (input: VendorLoginInput) => {
    const tokens = await request<AuthTokens>("https://nseg.onrender.com/auth/login", { method: "POST", body: input })
    const role = getAccessTokenRole(tokens.accessToken)
    save(tokens)
    return { ...tokens, role }
  },
  refresh: async () => {
    const refreshToken = getTokens()?.refreshToken || window.sessionStorage.getItem("zamany.marketplace.refresh-token")
    if (!refreshToken) throw new Error("No refresh token is available")
    const tokens = await request<AuthTokens>("/auth/refresh", { method: "POST", body: { refreshToken } })
    setTokens({ ...getTokens(), ...tokens })
    return tokens
  },
  logout: async () => { try { await request<void>("/auth/logout", { method: "POST", authenticated: true }) } finally { clearTokens() } },
  logoutAll: async () => { try { await request<void>("/auth/logout-all", { method: "POST", authenticated: true }) } finally { clearTokens() } },
}
