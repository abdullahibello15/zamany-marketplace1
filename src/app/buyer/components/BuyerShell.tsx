import { useState, type FormEvent, type ReactNode } from "react"
import { Heart, Home, Menu, Package, Search, Settings, ShoppingCart, User, X } from "lucide-react"
import { Link, NavLink, useNavigate, useSearchParams } from "react-router"
import { useBuyer } from "../lib/BuyerContext"

const navItems = [
  { to: "/", label: "Home", icon: <Home size={16} /> },
  { to: "/products", label: "Shop", icon: <Search size={16} /> },
  { to: "/dashboard?tab=orders", label: "Orders", icon: <Package size={16} /> },
  { to: "/wishlist", label: "Wishlist", icon: <Heart size={16} /> },
]

export function BuyerShell({ children }: { children: ReactNode }) {
  const { cartCount, user, logout } = useBuyer()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const q = String(data.get("q") || "").trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setMenuOpen(false)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-700 text-lg font-black text-white">Z</div>
            <span className="truncate text-sm font-black text-green-800 sm:text-xl">ZAMANI NG <span className="text-amber-500">MARKET HUB</span></span>
          </Link>
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-green-700 hover:bg-green-50" aria-label="Cart" onClick={() => setMenuOpen(false)}>
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="absolute right-1 top-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">{cartCount}</span>}
              </Link>
              <button onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 hover:bg-green-50" aria-label="Toggle navigation">
                {menuOpen ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </div>

          <form onSubmit={submitSearch} className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="q"
              defaultValue={params.get("q") ?? ""}
              placeholder="Search products, vendors, categories"
              className="min-h-11 w-full rounded-xl border-2 border-green-100 bg-green-50/40 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-600"
            />
          </form>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold transition-colors ${isActive ? "bg-green-700 text-white" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
            <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-green-700 hover:bg-green-50" aria-label="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">{cartCount}</span>}
            </Link>
            {user ? (
              <button onClick={logout} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700">
                <User size={16} />
                {user.name.split(" ")[0]}
              </button>
            ) : (
              <Link to="/auth" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white hover:bg-green-800">
                <Settings size={16} />
                Login
              </Link>
            )}
          </nav>

          {menuOpen && (
            <nav className="grid gap-2 border-t border-green-50 pt-3 lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${isActive ? "bg-green-700 text-white" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <button onClick={() => { logout(); setMenuOpen(false) }} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 hover:bg-green-50 hover:text-green-700">
                  <User size={16} />
                  {user.name.split(" ")[0]}
                </button>
              ) : (
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-green-700 px-3 text-sm font-bold text-white hover:bg-green-800">
                  <Settings size={16} />
                  Login
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
