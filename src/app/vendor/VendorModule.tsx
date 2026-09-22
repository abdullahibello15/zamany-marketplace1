import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { VendorShell, type VendorSection } from "./components/VendorShell"
import { VendorErrorState, VendorLoadingState } from "./components/VendorStates"
import { VendorStatusBadge } from "./components/VendorStatusBadge"
import { vendorApi } from "./lib/vendorApi"
import type { VendorDocument, VendorProfile } from "./lib/vendorTypes"
import { VendorDashboardPage } from "./pages/VendorDashboardPage"
import { VendorProductsPage } from "./pages/VendorProductsPage"
import { VendorOrdersPage } from "./pages/VendorOrdersPage"
import { VendorPayoutsPage } from "./pages/VendorPayoutsPage"
import { VendorSettingsPage } from "./pages/VendorSettingsPage"

export default function VendorModule() {
  const location = useLocation()
  const navigate = useNavigate()
  const section = new URLSearchParams(location.search).get("section")
  const active: VendorSection = section === "products" || section === "orders" || section === "payouts" || section === "settings" ? section : "dashboard"
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")
      setProfile(await vendorApi.getProfile())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load vendor profile")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  const uploadDocument = async (documentId: string, file: File) => {
    const uploaded: VendorDocument = await vendorApi.uploadDocument(documentId, file)
    setProfile((current) => current ? {
      ...current,
      documents: current.documents.map((doc) => doc.id === documentId ? uploaded : doc),
    } : current)
  }

  const saveProfile = async (updates: Partial<VendorProfile>) => {
    setProfile(await vendorApi.saveProfile(updates))
  }

  const navigateToSection = (next: VendorSection) => {
    navigate(next === "dashboard" ? "/seller-dashboard" : `/seller-dashboard?section=${next}`)
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-6"><VendorLoadingState /></div>
  if (error || !profile) return <div className="mx-auto max-w-7xl px-4 py-6"><VendorErrorState body={error || "Vendor profile was not found"} onRetry={loadProfile} /></div>

  return (
    <VendorShell
      active={active}
      storeName={profile.storeName}
      ownerName={profile.ownerName}
      status={<VendorStatusBadge status={profile.status} />}
      onNavigate={navigateToSection}
    >
      {active === "dashboard" && <VendorDashboardPage profile={profile} />}
      {active === "products" && <VendorProductsPage />}
      {active === "orders" && <VendorOrdersPage />}
      {active === "payouts" && <VendorPayoutsPage />}
      {active === "settings" && <VendorSettingsPage profile={profile} onSave={saveProfile} onUploadDocument={uploadDocument} />}
      {active !== "dashboard" && active !== "products" && active !== "orders" && active !== "payouts" && active !== "settings" && (
        <VendorErrorState title="Section not built yet" body="This section shell is ready; the next increment will add the full screen with loading, empty, and error states." />
      )}
    </VendorShell>
  )
}
