import { MapPin, Star } from "lucide-react"
import { Link } from "react-router"
import { formatNaira } from "../../shared/lib/format"
import type { ServiceProvider } from "../lib/serviceMarketplace"

export function BuyerServiceProviderCard({ provider }: { provider: ServiceProvider }) {
  return (
    <Link to={`/profiles/${provider.id}`} className="block rounded-xl border border-green-100 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <img src={provider.avatar} alt={provider.name} className="h-14 w-14 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gray-900">{provider.name}</p>
          <p className="mt-0.5 text-sm text-green-700">{provider.specialty}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} />{provider.location}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="flex items-center gap-1 text-sm font-semibold text-gray-700"><Star size={14} className="fill-amber-400 text-amber-400" />{provider.rating.toFixed(1)} <span className="font-normal text-gray-500">({provider.reviewCount})</span></span>
        <span className="text-sm font-black text-green-700">{formatNaira(provider.rate)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-gray-500">Per session / booking</span><span className="font-bold text-green-700">{provider.availability}</span></div>
    </Link>
  )
}
