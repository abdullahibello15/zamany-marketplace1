import { useEffect, useMemo, useState } from "react"
import { Bike, Camera, Car, ChefHat, Dumbbell, GraduationCap, Hammer, HeartPulse, Hotel, House, Paintbrush, PartyPopper, PawPrint, Scale, Scissors, Shirt, SlidersHorizontal, Sparkles, Stethoscope, Wrench, Zap } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { AppEmptyState, AppErrorState, AppLoadingState } from "../../shared/components/AppStates"
import { appInputClass, appSelectClass } from "../../shared/components/AppForm"
import { buyerApi } from "../lib/buyerApi"
import type { BuyerCategory, BuyerProduct, ProductQuery } from "../lib/buyerTypes"
import { BuyerProductCard } from "../components/BuyerProductCard"
import { BuyerServiceProviderCard } from "../components/BuyerServiceProviderCard"
import { getServiceProviderCount, serviceCategories, serviceProviders, type ServiceIconName } from "../lib/serviceMarketplace"

const lgas = ["", "Bida", "Bosso", "Chanchaga", "Lavun", "Suleja"]

const serviceIcons: Record<ServiceIconName, typeof Stethoscope> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, hotel: Hotel, bike: Bike, zap: Zap, wrench: Wrench,
  sparkles: Sparkles, car: Car, "graduation-cap": GraduationCap, scissors: Scissors, camera: Camera,
  "party-popper": PartyPopper, "chef-hat": ChefHat, hammer: Hammer, paintbrush: Paintbrush, shirt: Shirt,
  dumbbell: Dumbbell, "paw-print": PawPrint, scale: Scale, house: House,
}

export function BuyerMarketplacePage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<BuyerProduct[]>([])
  const [categories, setCategories] = useState<BuyerCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const query = useMemo<ProductQuery>(() => ({
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    lga: params.get("lga") || undefined,
    minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
    maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    sort: (params.get("sort") as ProductQuery["sort"]) || "featured",
  }), [params])
  const serviceQuery = (params.get("service") || "").toLowerCase()
  const selectedServiceCategory = serviceCategories.find((category) => category.id === serviceQuery)
  const searchTerm = (params.get("q") || "").toLowerCase()
  const visibleServiceCategories = serviceCategories.filter((category) => !searchTerm || [category.name, category.description, ...category.keywords].join(" ").toLowerCase().includes(searchTerm))
  const visibleProviders = serviceProviders.filter((provider) => {
    const category = serviceCategories.find((item) => item.id === provider.categoryId)
    return (!serviceQuery || provider.categoryId === serviceQuery)
      && (!searchTerm || `${provider.name} ${provider.specialty} ${provider.description} ${category?.name ?? ""} ${category?.keywords.join(" ") ?? ""}`.toLowerCase().includes(searchTerm))
      && (!query.lga || provider.location === query.lga)
      && (!query.minRating || provider.rating >= query.minRating)
      && (!query.maxPrice || provider.rate <= query.maxPrice)
  })

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const [nextProducts, nextCategories] = await Promise.all([
        buyerApi.listProducts(query),
        buyerApi.listCategories(),
      ])
      setProducts(nextProducts)
      setCategories(nextCategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load marketplace")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [query.q, query.category, query.lga, query.minRating, query.maxPrice, query.sort])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-6"><AppLoadingState label="Loading marketplace" /></div>
  if (error) return <div className="mx-auto max-w-7xl px-4 py-6"><AppErrorState body={error} onRetry={load} /></div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-xl bg-green-800 text-white">
          <div className="grid min-h-64 md:grid-cols-2">
            <div className="flex flex-col justify-center p-6 md:p-8">
              <p className="text-sm font-bold text-green-200">Zamani Marketplace</p>
              <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">Shop verified local vendors across every LGA.</h1>
              <p className="mt-3 max-w-xl text-sm text-green-100">Browse products, compare vendors, save favorites, and check out with a cart that keeps each seller clear.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1543168256-418811576931?w=900&h=620&fit=crop&auto=format" alt="Marketplace goods" className="h-full min-h-48 w-full object-cover" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {categories.slice(0, 4).map((category) => (
            <button
              key={category.id}
              onClick={() => setFilter("category", category.id)}
              className={`overflow-hidden rounded-xl border text-left ${query.category === category.id ? "border-green-700 ring-2 ring-green-200" : "border-green-100"}`}
            >
              <img src={category.image} alt="" className="h-24 w-full object-cover" />
              <div className="bg-white p-3">
                <p className="font-bold text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500">{category.count} listings</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-xl border border-green-100 bg-white p-4">
          <div className="mb-4 flex items-center gap-2 font-black text-gray-900">
            <SlidersHorizontal size={17} />
            Filters
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:block lg:space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Category</span>
              <select value={query.category ?? ""} onChange={(event) => setFilter("category", event.target.value)} className={appSelectClass}>
                <option value="">All categories</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">LGA</span>
              <select value={query.lga ?? ""} onChange={(event) => setFilter("lga", event.target.value)} className={appSelectClass}>
                {lgas.map((lga) => <option key={lga} value={lga}>{lga || "All LGAs"}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Max price</span>
              <input value={query.maxPrice ?? ""} onChange={(event) => setFilter("maxPrice", event.target.value)} type="number" className={appInputClass} placeholder="Any price" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Minimum rating</span>
              <select value={query.minRating ?? ""} onChange={(event) => setFilter("minRating", event.target.value)} className={appSelectClass}>
                <option value="">Any rating</option>
                <option value="4">4 stars and up</option>
                <option value="4.5">4.5 stars and up</option>
              </select>
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">{query.q ? `Results for "${query.q}"` : "Featured products"}</h2>
              <p className="text-sm text-gray-500">{products.length} items available</p>
            </div>
            <select value={query.sort ?? "featured"} onChange={(event) => setFilter("sort", event.target.value)} className={`${appSelectClass} md:w-52`}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => <BuyerProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <AppEmptyState title="No products found" body="Try a different search, category, LGA, or price range." />
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-green-100 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-green-700">Services marketplace</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900">Find anything you need, from home.</h2>
            <p className="mt-1 text-sm text-gray-500">Browse trusted local professionals, stays, and delivery services.</p>
          </div>
          <label className="block md:w-80">
            <span className="sr-only">Search services</span>
            <input value={params.get("q") ?? ""} onChange={(event) => setFilter("q", event.target.value)} className={appInputClass} placeholder="Search doctors, dispatch, tutors..." />
          </label>
        </div>

        {visibleServiceCategories.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {visibleServiceCategories.map((category) => {
              const Icon = serviceIcons[category.icon]
              const providerCount = getServiceProviderCount(category.id)
              return <button key={category.id} onClick={() => setFilter("service", category.id)} className={`rounded-xl border p-4 text-left transition-colors hover:border-green-400 hover:bg-green-50 ${serviceQuery === category.id ? "border-green-700 bg-green-50 ring-2 ring-green-200" : "border-green-100 bg-white"}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><Icon size={20} /></div>
                <p className="mt-3 font-bold text-gray-900">{category.name}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{category.description}</p>
                <p className="mt-2 text-xs font-bold text-green-700">{providerCount} provider{providerCount === 1 ? "" : "s"} available</p>
              </button>
            })}
          </div>
        )}

        {serviceQuery && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h3 className="font-black text-gray-900">{selectedServiceCategory?.name} providers</h3><p className="text-sm text-gray-500">{visibleProviders.length} providers available</p></div>
              <button onClick={() => setFilter("service", "")} className="text-sm font-bold text-green-700 hover:text-green-800">View all services</button>
            </div>
            <div className="mb-4 grid gap-3 rounded-xl bg-green-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
              <label><span className="mb-1 block text-xs font-bold text-gray-700">Profession</span><select value={serviceQuery} onChange={(event) => setFilter("service", event.target.value)} className={appSelectClass}>{serviceCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-gray-700">LGA</span><select value={query.lga ?? ""} onChange={(event) => setFilter("lga", event.target.value)} className={appSelectClass}>{lgas.map((lga) => <option key={lga} value={lga}>{lga || "All LGAs"}</option>)}</select></label>
              <label><span className="mb-1 block text-xs font-bold text-gray-700">Max price</span><input value={query.maxPrice ?? ""} onChange={(event) => setFilter("maxPrice", event.target.value)} type="number" className={appInputClass} placeholder="Any price" /></label>
              <label><span className="mb-1 block text-xs font-bold text-gray-700">Minimum rating</span><select value={query.minRating ?? ""} onChange={(event) => setFilter("minRating", event.target.value)} className={appSelectClass}><option value="">Any rating</option><option value="4">4 stars and up</option><option value="4.5">4.5 stars and up</option></select></label>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleProviders.map((provider) => <BuyerServiceProviderCard key={provider.id} provider={provider} />)}
            </div>
            {visibleProviders.length === 0 && <AppEmptyState title="No providers found" body="Try a different LGA, price, or rating filter." />}
          </div>
        )}
      </section>
    </div>
  )
}
