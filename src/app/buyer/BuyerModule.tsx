import { Navigate, Route, Routes } from "react-router"
import { BuyerProvider } from "./lib/BuyerContext"
import { BuyerShell } from "./components/BuyerShell"
import { BuyerMarketplacePage } from "./pages/BuyerMarketplacePage"
import { BuyerProductDetailPage } from "./pages/BuyerProductDetailPage"
import { BuyerCartPage } from "./pages/BuyerCartPage"
import { BuyerCheckoutPage } from "./pages/BuyerCheckoutPage"
import { BuyerAuthPage } from "./pages/BuyerAuthPage"
import { BuyerAccountPage, BuyerOrderDetailPage } from "./pages/BuyerAccountPage"
import { BuyerProviderProfilePage } from "./pages/BuyerProviderProfilePage"

export default function BuyerModule() {
  return (
    <BuyerProvider>
      <BuyerShell>
        <Routes>
          <Route path="/" element={<BuyerMarketplacePage />} />
          <Route path="/products" element={<BuyerMarketplacePage />} />
          <Route path="/products/:id" element={<BuyerProductDetailPage />} />
          <Route path="/cart" element={<BuyerCartPage />} />
          <Route path="/checkout" element={<BuyerCheckoutPage />} />
          <Route path="/dashboard" element={<BuyerAccountPage />} />
          <Route path="/wishlist" element={<Navigate to="/dashboard?tab=wishlist" replace />} />
          <Route path="/orders/:id" element={<BuyerOrderDetailPage />} />
          <Route path="/profiles/:id" element={<BuyerProviderProfilePage />} />
          <Route path="/auth" element={<BuyerAuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BuyerShell>
    </BuyerProvider>
  )
}
