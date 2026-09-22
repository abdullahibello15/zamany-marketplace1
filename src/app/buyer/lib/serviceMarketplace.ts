export type ServiceIconName = "stethoscope" | "heart-pulse" | "hotel" | "bike" | "zap" | "wrench" | "sparkles" | "car" | "graduation-cap" | "scissors" | "camera" | "party-popper" | "chef-hat" | "hammer" | "paintbrush" | "shirt" | "dumbbell" | "paw-print" | "scale" | "house"

export interface ServiceProvider {
  id: string
  name: string
  avatar: string
  categoryId: string
  location: string
  rating: number
  reviewCount: number
  specialty: string
  rate: number
  address: string
  phone: string
  additionalServices: string[]
  gallery: Array<{ image: string; caption?: string }>
  description: string
  availability: string
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: ServiceIconName
  keywords: string[]
}

export const serviceCategories: ServiceCategory[] = [
  { id: "mobile-doctor", name: "Mobile Doctor", description: "In-home and on-call consultations", icon: "stethoscope", keywords: ["doctor", "medical", "consultation", "home visit"] },
  { id: "nurse", name: "Nurse", description: "In-home nursing care", icon: "heart-pulse", keywords: ["nurse", "nursing", "caregiver", "care"] },
  { id: "hotel-booking", name: "Hotel Booking", description: "Book trusted local stays", icon: "hotel", keywords: ["hotel", "accommodation", "room", "stay"] },
  { id: "dispatch", name: "Dispatch Rider", description: "Reliable delivery and courier service", icon: "bike", keywords: ["dispatch", "rider", "courier", "delivery"] },
  { id: "electrician", name: "Electrician", description: "Electrical installation and repairs", icon: "zap", keywords: ["electrician", "electrical", "wiring"] },
  { id: "plumber", name: "Plumber", description: "Plumbing repairs and installation", icon: "wrench", keywords: ["plumber", "plumbing", "pipes"] },
  { id: "cleaner", name: "Cleaning", description: "Home and office housekeeping", icon: "sparkles", keywords: ["cleaner", "cleaning", "housekeeping"] },
  { id: "mechanic", name: "Mechanic", description: "Auto repair and servicing", icon: "car", keywords: ["mechanic", "auto repair", "car service"] },
  { id: "tutor", name: "Tutor", description: "Home and online teaching", icon: "graduation-cap", keywords: ["tutor", "teacher", "lessons"] },
  { id: "hairdresser", name: "Hairdresser & Barber", description: "At-home grooming and styling", icon: "scissors", keywords: ["hairdresser", "barber", "hair", "grooming"] },
  { id: "photographer", name: "Photographer", description: "Portraits and event photography", icon: "camera", keywords: ["photographer", "photo", "video"] },
  { id: "event-planner", name: "Event Planner", description: "Plan memorable celebrations", icon: "party-popper", keywords: ["event", "planner", "wedding"] },
  { id: "caterer", name: "Caterer & Chef", description: "Meals and event catering", icon: "chef-hat", keywords: ["caterer", "chef", "food"] },
  { id: "carpenter", name: "Carpenter", description: "Furniture and woodwork", icon: "hammer", keywords: ["carpenter", "woodwork", "furniture"] },
  { id: "painter", name: "Painter", description: "Interior and exterior painting", icon: "paintbrush", keywords: ["painter", "painting", "decor"] },
  { id: "laundry", name: "Laundry Service", description: "Wash, iron, and delivery", icon: "shirt", keywords: ["laundry", "washing", "ironing"] },
  { id: "fitness-trainer", name: "Fitness Trainer", description: "Personal fitness coaching", icon: "dumbbell", keywords: ["fitness", "trainer", "workout"] },
  { id: "pet-care", name: "Pet Care", description: "Pet sitting and grooming", icon: "paw-print", keywords: ["pet", "pet sitting", "grooming"] },
  { id: "legal-consultant", name: "Legal Consultant", description: "Professional legal guidance", icon: "scale", keywords: ["legal", "lawyer", "consultant"] },
  { id: "real-estate-agent", name: "Real Estate Agent", description: "Find, rent, or sell property", icon: "house", keywords: ["real estate", "property", "agent"] },
]

const providerNames = ["Amina Ibrahim", "David Musa", "Fatima Sule", "Ibrahim Yusuf", "Zainab Bello"]
const providerPhotos = ["1507003211169-0a1dd7228f2d", "1494790108377-be9c29b29330", "1472099645785-5658abf4ff4e", "1534528741775-53994a69daeb", "1500648767791-00dcc994a43e"]
const providerLocations = ["Bosso", "Bida", "Chanchaga", "Suleja", "Lavun"]

export const serviceProviders: ServiceProvider[] = serviceCategories.flatMap((category, categoryIndex) => [0, 1, 2].map((providerIndex) => {
  const index = categoryIndex * 3 + providerIndex
  const location = providerLocations[index % providerLocations.length]
  return {
    id: `sp_${category.id}_${providerIndex + 1}`,
    name: providerNames[index % providerNames.length],
    avatar: `https://images.unsplash.com/photo-${providerPhotos[index % providerPhotos.length]}?w=160&h=160&fit=crop&auto=format`,
    categoryId: category.id,
    location,
    rating: 4.4 + (index % 6) / 10,
    reviewCount: 12 + index * 7,
    specialty: `${category.name} — ${providerIndex === 0 ? "General Practice" : providerIndex === 1 ? "Home Service" : "Priority Service"}`,
    rate: 3500 + (categoryIndex % 6) * 2500 + providerIndex * 1000,
    address: `${14 + providerIndex}, ${location} Central District, Niger State`,
    phone: `+234 803 555 ${String(1000 + index).slice(-4)}`,
    additionalServices: [category.description, providerIndex === 0 ? "Same-day bookings" : "Scheduled appointments"],
    gallery: providerIndex === 2 ? [] : [
      { image: `https://images.unsplash.com/photo-${["1581578731548-c64695cc6952", "1556761175-b413da4baf72", "1486406146926-c627a92ad1ab", "1551830820-330a71b99659"][categoryIndex % 4]}?w=900&h=700&fit=crop&auto=format`, caption: providerIndex === 0 ? "Completed client appointment" : "Recent work for a local client" },
      { image: `https://images.unsplash.com/photo-${["1516321318423-f06f85e504b3", "1581091226825-a6a2a5aee158", "1497366754035-f200968a6e72", "1524758631624-e2822e304c36"][categoryIndex % 4]}?w=900&h=700&fit=crop&auto=format`, caption: "Finished project" },
    ],
    description: category.description,
    availability: providerIndex === 0 ? "Available now" : providerIndex === 1 ? "Available today" : "Busy — next slot tomorrow",
  }
}))

export function getServiceProviderCount(categoryId: string) {
  return serviceProviders.filter((provider) => provider.categoryId === categoryId).length
}
