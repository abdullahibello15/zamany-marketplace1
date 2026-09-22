import { MapPin, MessageCircle, Star } from "lucide-react"
import { Link, useParams } from "react-router"
import { AppEmptyState } from "../../shared/components/AppStates"
import { buyerProductsSeed } from "../lib/buyerMockData"
import { serviceCategories, serviceProviders } from "../lib/serviceMarketplace"
import { BuyerProductCard } from "../components/BuyerProductCard"
import { BuyerProviderWorkGallery } from "../components/BuyerProviderWorkGallery"
import { formatNaira } from "../../shared/lib/format"

export function BuyerProviderProfilePage() {
  const { id } = useParams()
  const provider = serviceProviders.find((item) => item.id === id)
  const products = buyerProductsSeed.filter((product) => product.vendor.id === id)
  const seller = products[0]?.vendor
  const category = provider ? serviceCategories.find((item) => item.id === provider.categoryId) : undefined

  if (!provider && !seller) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><AppEmptyState title="Profile not found" body="This seller or provider may no longer be active." action={<Link to="/products" className="text-sm font-bold text-green-700">Return to marketplace</Link>} /></div>
  }

  const name = provider?.name ?? seller!.name
  const avatar = provider?.avatar ?? seller!.avatar
  const location = provider?.location ?? seller!.location
  const rating = provider?.rating ?? seller!.rating
  const reviewCount = provider?.reviewCount ?? products.reduce((total, product) => total + product.reviewCount, 0)
  const profession = category?.name ?? "Marketplace seller"
  const vendorCategories = [...new Set(products.map((product) => product.category))]
  const lowestPrice = Math.min(...products.map((product) => product.price))
  const highestPrice = Math.max(...products.map((product) => product.price))
  const vendorSummary = products.length ? `${vendorCategories.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(", ")} — Home Delivery · ${formatNaira(lowestPrice)}${lowestPrice !== highestPrice ? `–${formatNaira(highestPrice)}` : ""}` : "Marketplace seller"

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="rounded-xl border border-green-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <img src={avatar} alt={name} className="h-24 w-24 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-green-700">{provider ? profession : vendorCategories[0]?.charAt(0).toUpperCase() + vendorCategories[0]?.slice(1) || "Vendor"}</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">{name}</h1>
            <p className="mt-1 text-sm text-gray-600">{provider ? `${provider.specialty} · ${formatNaira(provider.rate)} per session / booking` : vendorSummary}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1"><MapPin size={14} />{location}</span>
              <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" />{rating.toFixed(1)} ({reviewCount} reviews)</span>
            </div>
          </div>
          <button disabled title="Messaging is not available yet" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white opacity-60" aria-label={`Chat with ${name}`}>
            <MessageCircle size={16} />Chat
          </button>
        </div>
      </section>

      {provider && <section className="mt-6"><h2 className="text-xl font-black text-gray-900">Active services</h2><article className="mt-4 rounded-xl border border-green-100 bg-white p-4"><p className="font-bold text-gray-900">{category?.name}</p><p className="mt-1 text-sm text-gray-600">{provider.description}</p><p className="mt-3 text-sm font-semibold text-green-700">{provider.availability}</p><p className="mt-3 text-sm text-gray-600"><strong>Address:</strong> {provider.address}</p><p className="mt-1 text-sm text-gray-600"><strong>Public phone:</strong> {provider.phone}</p><div className="mt-4"><p className="text-sm font-bold text-gray-900">Also offers</p><ul className="mt-1 space-y-1 text-sm text-gray-600">{provider.additionalServices.map((service) => <li key={service}>{service}</li>)}</ul></div></article></section>}
      {provider && <BuyerProviderWorkGallery items={provider.gallery} />}
      {!provider && products.length > 0 && <>
        <section className="mt-6"><h2 className="text-xl font-black text-gray-900">Active listings</h2><div className="mt-4 rounded-xl border border-green-100 bg-white p-4 space-y-4">{products.map((product) => <article key={product.id} className="border-b border-green-50 pb-4 last:border-0 last:pb-0"><div className="flex gap-3"><img src={product.images[0]} alt={product.name} className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold text-gray-900">{product.name}</p><p className="mt-1 line-clamp-2 text-sm text-gray-600">{product.description}</p><div className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-green-700">{product.inStock ? `${product.stock} in stock` : "Out of stock"}</span><span className="font-black text-green-700">{formatNaira(product.price)}</span></div></div></div></article>)}<p className="pt-1 text-sm text-gray-600"><strong>Address:</strong> {location}, Niger State</p><p className="text-sm text-gray-600"><strong>Public phone:</strong> {seller!.phone}</p><div><p className="text-sm font-bold text-gray-900">Also offers</p><p className="mt-1 text-sm text-gray-600">{vendorCategories.join(", ")}</p></div></div></section>
        <section className="mt-8"><h2 className="text-xl font-black text-gray-900">Browse listings</h2><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <BuyerProductCard key={product.id} product={product} />)}</div></section>
      </>}
    </div>
  )
}
