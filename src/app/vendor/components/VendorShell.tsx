import type { ReactNode } from "react"
import { BarChart2, Bell, ChevronDown, CreditCard, Home, List, Package, Search, Settings } from "lucide-react"

export type VendorSection = "dashboard" | "products" | "orders" | "payouts" | "settings"

const navItems: Array<{ id: VendorSection; label: string; icon: ReactNode; unreadCount?: number }> = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={16} /> },
  { id: "products", label: "Products", icon: <Package size={16} /> },
  { id: "orders", label: "Orders", icon: <List size={16} />, unreadCount: 0 },
  { id: "payouts", label: "Payouts", icon: <CreditCard size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
]

export function VendorShell({
  active,
  storeName,
  ownerName,
  status,
  children,
  onNavigate,
}: {
  active: VendorSection
  storeName: string
  ownerName: string
  status: ReactNode
  children: ReactNode
  onNavigate: (section: VendorSection) => void
}) {
  const initials = ownerName.split(" ").filter(Boolean).map((name) => name[0]).join("").slice(0, 2).toUpperCase()
  const notificationCount = navItems.find((item) => item.id === "orders")?.unreadCount ?? 0

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gray-50">
      <header className="shrink-0 border-b border-green-100 bg-white px-3 py-4 sm:px-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <BarChart2 size={15} />
              Vendor Workspace
            </div>
            <h1 className="mt-1 text-2xl font-black text-gray-900">{storeName}</h1>
          </div>
          <label className="hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-green-100 px-3 py-2.5 text-gray-600 md:flex md:max-w-md">
            <Search size={16} />
            <input aria-label="Search" placeholder="Search..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="self-start md:self-auto">{status}</div>
            <div className="relative text-gray-600">
              <Bell size={18} />
              {!!notificationCount && <span className="absolute -right-2 -top-2 rounded-full bg-green-700 px-1.5 py-0.5 text-xs text-white">{notificationCount}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{ownerName}</p>
                <p className="truncate text-xs text-gray-600">{storeName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
          <aside className="hidden min-w-0 shrink-0 overflow-y-auto p-4 md:flex md:w-64 md:flex-col">
            <div className="flex flex-1 flex-col rounded-xl border border-green-100 bg-white p-3">
              <p className="px-3 py-2 text-sm font-black text-gray-900">{storeName}</p>
              <label className="mb-5 flex items-center gap-2 rounded-xl border border-green-100 px-3 py-2.5 text-gray-600">
                <Search size={16} />
                <input aria-label="Search" placeholder="Search..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </label>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${active === item.id ? "bg-green-700 text-white" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {!!item.unreadCount && <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-white">{item.unreadCount}</span>}
                </button>
              ))}
              <div className="mt-auto rounded-xl border border-green-100 p-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{ownerName}</p>
                    <p className="truncate text-xs text-gray-600">{storeName}</p>
                  </div>
                  <button type="button" className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700">
                    <span className="max-w-16 truncate">{storeName}</span><ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
          <section className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</section>
      </div>
    </div>
  )
}
