import { request } from "./client"
import type { LedgerBalance, PayoutRequestInput, VendorOnboardingInput } from "./types"

export const vendorService = {
  updateOnboarding: (input: VendorOnboardingInput) => request<unknown>("/vendors/me/onboarding", { method: "PATCH", body: input, authenticated: true }),
  requestPayout: (input: PayoutRequestInput) => request<unknown>("/vendor/payouts", { method: "POST", body: input, authenticated: true }),
  getLedgerBalance: () => request<LedgerBalance>("/vendor/ledger/balance", { authenticated: true }),
}
