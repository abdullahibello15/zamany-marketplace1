import { useState } from "react"
import { X } from "lucide-react"

interface GalleryItem {
  image: string
  caption?: string
}

export function BuyerProviderWorkGallery({ items }: { items: GalleryItem[] }) {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null)

  return (
    <section className="mt-6">
      <h2 className="text-xl font-black text-gray-900">Work Gallery</h2>
      <div className="mt-4 rounded-xl border border-green-100 bg-white p-4">
        {items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => <button key={item.image} onClick={() => setActiveItem(item)} className="group overflow-hidden rounded-xl text-left">
              <img src={item.image} alt={item.caption ?? "Provider work"} className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105" />
              {item.caption && <p className="bg-green-50 px-3 py-2 text-sm font-medium text-gray-700">{item.caption}</p>}
            </button>)}
          </div>
        ) : <p className="py-6 text-center text-sm text-gray-500">No work photos added yet.</p>}
      </div>

      {activeItem && <div role="dialog" aria-modal="true" aria-label="Work photo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setActiveItem(null)}>
        <div className="relative max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
          <button onClick={() => setActiveItem(null)} className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow" aria-label="Close photo"><X size={20} /></button>
          <img src={activeItem.image} alt={activeItem.caption ?? "Provider work"} className="max-h-[80vh] max-w-full rounded-xl object-contain" />
          {activeItem.caption && <p className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-gray-700">{activeItem.caption}</p>}
        </div>
      </div>}
    </section>
  )
}
