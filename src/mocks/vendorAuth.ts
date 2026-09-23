import type { AuthResponse, RegisterVendorInput, VendorLoginInput } from "../app/api/types"

// TEMPORARY DEVELOPMENT-ONLY vendor auth mock. Disable it with VITE_USE_MOCK_API=false
// once the nseg vendor service is available again.
const STORAGE_KEY = "zamany.mock.vendor.users"
const DELAY_MS = 500

type MockVendor = AuthResponse["user"] & { fullName: string; password: string }

const wait = () => new Promise<void>((resolve) => window.setTimeout(resolve, DELAY_MS))
let memoryUsers: MockVendor[] = []

function readUsers(): MockVendor[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) as MockVendor[] : memoryUsers
  } catch {
    return memoryUsers
  }
}

function saveUsers(users: MockVendor[]) {
  memoryUsers = users
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch {
    // Some browser privacy modes block localStorage; retain the test account for this session.
  }
}

function response(user: MockVendor): AuthResponse {
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email, role: "VENDOR" }))
  return {
    accessToken: `mock.${payload}.development-only`,
    refreshToken: `mock-refresh-${user.id}`,
    user: { id: user.id, name: user.fullName, email: user.email, role: "vendor" },
  }
}

export const useMockVendorAuth =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_USE_MOCK_API !== "false"

export const mockVendorAuth = {
  register: async (input: RegisterVendorInput): Promise<AuthResponse> => {
    await wait()
    const email = input.email.trim().toLowerCase()
    const users = readUsers()
    const user: MockVendor = {
      id: `vendor_${Date.now()}`,
      fullName: input.fullName.trim(),
      name: input.fullName.trim(),
      email,
      role: "vendor",
      password: input.password,
    }
    saveUsers([...users.filter((entry) => entry.email !== email), user])
    return response(user)
  },

  login: async (input: VendorLoginInput): Promise<AuthResponse> => {
    await wait()
    const email = input.email.trim().toLowerCase()
    const user = readUsers().find((entry) => entry.email === email && entry.password === input.password)
    if (!user) throw new Error("Invalid email or password")
    return response(user)
  },
}
