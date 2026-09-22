import { Heart, MapPin, ShoppingCart } from "lucide-react"
import { Link } from "react-router"
import { useBuyer } from "../lib/BuyerContext"
import type { BuyerProduct } from "../lib/buyerTypes"
import { BuyerPrice } from "./BuyerPrice"
import { BuyerRating } from "./BuyerRating"

export function BuyerProductCard({ product }: { product: BuyerProduct }) {
  const { addToCart, toggleWishlist, wishlist } = useBuyer()
  const wished = wishlist.includes(product.id)

  return (
    <article className="overflow-hidden rounded-xl border border-green-100 bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-square bg-green-50">
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
        </div>
      </Link>
      <div className="space-y-3 p-3">
        <div>
          <Link to={`/products/${product.id}`} className="line-clamp-2 font-bold text-gray-900 hover:text-green-700">
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} />
            {product.location}
          </div>
        </div>
        <Link to={`/profiles/${product.vendor.id}`} className="flex items-center gap-2 rounded-xl text-sm text-gray-600 hover:text-green-700">
          <img src={product.vendor.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
          <span className="truncate font-semibold">{product.vendor.name}</span>
        </Link>
        <BuyerRating rating={product.rating} count={product.reviewCount} size={12} />
        <BuyerPrice price={product.price} originalPrice={product.originalPrice} compact />
        <div className="flex gap-2">
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-700 px-3 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={14} />
            Add
          </button>
          <button
            onClick={() => void toggleWishlist(product.id)}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${wished ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 text-green-700 hover:bg-green-50"}`}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} className={wished ? "fill-red-500" : ""} />
          </button>
        </div>
      </div>
    </article>
  )
}
