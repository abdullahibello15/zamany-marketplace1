import React, { useState, useContext, createContext, useEffect, useRef } from "react"
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"
import {
  ShoppingCart, Heart, Search, Menu, X, ChevronDown, ChevronRight, ChevronLeft,
  Star, MapPin, Phone, Mail, Package, Truck, CheckCircle, User, Settings,
  LogOut, Bell, Grid, List, Filter, Plus, Minus, Trash2, Edit,
  BarChart2, ShoppingBag, ArrowRight, Globe, TrendingUp, Users, Store,
  Tag, Award, Shield, MessageCircle, Home, Zap, ChevronUp,
  Check, CreditCard, Eye, Lock, Leaf, AlertCircle, Upload, FileText
} from "lucide-react"
import VendorModule from "./vendor/VendorModule"
import BuyerModule from "./buyer/BuyerModule"
import { ApiError, authService, getTokens, restoreSession } from "./api"

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "ha"
type UserRole = "buyer" | "seller" | "admin"

interface Product {
  id: string; name: string; nameHa: string; price: number; originalPrice?: number
  images: string[]; category: string; location: string; lga: string
  seller: string; sellerId: string; rating: number; reviews: number
  description: string; inStock: boolean; tags: string[]
  subcategory?: string; priceLabel?: string
}

interface Seller {
  id: string; name: string; avatar: string; banner: string; location: string
  lga: string; rating: number; totalSales: number; products: number
  verified: boolean; joined: string; description: string; phone: string
}

interface CartItem extends Product { quantity: number }

interface AppCtx {
  lang: Lang; setLang: (l: Lang) => void
  cart: CartItem[]; addToCart: (p: Product) => void
  removeFromCart: (id: string) => void; updateQty: (id: string, q: number) => void
  cartTotal: number; cartCount: number
  wishlist: string[]; toggleWishlist: (id: string) => void
  isLoggedIn: boolean; setIsLoggedIn: (v: boolean) => void
  user: { name: string; role: UserRole } | null
  setUser: (u: { name: string; role: UserRole } | null) => void
  searchQ: string; setSearchQ: (q: string) => void
  currentSellerId: string | null; setCurrentSellerId: (id: string | null) => void
  sellerData: Seller | null; setSellerData: (s: Seller | null) => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LGAS = [
  "Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako",
  "Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga",
  "Mashegu","Mokwa","Munya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"
]

const CATEGORIES = [
  { id:"food",       name:"Provisions & Groceries",           nameHa:"Kayan Abinci",           icon:"🛒",  img:"https://images.unsplash.com/photo-1543168256-418811576931?w=400&h=260&fit=crop&auto=format", count:456 },
  { id:"fashion",    name:"Boutiques & Ready-to-Wear",        nameHa:"Rumfar Kaya",            icon:"👔",  img:"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=260&fit=crop&auto=format", count:312 },
  { id:"electronics",name:"Electronics & Phones",             nameHa:"Na'urori & Wayoyi",      icon:"📱",  img:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=260&fit=crop&auto=format", count:267 },
  { id:"agriculture",name:"Agricultural Inputs & Produce",    nameHa:"Kayan Noma",             icon:"🌾",  img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=260&fit=crop&auto=format", count:523 },
  { id:"furniture",  name:"Furniture & Home Goods",           nameHa:"Kayan Gida",             icon:"🛋️", img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=260&fit=crop&auto=format", count:178 },
  { id:"crafts",     name:"Pottery & Craft",                  nameHa:"Tukwane & Sana'a",       icon:"🏺",  img:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=260&fit=crop&auto=format", count:245 },
  { id:"services",   name:"Services",                         nameHa:"Ayyuka",                 icon:"🔧",  img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=260&fit=crop&auto=format", count:210 },
  { id:"fabric",     name:"Fabric & Textile",                 nameHa:"Auduga & Zare",          icon:"🧵", img:"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=260&fit=crop&auto=format", count:156 },
  { id:"building",   name:"Building Materials & Hardware",    nameHa:"Kayan Gini",             icon:"🔨", img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=260&fit=crop&auto=format", count:234 },
  { id:"pharmacy",   name:"Pharmacy & Medicine",              nameHa:"Magani",                 icon:"💊", img:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=260&fit=crop&auto=format", count:89 },
  { id:"realestate", name:"Real Estate",                      nameHa:"Gidaje",                 icon:"🏠",  img:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=260&fit=crop&auto=format", count:89  },
]

const SERVICE_SUBCATEGORIES = [
  { id:"tailoring",      name:"Tailoring & Fashion",        nameHa:"Dinki & Kayan Sawa",     icon:"✂️" },
  { id:"plumbing",       name:"Plumbing",                   nameHa:"Famfo",                  icon:"🔧" },
  { id:"electrical",     name:"Electrical",                 nameHa:"Lantarki",               icon:"⚡" },
  { id:"carpentry",      name:"Carpentry & Furniture",      nameHa:"Kafinta",                icon:"🪵" },
  { id:"masonry",        name:"Masonry & Construction",     nameHa:"Ginin Gida",             icon:"🧱" },
  { id:"welding",        name:"Welding & Fabrication",      nameHa:"Ƙira",                   icon:"🔩" },
  { id:"auto",           name:"Auto Mechanics",             nameHa:"Gyara Mota",             icon:"🚗" },
  { id:"keke",           name:"Motorcycle/Keke Repair",     nameHa:"Gyara Keke",             icon:"🛵" },
  { id:"phonerepair",    name:"Phone & Electronics Repair", nameHa:"Gyara Wayoyi",           icon:"📱" },
  { id:"refrigeration",  name:"Refrigeration & AC",         nameHa:"Sanyi da AC",            icon:"❄️" },
  { id:"beauty",         name:"Hair & Beauty",              nameHa:"Aski da Kyau",           icon:"💇" },
  { id:"catering",       name:"Catering & Events",          nameHa:"Dafa Abinci",            icon:"🍽️" },
  { id:"laundry",        name:"Laundry & Dry Cleaning",     nameHa:"Wanki",                  icon:"👕" },
  { id:"cleaning",       name:"Cleaning Services",          nameHa:"Tsabtace",               icon:"🧹" },
  { id:"shoe",           name:"Shoe & Leather Repair",      nameHa:"Takalmi",                icon:"👟" },
  { id:"tutoring",       name:"Tutoring & Lessons",         nameHa:"Koyarwa",                icon:"📚" },
  { id:"generator",      name:"Generator & Solar Tech",     nameHa:"Injin Lantarki",         icon:"⚙️" },
  { id:"borehole",       name:"Borehole & Water Services",  nameHa:"Hakowa Rijiya",          icon:"💧" },
  { id:"legal",          name:"Legal Services",             nameHa:"Lauyoyi",                icon:"⚖️" },
  { id:"accounting",     name:"Accounting & Tax",           nameHa:"Akanta & Haraji",        icon:"📊" },
  { id:"clinic",         name:"Clinics & Diagnostics",      nameHa:"Asibiti",                icon:"🏥" },
  { id:"eventplanning",  name:"Event Planning",             nameHa:"Tsarin Biki",            icon:"🎪" },
  { id:"propertymanagement", name:"Property Management",   nameHa:"Kula da Gini",           icon:"🏘️" },
]

const PRODUCTS: Product[] = [
  { id:"p1",  name:"Bida Brasswork Vase",          nameHa:"Kwano na Tagulla na Bida",       price:8500,   originalPrice:12000,  images:["https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=700&h=700&fit=crop&auto=format","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=700&fit=crop&auto=format"],    category:"crafts",     location:"Bida",      lga:"Bida",      seller:"Bida Craft Hub",    sellerId:"s1", rating:4.8, reviews:124, description:"Authentic hand-crafted brasswork vase from the renowned artisans of Bida. Each piece is uniquely crafted using centuries-old techniques passed down through generations of Nupe craftsmen. Perfect as home décor or cultural gifts.",                           inStock:true,  tags:["brasswork","nupe","handmade","bida","craft"] },
  { id:"p2",  name:"Nupe Hand-Woven Fabric (6yds)",nameHa:"Auduga Mai Saƙa na Nupe (Gaz 6)",price:15000,  originalPrice:18500,  images:["https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=700&fit=crop&auto=format"],                                                                                                                                                category:"fashion",    location:"Bida",      lga:"Bida",      seller:"Nupe Weave Co.",    sellerId:"s2", rating:4.9, reviews:89,  description:"Premium 6-yard Nupe hand-woven fabric in traditional Nupe patterns. Perfect for Aso-ebi, traditional attire, and cultural events. Available in multiple colour combinations including royal blue, red, and gold.",                                              inStock:true,  tags:["nupe","fabric","traditional","handwoven","aso-ebi"] },
  { id:"p3",  name:"Niger Local Rice (50kg Bag)",  nameHa:"Shinkafa ta Niger (50kg)",        price:38000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"food",       location:"Lavun",     lga:"Lavun",     seller:"Niger Farm Direct", sellerId:"s3", rating:4.6, reviews:203, description:"Fresh locally grown Nigerian parboiled rice from Lavun LGA farms. No additives, farm-fresh, hygienically packed. Minimum order: 1 bag (50kg). Delivery available across Niger State within 48 hours.",                                                  inStock:true,  tags:["rice","food","local","farm","groceries"] },
  { id:"p4",  name:"Samsung Galaxy A55 (256GB)",   nameHa:"Wayar Samsung Galaxy A55 (256GB)",price:285000, originalPrice:320000, images:["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"electronics",location:"Minna",     lga:"Bosso",     seller:"Minna Tech Store",  sellerId:"s4", rating:4.7, reviews:56,  description:"Brand new Samsung Galaxy A55 5G with 256GB storage, 8GB RAM. 50MP main camera, 5000mAh battery. Comes with 1 year manufacturer warranty. Available for pickup in Minna or delivery across Niger State.",                                                    inStock:true,  tags:["samsung","phone","android","electronics","mobile"] },
  { id:"p5",  name:"Fresh Yam Tubers (100kg)",     nameHa:"Doya Sabo (100kg)",               price:25000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"agriculture",location:"Kontagora",lga:"Kontagora",  seller:"Kontagora Farms",   sellerId:"s5", rating:4.5, reviews:312, description:"Premium quality yam tubers harvested fresh from Kontagora farms. Suitable for boiling, pounding, and yam porridge. Delivery available across Niger State within 24 hours of order.",                                                                    inStock:true,  tags:["yam","food","farm","agriculture","fresh"] },
  { id:"p6",  name:"Minna–Lagos Bus Ticket",       nameHa:"Tikitin Bas Minna–Lagos",         price:7500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services",   location:"Minna",     lga:"Chanchaga",seller:"Niger State Express",sellerId:"s6", rating:4.3, reviews:445, description:"Premium air-conditioned bus service from Minna to Lagos. Departures daily at 6AM and 8PM. Online booking with seat selection. Refreshments included.",                                                                                                  inStock:true,  tags:["transport","bus","travel","service","ticket"] },
  { id:"p7",  name:"Modern Sofa Set (3+1+1)",      nameHa:"Kujerar Zaure (3+1+1)",           price:195000, originalPrice:240000, images:["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&h=700&fit=crop&auto=format"],                                                                                                                                                category:"furniture",  location:"Suleja",    lga:"Suleja",    seller:"Suleja Home Depot", sellerId:"s7", rating:4.4, reviews:38,  description:"Premium 3+1+1 modern sofa set with high-density foam cushioning. Available in grey, brown, and cream. Free delivery within Suleja. Assembly included. Stain-resistant fabric.",                                                                             inStock:true,  tags:["sofa","furniture","living room","modern","home"] },
  { id:"p8",  name:"2-Bedroom Flat (Minna)",       nameHa:"Gida mai Dakuna Biyu (Minna)",    price:350000, originalPrice:undefined,images:["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"realestate", location:"Minna",     lga:"Bosso",     seller:"Niger Homes Agency",sellerId:"s8", rating:4.6, reviews:12,  description:"Clean 2-bedroom flat in serene Bosso, Minna. Running water, 24/7 electricity with solar backup, tiled floors, and 24hr security. Annual rent: ₦350,000. Short-term leases available.",                                                                     inStock:true,  tags:["rent","flat","minna","accommodation","housing"] },
  { id:"p9",  name:"Fresh Tomatoes (Full Basket)", nameHa:"Tomatoes Sabo (Kwandon Cike)",    price:8500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"food",       location:"Lapai",     lga:"Lapai",     seller:"Lapai Fresh Market",sellerId:"s3", rating:4.4, reviews:178, description:"Fresh farm tomatoes from Lapai. Ripened naturally on the vine. One full basket approximately 30–35kg. Order by 6PM for next-day delivery to Minna and nearby LGAs.",                                                                               inStock:true,  tags:["tomatoes","food","fresh","vegetables","market"] },
  { id:"p10", name:"Hausa Cap & Babbar Riga Set",  nameHa:"Tufafin Hausa (Cap da Riga)",     price:12500,  originalPrice:16000,  images:["https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"fashion",    location:"Minna",     lga:"Chanchaga",seller:"Minna Fashion House",sellerId:"s9", rating:4.7, reviews:91,  description:"Premium handmade Hausa cap set (cap + babbar riga) in fine embroidered fabric. Available in white, cream, sky blue, and green. Perfect for Sallah celebrations and traditional events.",                                                                    inStock:true,  tags:["cap","hausa","traditional","fashion","riga"] },
  { id:"p11", name:"Solar Panel System (500W)",    nameHa:"Wutar Rana (500W)",               price:185000, originalPrice:undefined,images:["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=700&h=700&fit=crop&auto=format"],                                                                                                                                            category:"electronics",location:"Minna",     lga:"Bosso",     seller:"Minna Tech Store",  sellerId:"s4", rating:4.8, reviews:67,  description:"Complete 500W solar panel system with inverter, 200Ah batteries, and full installation support. Enough to power essential home appliances. Free installation within Minna metropolis.",                                                                        inStock:true,  tags:["solar","energy","electronics","power","renewable"] },
  { id:"p12", name:"Groundnut Oil (25 Litres)",    nameHa:"Mai Gyada (Lita 25)",             price:21000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=700&h=700&fit=crop&auto=format"],                                                                                                                                            category:"food",       location:"Bida",      lga:"Bida",      seller:"Niger Farm Direct", sellerId:"s3", rating:4.6, reviews:256, description:"Pure cold-pressed groundnut oil from Niger State farms. No additives or preservatives. 25-litre jerrycan. Great for cooking, frying, and salad dressing. Direct from the press.",                                                                          inStock:true,  tags:["oil","groundnut","cooking","food","natural"] },
  { id:"p13", name:"Custom Kaftan Tailoring",      nameHa:"Dinki Agbada na Jiya",            price:8000,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"tailoring", location:"Minna",     lga:"Chanchaga",seller:"Minna Beauty & Bridal",sellerId:"s16", rating:4.6, reviews:87,  description:"Professional custom tailoring for traditional and modern kaftan, agbada, and embroidered wear. Expert embroidery work available. Consultation and fitting included. 2-week turnaround.",                                                           inStock:true,  tags:["tailoring","kaftan","embroidery","custom","fashion"] },
  { id:"p14", name:"Plumbing Pipe & Fitting Repair", nameHa:"Gyara Famfo da Koyarwa",        price:12000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1581092162562-40038f56c17f?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"plumbing", location:"Minna",     lga:"Chanchaga",seller:"Minna Plumb & Pipe Works", sellerId:"s10", rating:4.7, reviews:156, description:"Professional plumbing services: pipe fitting, repair, and maintenance. Borehole servicing, water tank installation. Same-day service available. Guaranteed workmanship.",                                                                                  inStock:true,  tags:["plumbing","pipe","repair","maintenance","water"] },
  { id:"p15", name:"Electrical Wiring per Room",    nameHa:"Wayan Lantarki",                 price:18000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"electrical", location:"Minna",     lga:"Bosso",     seller:"Niger Sparkz Electrical", sellerId:"s11", rating:4.8, reviews:203, description:"Expert electrical wiring for new installations or renovations. Inverter and solar system setup. Generator servicing and repair. Licensed technician. 5-year warranty.",                                                                    inStock:true,  tags:["electrical","wiring","installation","inverter","solar"] },
  { id:"p16", name:"Custom Wardrobe Carpentry",     nameHa:"Kafinta Akwati",                 price:55000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"carpentry", location:"Bida",      lga:"Bida",      seller:"Bida Master Carpentry", sellerId:"s12", rating:4.9, reviews:94,  description:"Handcrafted wooden wardrobes and furniture. Quality hardwood, modern designs. Custom measurements and finishes. Professional installation. 10-year durability guarantee.",                                                                             inStock:true,  tags:["carpentry","wardrobe","furniture","custom","woodwork"] },
  { id:"p17", name:"Wall Tiling & Plaster Work",     nameHa:"Ginin Gida da Tiling",          price:28000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1582282613098-10b0c000f5d4?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"masonry", location:"Kontagora", lga:"Kontagora",  seller:"Kontagora Construction Co.", sellerId:"s13", rating:4.5, reviews:112, description:"Professional masonry, tiling, plastering, and wall finishing. Interior and exterior work. Quality cement and materials. On-time completion guaranteed.",                                                                                 inStock:true,  tags:["masonry","tiling","plaster","construction","interior"] },
  { id:"p18", name:"Security Gate Fabrication",     nameHa:"Ita Karfe",                      price:45000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1565182999555-c71e3bac63e0?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"welding", location:"Bida",      lga:"Bida",      seller:"Bida Master Carpentry", sellerId:"s12", rating:4.7, reviews:68,  description:"Custom welded security gates, doors, and metal furniture. Durable burglary-proof designs. Rust-resistant finish. Professional installation included.",                                                                                                    inStock:true,  tags:["welding","gate","security","metal","fabrication"] },
  { id:"p19", name:"Full Vehicle Service & Maintenance", nameHa:"Tunkaɗi Mota Gida", price:22000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"auto", location:"Suleja",    lga:"Suleja",    seller:"Suleja Auto & Keke Centre", sellerId:"s14", rating:4.6, reviews:145, description:"Full vehicle maintenance: oil change, filter replacement, brake service, electrical checks. Expert mechanics. Genuine spare parts. Same-day service available.",                                                                        inStock:true,  tags:["auto","mechanics","service","repair","maintenance"] },
  { id:"p20", name:"Motorcycle/Keke Full Overhaul", nameHa:"Tunkaɗi Keke",                  price:8500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"keke", location:"Suleja",    lga:"Suleja",    seller:"Suleja Auto & Keke Centre", sellerId:"s14", rating:4.4, reviews:87,  description:"Professional motorcycle and tricycle (keke) servicing: engine overhaul, transmission repair, brake and electrical systems. Fast turnaround. Affordable rates.",                                                                                       inStock:true,  tags:["keke","motorcycle","repair","service","overhaul"] },
  { id:"p21", name:"Phone Screen Repair & Replacement", nameHa:"Gyara Wayar Waje",         price:5500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"phonerepair", location:"Minna",     lga:"Bosso",     seller:"NigerTech Repairs", sellerId:"s15", rating:4.8, reviews:234, description:"Fast phone screen repairs for all major brands. Quality parts, professional service. Also repair laptops, tablets, and small appliances. Same-day service.",                                                                                        inStock:true,  tags:["phone","repair","screen","electronics","service"] },
  { id:"p22", name:"AC & Refrigerator Gas Service",  nameHa:"Sanyi da AC",                   price:18000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"refrigeration", location:"Minna",     lga:"Bosso",     seller:"NigerTech Repairs", sellerId:"s15", rating:4.6, reviews:98,  description:"Professional air conditioning and refrigeration servicing. Gas refill, compressor repair, filter cleaning. Fridge and freezer repairs. Quick response, reliable service.",                                                                                    inStock:true,  tags:["ac","refrigeration","service","gas","repair"] },
  { id:"p23", name:"Hair Braiding & Styling",       nameHa:"Sanya da Aski",                  price:3500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1559599810-46d1c52494ee?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"beauty", location:"Minna",     lga:"Chanchaga",seller:"Minna Beauty & Bridal", sellerId:"s16", rating:4.9, reviews:267, description:"Expert hair braiding, styling, and beauty services. Traditional and modern styles. Henna (lalle) and makeup services available. Professional results guaranteed.",                                                                      inStock:true,  tags:["beauty","hair","braiding","styling","makeup"] },
  { id:"p24", name:"Event Catering (50 Pax)",        nameHa:"Dafa Abinci",                   price:95000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1555939594-58d7cb561af1?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"catering", location:"Minna",     lga:"Chanchaga",seller:"Alhaja Catering & Events", sellerId:"s17", rating:4.7, reviews:143, description:"Professional catering for weddings, events, and celebrations. Authentic Niger State cuisine and international dishes. Decoration and tableware included. Custom menu planning.",                                                                        inStock:true,  tags:["catering","events","food","celebration","catering"] },
  { id:"p25", name:"Laundry Service per Kg",        nameHa:"Wanki da Tsantsa",               price:1800,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1524758870432-af53e3e371bb?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"laundry", location:"Minna",     lga:"Chanchaga",seller:"Alhaja Catering & Events", sellerId:"s17", rating:4.5, reviews:156, description:"Professional laundry and dry cleaning service. Minimum 5kg. Delicate fabric care, stain removal, pressing included. Pickup and delivery available. Quick turnaround.",                                                                        inStock:true,  tags:["laundry","cleaning","dry-clean","pressing","service"] },
  { id:"p26", name:"Home Deep Cleaning Service",    nameHa:"Tsabtace Gida",                  price:28000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1581578731548-c64695c952952?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"cleaning", location:"Lavun",     lga:"Lavun",     seller:"Niger Clean Services", sellerId:"s18", rating:4.6, reviews:89,  description:"Professional home and office deep cleaning. Fumigation and pest control services. Eco-friendly products. Reliable and affordable. Flexible scheduling available.",                                                                                    inStock:true,  tags:["cleaning","home","fumigation","pest-control","service"] },
  { id:"p27", name:"Shoe & Bag Restoration",        nameHa:"Takalmi da AikO",                price:2500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1492707892657-8a91bde969e3?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"services", subcategory:"shoe", location:"Lavun",     lga:"Lavun",     seller:"Niger Clean Services", sellerId:"s18", rating:4.7, reviews:52,  description:"Professional shoe repair and restoration. Leather bag repair and cleaning. Expert craftsmanship. Quick turnaround at affordable rates. Quality guaranteed.",                                                                                         inStock:true,  tags:["shoe","repair","leather","bag","restoration"] },
  { id:"p28", name:"WAEC & Exam Tutoring",          nameHa:"Koyarwa Karatun Jiya",           price:18000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1427504494785-405a6e29dcff?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"tutoring", location:"Minna",     lga:"Bosso",     seller:"Minna Tutors Network", sellerId:"s19", rating:4.8, reviews:121, description:"Expert tutoring for WAEC, NECO, and entrance exams. Mathematics, English, Science. Personalized lessons. Flexible schedule. Proven success rate. Home or office tuition.",                                                                                       inStock:true,  tags:["tutoring","education","exam-prep","lessons","learning"] },
  { id:"p29", name:"Generator Service & Maintenance", nameHa:"Tunkaɗi Injin",               price:20000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"generator", location:"Minna",     lga:"Bosso",     seller:"Niger Sparkz Electrical", sellerId:"s11", rating:4.7, reviews:134, description:"Generator servicing, repair, and maintenance. Oil change, filter replacement, electrical checks. Preventive maintenance packages available.",                                                                                              inStock:true,  tags:["generator","service","maintenance","repair","energy"] },
  { id:"p30", name:"Borehole Drilling 50m Deep",    nameHa:"Hakowa Rijiya",                 price:380000, originalPrice:undefined,images:["https://images.unsplash.com/photo-1581092918270-8cf3a3b61434?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"borehole", location:"Minna",     lga:"Chanchaga",seller:"Minna Plumb & Pipe Works", sellerId:"s10", rating:4.9, reviews:43,  description:"Professional borehole drilling and water supply installation. 50m depth, modern equipment. Includes pump and electrical installation. Guaranteed water quality testing.",                                                                    inStock:true,  tags:["borehole","water","drilling","installation","service"] },
  { id:"p31", name:"Ankara Print Fabric (6yds)",      nameHa:"Auduga Print (Gaz 6)",           price:9500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"fabric", location:"Bida",      lga:"Bida",      seller:"Bida Textile & Fabric Hub", sellerId:"s20", rating:4.8, reviews:67,  description:"Authentic African Ankara print fabric in vibrant colours. Premium quality, 100% cotton. Perfect for traditional and modern fashion. 6-yard length, ready for tailoring.",                                                               inStock:true,  tags:["ankara","fabric","print","textile","fashion"] },
  { id:"p32", name:"Bida Hand-Woven Damask (5yds)",   nameHa:"Auduga Damask (Gaz 5)",          price:18000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=700&h=700&fit=crop&auto=format"],                                                                                                                                              category:"fabric", location:"Bida",      lga:"Bida",      seller:"Bida Textile & Fabric Hub", sellerId:"s20", rating:4.9, reviews:43,  description:"Exquisite Nupe hand-woven damask fabric showcasing traditional weaving artistry. Premium texture, sophisticated patterns. Ideal for special occasions and cultural events.",                                                              inStock:true,  tags:["damask","handwoven","nupe","traditional","fabric"] },
  { id:"p33", name:"Swiss Lace Fabric (5yds)",        nameHa:"Auduga Lace Swiss (Gaz 5)",      price:35000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=700&fit=crop&auto=format"],                                                                                                                                            category:"fabric", location:"Minna",     lga:"Chanchaga",seller:"Bida Textile & Fabric Hub", sellerId:"s20", rating:4.7, reviews:34,  description:"Premium Swiss lace fabric with intricate designs. Elegant and sophisticated. Perfect for bridal wear and formal occasions. 5-yard length, high quality.",                                                                            inStock:true,  tags:["lace","swiss","fabric","bridal","elegant"] },
  { id:"p34", name:"Dangote Cement (50kg Bag)",       nameHa:"Simu Dangote (50kg)",            price:8500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"building", location:"Minna",     lga:"Bosso",     seller:"Niger Building Supplies", sellerId:"s21", rating:4.6, reviews:156, description:"Quality Dangote Portland cement for construction. 50kg bags, perfect for building and concrete work. Authentic product, bulk discounts available for contractors.",                                                                   inStock:true,  tags:["cement","building","construction","materials","dangote"] },
  { id:"p35", name:"Iron Rods 16mm (per Tonne)",      nameHa:"Baƙin Karfe (Tonne)",           price:720000, originalPrice:undefined,images:["https://images.unsplash.com/photo-1581092906957-8706000344c9?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"building", location:"Minna",     lga:"Bosso",     seller:"Niger Building Supplies", sellerId:"s21", rating:4.7, reviews:89,  description:"High-quality deformed iron rods 16mm diameter for structural reinforcement. Per tonne. Professional grade for construction projects. Reliable supplier for contractors.",                                                                     inStock:true,  tags:["iron-rods","building","construction","steel","rebar"] },
  { id:"p36", name:"Long Span Aluminium Roofing",     nameHa:"Rufin Simu na Gida",             price:45000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"building", location:"Suleja",    lga:"Suleja",    seller:"Niger Building Supplies", sellerId:"s21", rating:4.5, reviews:72,  description:"Durable long-span aluminium roofing sheets for residential and commercial buildings. Weather-resistant, easy installation. Professional finishing. Per sheet.",                                                                        inStock:true,  tags:["roofing","aluminium","building","sheets","construction"] },
  { id:"p37", name:"Ceramic Floor Tiles (per Carton)", nameHa:"Tilo Ceramic (Carton)",        price:12500,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"building", location:"Minna",     lga:"Bosso",     seller:"Niger Building Supplies", sellerId:"s21", rating:4.6, reviews:98,  description:"Premium ceramic floor tiles 60x60cm in various designs. Per carton (approximately 10 tiles). Excellent for homes and commercial spaces. Durable and easy to clean.",                                                                 inStock:true,  tags:["tiles","ceramic","flooring","building","construction"] },
  { id:"p38", name:"Lonart DS Antimalarial (Blister)",  nameHa:"Lonart DS",                    price:2200,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"pharmacy", location:"Minna",     lga:"Chanchaga",seller:"Minna Pharmacy & Health", sellerId:"s22", rating:4.7, reviews:234, description:"Lonart DS antimalarial blister pack for malaria prevention and treatment. Recommended dosage, safe for adults. Certified and quality-assured. Available in single blister.",                                                              inStock:true,  tags:["antimalarial","malaria","medicine","pharmacy","health"] },
  { id:"p39", name:"Vitamin C & Zinc Supplement",     nameHa:"Vitamin C & Zinc",               price:1800,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"pharmacy", location:"Minna",     lga:"Chanchaga",seller:"Minna Pharmacy & Health", sellerId:"s22", rating:4.8, reviews:189, description:"High-potency Vitamin C and Zinc supplement tablets (60 tablets). Boosts immunity and supports overall health. Certified quality, safe for daily use. Recommended for all ages.",                                                           inStock:true,  tags:["vitamin-c","zinc","supplement","health","immunity"] },
  { id:"p40", name:"Amlodipine 5mg Blood Pressure",    nameHa:"Amlodipine 5mg",                price:850,    originalPrice:undefined,images:["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"pharmacy", location:"Minna",     lga:"Chanchaga",seller:"Minna Pharmacy & Health", sellerId:"s22", rating:4.6, reviews:112, description:"Amlodipine 5mg blood pressure medication tablet. Generic quality, effective for hypertension management. Per tablet. Consult pharmacist before use. Authentic product.",                                                                 inStock:true,  tags:["blood-pressure","medicine","amlodipine","pharmacy","health"] },
  { id:"p41", name:"First Aid Kit (Home Complete)",    nameHa:"Kashi-kashi Gida",              price:6500,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1587854692152-cbe660dbde0b?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"pharmacy", location:"Minna",     lga:"Chanchaga",seller:"Minna Pharmacy & Health", sellerId:"s22", rating:4.9, reviews:156, description:"Complete home first aid kit with bandages, antiseptic, pain relief, thermometer, and emergency supplies. Ready-to-use. Essential for every household. Comprehensive coverage.",                                                              inStock:true,  tags:["first-aid","health","emergency","home","safety"] },
  { id:"p42", name:"Legal Consultation (per Session)",   nameHa:"Zama da Lauya",                  price:25000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"legal", location:"Minna",     lga:"Bosso",     seller:"Niger Legal & Accounting Group", sellerId:"s23", rating:4.8, reviews:87,  description:"Professional legal consultation for contracts, disputes, and corporate matters. Experienced lawyer. Confidential advice. Per-session rate. Same-day appointments available.",                                                          inStock:true,  tags:["legal","consultation","contract","lawyer","services"] },
  { id:"p43", name:"Business Tax Filing & Returns",      nameHa:"Haraji da Akanta",               price:45000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"accounting", location:"Minna",     lga:"Bosso",     seller:"Niger Legal & Accounting Group", sellerId:"s23", rating:4.7, reviews:56,  description:"Professional tax filing and business accounting. Corporate tax returns, bookkeeping, financial statements. Certified accountant. Compliant with FIRS requirements. Annual package.",                                        inStock:true,  tags:["accounting","tax","business","finance","services"] },
  { id:"p44", name:"Medical Consultation & Lab Tests",   nameHa:"Binciken Asibiti",               price:5000,   originalPrice:undefined,images:["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"clinic", location:"Minna",     lga:"Chanchaga",seller:"Minna Medical & Diagnostic Centre", sellerId:"s24", rating:4.9, reviews:234, description:"Professional medical consultation by certified doctors. Lab tests, diagnostics, prescriptions. Hygienic facilities, confidential results. Affordable healthcare quality. Referral available.",                                   inStock:true,  tags:["clinic","medical","consultation","diagnosis","health"] },
  { id:"p45", name:"Full Event Planning & Coordination",  nameHa:"Shirya Biki",                    price:180000, originalPrice:undefined,images:["https://images.unsplash.com/photo-1555939594-58d7cb561af1?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"eventplanning", location:"Minna",     lga:"Chanchaga",seller:"Alhaja Catering & Events", sellerId:"s17", rating:4.7, reviews:45,  description:"Complete event planning and coordination: venue, catering, decoration, entertainment. Professional team. Weddings, corporate events, celebrations. Customized packages. On-site management.",                                         inStock:true,  tags:["event","planning","coordination","celebration","party"] },
  { id:"p46", name:"Property Management (Monthly)",       nameHa:"Kula da Gida",                   price:35000,  originalPrice:undefined,images:["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&h=700&fit=crop&auto=format"],                                                                                                                                             category:"services", subcategory:"propertymanagement", location:"Minna",     lga:"Bosso",     seller:"Niger Homes Agency", sellerId:"s8", rating:4.6, reviews:23,  description:"Professional property management: tenant screening, rent collection, maintenance coordination. Secure and reliable. Protect your investment. Monthly management fee. Flexible terms.",                                                inStock:true,  tags:["property","management","rental","real-estate","services"] },
]

const SELLERS: Seller[] = [
  { id:"s1", name:"Bida Craft Hub",    avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900&h=300&fit=crop&auto=format", location:"Bida, Niger State",      lga:"Bida",      rating:4.8, totalSales:2341, products:87,  verified:true, joined:"March 2021",    description:"Authentic Nupe brasswork and traditional crafts from Bida artisans. All products are handmade using traditional techniques passed down for generations.",   phone:"+234 803 456 7890" },
  { id:"s2", name:"Nupe Weave Co.",    avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&h=300&fit=crop&auto=format", location:"Bida, Niger State",      lga:"Bida",      rating:4.9, totalSales:1876, products:43,  verified:true, joined:"June 2020",     description:"Premium hand-woven Nupe fabrics and traditional textiles. Wholesale and retail available. Custom orders accepted.",                                         phone:"+234 806 789 0123" },
  { id:"s3", name:"Niger Farm Direct", avatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=300&fit=crop&auto=format", location:"Lavun, Niger State",     lga:"Lavun",     rating:4.6, totalSales:5234, products:134, verified:true, joined:"January 2019",  description:"Direct farm produce from Niger State's most fertile regions. Fresh, natural, and affordable. Supporting local farmers across 10+ LGAs.",                   phone:"+234 812 345 6789" },
  { id:"s4", name:"Minna Tech Store",  avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.7, totalSales:3412, products:203, verified:true, joined:"September 2020","description":"Leading electronics retailer in Minna. Official resellers of Samsung, Tecno, and Infinix. All products come with full warranty.",                        phone:"+234 803 234 5678" },
  { id:"s5", name:"Kontagora Farms",   avatar:"https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&h=300&fit=crop&auto=format", location:"Kontagora, Niger State", lga:"Kontagora", rating:4.5, totalSales:1230, products:45,  verified:true, joined:"April 2021",    description:"Large-scale farm in Kontagora producing premium yams, cassava, and groundnuts. Supplying families and businesses across Niger State.",                     phone:"+234 807 567 8901" },
  { id:"s6", name:"Niger State Express", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.3, totalSales:892,  products:2,   verified:true, joined:"July 2022",      description:"Premium inter-city transport services connecting Niger State to major cities. Comfortable, air-conditioned vehicles with safety amenities.",                  phone:"+234 805 123 4567" },
  { id:"s7", name:"Suleja Home Depot",  avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=300&fit=crop&auto=format", location:"Suleja, Niger State",    lga:"Suleja",    rating:4.4, totalSales:156,  products:12,  verified:true, joined:"May 2021",       description:"Quality furniture and home furnishings for modern living spaces. Custom designs available. Delivery and assembly included.",                              phone:"+234 807 234 5678" },
  { id:"s8", name:"Niger Homes Agency", avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.6, totalSales:47,   products:18,  verified:true, joined:"August 2020",   description:"Professional real estate services across Niger State. Residential, commercial, and land properties. Transparent pricing, legal documentation.",                  phone:"+234 803 567 8901" },
  { id:"s9", name:"Minna Fashion House", avatar:"https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.7, totalSales:234,  products:23,  verified:true, joined:"February 2021",  description:"Premium traditional and modern fashion for men and women. Hausa caps, agbada, and embroidered wear. Expert tailoring services available.",                   phone:"+234 806 456 7890" },
  { id:"s10", name:"Minna Plumb & Pipe Works", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1581092162562-40038f56c17f?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.7, totalSales:412,  products:19,  verified:true, joined:"January 2020",  description:"Expert plumbing and water services. Pipe fitting, borehole drilling, water tank installation. Quality materials, guaranteed workmanship.",                  phone:"+234 803 789 0123" },
  { id:"s11", name:"Niger Sparkz Electrical", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1621905167918-48416bd8575a?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.8, totalSales:578,  products:20,  verified:true, joined:"March 2020",    description:"Professional electrical installation, repairs, and maintenance. Solar and inverter systems, generator servicing. Licensed technician.",                   phone:"+234 809 234 5678" },
  { id:"s12", name:"Bida Master Carpentry", avatar:"https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&h=300&fit=crop&auto=format", location:"Bida, Niger State",      lga:"Bida",      rating:4.9, totalSales:334,  products:17,  verified:true, joined:"November 2019", description:"Master carpenter offering custom woodwork, furniture making, and welding services. Quality hardwood, modern designs, professional installation.",           phone:"+234 807 789 0123" },
  { id:"s13", name:"Kontagora Construction Co.", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1582282613098-10b0c000f5d4?w=900&h=300&fit=crop&auto=format", location:"Kontagora, Niger State", lga:"Kontagora", rating:4.5, totalSales:289,  products:8,   verified:true, joined:"June 2021",     description:"Full masonry and construction services. Bricklaying, plastering, tiling, painting. Quality materials and professional team.",                            phone:"+234 805 456 7890" },
  { id:"s14", name:"Suleja Auto & Keke Centre", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=900&h=300&fit=crop&auto=format", location:"Suleja, Niger State",    lga:"Suleja",    rating:4.6, totalSales:267,  products:12,  verified:true, joined:"August 2021",   description:"Expert auto mechanics and motorcycle/tricycle repair. Full vehicle servicing, engine work, transmission repair. Quick turnaround.",                        phone:"+234 808 567 8901" },
  { id:"s15", name:"NigerTech Repairs",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.8, totalSales:512,  products:16,  verified:true, joined:"April 2020",    description:"Phone, laptop, and electronics repair specialists. Screen replacement, component repair, data recovery. Professional service, fast turnaround.",       phone:"+234 809 678 9012" },
  { id:"s16", name:"Minna Beauty & Bridal", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1559599810-46d1c52494ee?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.9, totalSales:623,  products:18,  verified:true, joined:"September 2019", description:"Professional beauty, hair, and bridal services. Hairstyling, makeup, henna application, tailoring. Expert team for special occasions.",                    phone:"+234 810 789 0123" },
  { id:"s17", name:"Alhaja Catering & Events", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1555939594-58d7cb561af1?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.7, totalSales:445,  products:14,  verified:true, joined:"October 2020",  description:"Full event catering and planning services. Traditional and modern cuisine, decoration, rental equipment. Expert team for all occasions.",                   phone:"+234 811 234 5678" },
  { id:"s18", name:"Niger Clean Services", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1581078726764-5f780e6a0e39?w=900&h=300&fit=crop&auto=format", location:"Lavun, Niger State",     lga:"Lavun",     rating:4.6, totalSales:198,  products:9,   verified:true, joined:"January 2022",  description:"Professional cleaning and maintenance services. Home and office cleaning, fumigation, pest control, shoe repair. Eco-friendly products.",                   phone:"+234 812 345 6789" },
  { id:"s19", name:"Minna Tutors Network",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1427504494785-405a6e29dcff?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.8, totalSales:356,  products:11,  verified:true, joined:"February 2021",  description:"Expert tutors for WAEC, NECO, and entrance exam preparation. Mathematics, English, Science. Personalized lessons, proven success.",                       phone:"+234 813 456 7890" },
  { id:"s20", name:"Bida Textile & Fabric Hub", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&h=300&fit=crop&auto=format", location:"Bida, Niger State",      lga:"Bida",      rating:4.8, totalSales:478,  products:24,  verified:true, joined:"May 2020",      description:"Premium fabrics and textiles featuring traditional Nupe weaving. Ankara, lace, damask, and Swiss fabrics. Custom orders welcome. Supporting local weavers.",                           phone:"+234 814 567 8901" },
  { id:"s21", name:"Niger Building Supplies",   avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.6, totalSales:892,  products:31,  verified:true, joined:"January 2019", description:"Quality building materials and hardware. Cement, iron rods, tiles, roofing sheets, paint. Bulk discounts available. Professional contractors welcome.",                           phone:"+234 815 678 9012" },
  { id:"s22", name:"Minna Pharmacy & Health",   avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.7, totalSales:612,  products:28,  verified:true, joined:"June 2021",     description:"Licensed pharmacy with quality medicines, vitamins, and first aid supplies. Expert pharmacist consultation. Fast delivery within Minna. Health insurance accepted.",                  phone:"+234 816 789 0123" },
  { id:"s23", name:"Niger Legal & Accounting Group", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Bosso",     rating:4.8, totalSales:234,  products:15,  verified:true, joined:"March 2020",    description:"Professional legal and accounting services. Corporate registration, contract review, tax filing, bookkeeping. Experienced lawyers and chartered accountants. Confidential consultation.",                                  phone:"+234 817 890 1234" },
  { id:"s24", name:"Minna Medical & Diagnostic Centre", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format", banner:"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&h=300&fit=crop&auto=format", location:"Minna, Niger State",     lga:"Chanchaga", rating:4.9, totalSales:445,  products:12,  verified:true, joined:"January 2021",  description:"Modern medical clinic with certified professionals. Lab tests, diagnostics, consultations. Hygienic facilities, confidential results. Affordable healthcare with quality service.",                            phone:"+234 818 901 2345" },
]

const SALES_DATA = [
  { month:"Jan", revenue:45000,  orders:12 }, { month:"Feb", revenue:72000,  orders:19 },
  { month:"Mar", revenue:58000,  orders:15 }, { month:"Apr", revenue:89000,  orders:24 },
  { month:"May", revenue:105000, orders:31 }, { month:"Jun", revenue:93000,  orders:27 },
]

const PIE_DATA = [
  { name:"Crafts", value:35 }, { name:"Fashion", value:25 },
  { name:"Food",   value:20 }, { name:"Electronics", value:20 },
]

const PIE_COLORS = ["#15803d","#d97706","#3b82f6","#8b5cf6"]

const T: Record<string, Record<Lang, string>> = {
  "ZAMANI NG MARKET HUB": { en:"ZAMANI NG MARKET HUB", ha:"ZAMANI NG MARKET HUB" },
  "Search products...": { en:"Search products...", ha:"Nema kaya..." },
  "Home":               { en:"Home",               ha:"Gida" },
  "Shop":               { en:"Shop",               ha:"Shago" },
  "Categories":         { en:"Categories",         ha:"Rukunoni" },
  "Cart":               { en:"Cart",               ha:"Kwandon Saye" },
  "Login":              { en:"Login",              ha:"Shiga" },
  "Signup":             { en:"Sign Up",            ha:"Yi Rijista" },
  "Add to Cart":        { en:"Add to Cart",        ha:"Saka Kwandon" },
  "Buy Now":            { en:"Buy Now",            ha:"Sayo Yanzu" },
  "In Stock":           { en:"In Stock",           ha:"Akwai" },
  "Out of Stock":       { en:"Out of Stock",       ha:"Ba shi da" },
  "Verified Seller":    { en:"Verified Seller",    ha:"Mai Tabbatarwa" },
  "Filter":             { en:"Filter",             ha:"Tace" },
  "All Categories":     { en:"All Categories",     ha:"Dukkan Rukunoni" },
  "Price Range":        { en:"Price Range",        ha:"Kewayon Farashi" },
  "Location":           { en:"Location",           ha:"Wuri" },
  "Rating":             { en:"Rating",             ha:"Matsayi" },
  "Sell on ZAMANI NG MARKET HUB": { en:"Sell on ZAMANI NG MARKET HUB", ha:"Saya a ZAMANI NG MARKET HUB" },
}

const tr = (key: string, lang: Lang) => T[key]?.[lang] ?? key
const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<AppCtx | null>(null)
const useApp = () => { const c = useContext(Ctx); if (!c) throw new Error("No ctx"); return c }

function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name: string; role: UserRole } | null>(null)
  const [searchQ, setSearchQ] = useState("")
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(null)
  const [sellerData, setSellerData] = useState<Seller | null>(null)

  const addToCart = (p: Product) =>
    setCart(prev => prev.find(i => i.id === p.id)
      ? prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...prev, { ...p, quantity: 1 }])

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))
  const updateQty = (id: string, q: number) => {
    if (q < 1) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: q } : i))
  }
  const toggleWishlist = (id: string) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  return (
    <Ctx.Provider value={{ lang, setLang, cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount, wishlist, toggleWishlist, isLoggedIn, setIsLoggedIn, user, setUser, searchQ, setSearchQ, currentSellerId, setCurrentSellerId, sellerData, setSellerData }}>
      {children}
    </Ctx.Provider>
  )
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
      ))}
    </span>
  )
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>{children}</span>
}

function Btn({ children, variant = "primary", className = "", onClick, type = "button", disabled }: {
  children: React.ReactNode; variant?: "primary" | "gold" | "outline" | "ghost"; className?: string
  onClick?: () => void; type?: "button" | "submit"; disabled?: boolean
}) {
  const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-green-700 text-white hover:bg-green-800 active:scale-[0.98]",
    gold: "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]",
    outline: "border-2 border-green-700 text-green-700 hover:bg-green-50 active:scale-[0.98]",
    ghost: "text-green-700 hover:bg-green-50 active:scale-[0.98]",
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const { lang, addToCart, wishlist, toggleWishlist } = useApp()
  const nav = useNavigate()
  const inWish = wishlist.includes(product.id)
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  return (
    <div className="group bg-white rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden bg-green-50 aspect-square cursor-pointer" onClick={() => nav(`/products/${product.id}`)}>
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id) }}
          className={`absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 md:h-8 md:w-8 ${inWish ? "bg-red-500 text-white" : "bg-white/80 text-gray-500 hover:bg-red-50 hover:text-red-500"}`}
        >
          <Heart size={14} className={inWish ? "fill-current" : ""} />
        </button>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-red-600 font-bold px-3 py-1 rounded-full text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1">
          <Badge className="bg-green-100 text-green-800">
            {product.subcategory ? (
              <>
                {SERVICE_SUBCATEGORIES.find(s => s.id === product.subcategory)?.icon} {lang === "ha" ? SERVICE_SUBCATEGORIES.find(s => s.id === product.subcategory)?.nameHa : SERVICE_SUBCATEGORIES.find(s => s.id === product.subcategory)?.name}
              </>
            ) : (
              <>
                {CATEGORIES.find(c => c.id === product.category)?.icon} {lang === "ha" ? CATEGORIES.find(c => c.id === product.category)?.nameHa : CATEGORIES.find(c => c.id === product.category)?.name}
              </>
            )}
          </Badge>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug cursor-pointer hover:text-green-700 transition-colors" onClick={() => nav(`/products/${product.id}`)}>
          {lang === "ha" && product.nameHa ? product.nameHa : product.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={11} /> <span>{product.location}, {product.lga} LGA</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Stars rating={product.rating} size={11} />
          <span className="text-gray-500">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-green-700">{fmt(product.price)}</span>
          {product.originalPrice && <span className="text-xs text-gray-400 line-through">{fmt(product.originalPrice)}</span>}
        </div>
        <Btn variant="primary" className="w-full text-xs py-2" onClick={() => addToCart(product)} disabled={!product.inStock}>
          {product.category === "services" ? (
            <><Zap size={13} /> {tr("Book Service", lang)}</>
          ) : (
            <><ShoppingCart size={13} /> {tr("Add to Cart", lang)}</>
          )}
        </Btn>
      </div>
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { lang, setLang, isLoggedIn, user, setIsLoggedIn, setUser, setCurrentSellerId, setSellerData } = useApp()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const isVendorDashboard = loc.pathname === "/seller-dashboard"
  const vendorSections = [
    { id: "dashboard", label: "Dashboard" },
    { id: "products", label: "Products" },
    { id: "orders", label: "Orders" },
    { id: "payouts", label: "Payouts" },
    { id: "settings", label: "Settings" },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-green-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="truncate text-sm font-black text-green-800 tracking-tight sm:text-lg">ZAMANI NG <span className="text-amber-500">MARKET HUB</span></span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language toggle */}
            <button onClick={() => setLang(lang === "en" ? "ha" : "en")} className="hidden min-h-11 items-center gap-1 rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-50 md:flex">
              <Globe size={12} /> {lang === "en" ? "HA" : "EN"}
            </button>

            {/* User */}
            {isLoggedIn && user ? (
              <div className="relative">
                <button onClick={() => setUserOpen(!userOpen)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-green-800 transition-colors hover:bg-green-50">
                  <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
                  <span className="hidden md:block text-sm font-medium">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-green-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-green-50">
                      <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role} Account</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-2 px-4 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"><User size={14}/> Dashboard</Link>
                    {user.role === "seller" && <Link to="/seller-dashboard" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-2 px-4 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"><Store size={14}/> Seller Panel</Link>}
                    {user.role === "admin" && <Link to="/admin" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-2 px-4 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"><Shield size={14}/> Admin Panel</Link>}
                    <Link to="/dashboard?tab=settings" onClick={() => setUserOpen(false)} className="flex min-h-11 items-center gap-2 px-4 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700"><Settings size={14}/> Settings</Link>
                    <button onClick={() => { setIsLoggedIn(false); setUser(null); setCurrentSellerId(null); setSellerData(null); setUserOpen(false) }} className="flex min-h-11 w-full items-center gap-2 px-4 text-sm text-red-600 transition-colors hover:bg-red-50"><LogOut size={14}/> Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg  text-white text-sm font-semibold  transition-colors">
                {/* <User size={14} /> {tr("Login", lang)} */}
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-green-50 md:hidden">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-green-100 bg-white px-2 py-2">
          {isVendorDashboard ? (
            <nav aria-label="Vendor navigation" className="grid grid-cols-6 gap-1 rounded-xl border border-green-100 bg-white p-2">
              {vendorSections.map((section, index) => {
                const isActive = new URLSearchParams(loc.search).get("section") === section.id || (!loc.search && section.id === "dashboard")
                return (
                  <Link
                    key={section.id}
                    to={section.id === "dashboard" ? "/seller-dashboard" : `/seller-dashboard?section=${section.id}`}
                    onClick={() => setOpen(false)}
                    className={`col-span-2 flex min-h-9 items-center justify-center rounded-lg px-1.5 py-2 text-xs font-bold transition-colors ${index === 3 ? "col-start-2" : ""} ${isActive ? "bg-green-700 text-white" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}
                  >
                    {section.label}
                  </Link>
                )
              })}
            </nav>
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                {CATEGORIES.map(c => (
                  <Link key={c.id} to={`/products?category=${c.id}`} onClick={() => setOpen(false)}
                    className="flex min-h-11 flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors hover:bg-green-50">
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-xs text-gray-600 leading-tight">{lang === "ha" ? c.nameHa : c.name}</span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-green-50">
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold">{user?.name[0]}</div>
                    <span className="text-sm font-medium text-gray-800">{user?.name}</span>
                  </div>
                ) : (
                  <Link to="/auth" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-1.5 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white"><User size={14} /> {tr("Login", lang)}</Link>
                )}
                <button onClick={() => setLang(lang === "en" ? "ha" : "en")} className="flex min-h-11 items-center gap-1 rounded-lg border border-green-200 px-3 text-xs font-bold text-green-700">
                  <Globe size={12} /> {lang === "en" ? "Hausa" : "English"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { lang } = useApp()
  return (
    <footer className="bg-green-900 text-green-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center"><Leaf size={16} className="text-white" /></div>
              <span className="text-lg font-black text-white">ZAMANI NG <span className="text-amber-400">MARKET HUB</span></span>
            </div>
            <p className="text-sm text-green-300 leading-relaxed mb-4">Niger State's #1 online marketplace. Connecting buyers and sellers across all 25 LGAs.</p>
            <div className="flex gap-2">
              {["📘","🐦","📷","▶️"].map((icon, i) => (
                <button key={i} aria-label={`Social link ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-800 text-sm hover:bg-green-700 transition-colors">{icon}</button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-green-300">
              {["About Us","Advertise","Careers","Press","Blog"].map(l => (
                <li key={l}><a href="#" className="hover:text-amber-400 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-green-300">
              {["Help Center","Track Order","Return Policy","Terms of Service","Privacy Policy"].map(l => (
                <li key={l}><a href="#" className="hover:text-amber-400 transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-green-300">
              <li className="flex items-center gap-2"><MapPin size={13} /><span>Minna, Niger State</span></li>
              <li className="flex items-center gap-2"><Phone size={13} /><span>+234 803 000 1234</span></li>
              <li className="flex items-center gap-2"><Mail size={13} /><span>hello@nigermart.ng</span></li>
            </ul>
            <div className="mt-4">
              <h4 className="font-bold text-white mb-2 text-sm">We Accept</h4>
              <div className="flex gap-2 flex-wrap">
                {["💳 Card","🏦 Bank","💵 Cash","📱 USSD"].map(p => (
                  <span key={p} className="text-xs bg-green-800 px-2 py-1 rounded-md text-green-200">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-green-800">
          <h4 className="font-semibold text-white mb-3 text-sm">Niger State LGAs We Serve</h4>
          <div className="flex flex-wrap gap-2">
            {LGAS.map(lga => (
              <Link key={lga} to={`/products?lga=${lga}`} className="text-xs text-green-400 hover:text-amber-400 transition-colors">{lga}</Link>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-green-800 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-green-500">
          <p>© 2025 ZAMANI NG MARKET HUB. All rights reserved. Made with ❤️ in Niger State, Nigeria.</p>
          <p>Prices shown in Nigerian Naira (₦). All transactions secured by SSL.</p>
        </div>
      </div>
    </footer>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

function HomePage() {
  const { lang } = useApp()
  const nav = useNavigate()
  const [slide, setSlide] = useState(0)

  const slides = [
    { title: "Shop Niger State's Best Products", titleHa: "Saya Kayayyaki mafi kyau na Niger State", sub: "Over 10,000 products from verified local sellers across all 25 LGAs", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&h=600&fit=crop&auto=format", cta: "Shop Now", link: "/products" },
    { title: "Discover Authentic Bida Brasswork & Nupe Crafts", titleHa: "Gano Tagullar Bida da Sana'ar Nupe", sub: "Handcrafted by master artisans using centuries-old traditional techniques", img: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1400&h=600&fit=crop&auto=format", cta: "Explore Crafts", link: "/products?category=crafts" },
    { title: "Fresh Farm Produce Delivered to Your Door", titleHa: "Abincin Gona Sabo a Ƙofonku", sub: "Direct from Lavun, Kontagora, and Lapai farms — fresh, natural, and affordable", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=600&fit=crop&auto=format", cta: "Buy Fresh", link: "/products?category=agriculture" },
  ]

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="relative h-screen overflow-hidden bg-green-900">
        {slides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
            <img src={s.img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-800/70 to-green-700/30" />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-xl">
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">🇳🇬 Niger State's #1 Marketplace</Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                {lang === "ha" ? slides[slide].titleHa : slides[slide].title}
              </h1>
              <p className="text-green-200 text-base md:text-lg mb-6">{slides[slide].sub}</p>
              <div className="flex gap-3 flex-wrap">
                <Btn variant="gold" className="px-6 py-3 text-base" onClick={() => nav("/auth")}>
                  <User size={16} /> Customer Login
                </Btn>
                <Btn variant="outline" className="px-6 py-3 text-base border-white text-white hover:bg-white/10" onClick={() => nav("/vendor-auth")}>
                  <User size={16} /> Vendor Login
                </Btn>
              </div>
            </div>
          </div>
        </div>
        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-amber-400" : "w-3 bg-white/50"}`} />
          ))}
        </div>
        <button onClick={() => setSlide(s => (s - 1 + slides.length) % slides.length)} aria-label="Previous slide" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors sm:left-4"><ChevronLeft size={20} /></button>
        <button onClick={() => setSlide(s => (s + 1) % slides.length)} aria-label="Next slide" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors sm:right-4"><ChevronRight size={20} /></button>
      </div>
    </div>
  )
}

// ─── ProductListingPage ───────────────────────────────────────────────────────

function ProductListingPage() {
  const { lang } = useApp()
  const loc = useLocation()
  const nav = useNavigate()
  const params = new URLSearchParams(loc.search)

  const [selectedCat, setSelectedCat] = useState(params.get("category") || "")
  const [selectedLGA, setSelectedLGA] = useState(params.get("lga") || "")
  const [selectedSubcat, setSelectedSubcat] = useState(params.get("subcategory") || "")
  const [priceMax, setPriceMax] = useState(500000)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("featured")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilter, setShowFilter] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 8

  const filtered = PRODUCTS.filter(p => {
    if (selectedCat && p.category !== selectedCat) return false
    if (selectedCat === "services" && selectedSubcat && p.subcategory !== selectedSubcat) return false
    if (selectedLGA && p.lga !== selectedLGA) return false
    if (p.price > priceMax) return false
    if (p.rating < minRating) return false
    return true
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price
    if (sortBy === "price-desc") return b.price - a.price
    if (sortBy === "rating") return b.rating - a.rating
    return 0
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">{tr("Categories", lang)}</h4>
        <div className="space-y-1">
          <button onClick={() => setSelectedCat("")} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCat ? "bg-green-700 text-white" : "hover:bg-green-50 text-gray-700"}`}>
            All Categories
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setSelectedCat(c.id); setPage(1) }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedCat === c.id ? "bg-green-700 text-white" : "hover:bg-green-50 text-gray-700"}`}>
              {c.icon} {lang === "ha" ? c.nameHa : c.name}
              <span className={`ml-auto text-xs ${selectedCat === c.id ? "text-green-200" : "text-gray-400"}`}>{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Max Price: {fmt(priceMax)}</h4>
        <input type="range" min={1000} max={500000} step={1000} value={priceMax}
          onChange={e => { setPriceMax(Number(e.target.value)); setPage(1) }}
          className="w-full accent-green-700" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₦1,000</span><span>₦500,000</span></div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">LGA</h4>
        <select value={selectedLGA} onChange={e => { setSelectedLGA(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-green-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400">
          <option value="">All LGAs</option>
          {LGAS.map(lga => <option key={lga} value={lga}>{lga}</option>)}
        </select>
      </div>

      {selectedCat === "services" && (
        <div>
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Service Type</h4>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => { setSelectedSubcat(""); setPage(1) }} className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${!selectedSubcat ? "bg-green-700 text-white" : "border border-green-200 text-gray-600 hover:bg-green-50"}`}>
              All
            </button>
            {SERVICE_SUBCATEGORIES.map(s => (
              <button key={s.id} onClick={() => { setSelectedSubcat(s.id); setPage(1) }}
                className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${selectedSubcat === s.id ? "bg-green-700 text-white" : "border border-green-200 text-gray-600 hover:bg-green-50"}`}>
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Min Rating</h4>
        <div className="flex gap-1">
          {[0,3,4,4.5].map(r => (
            <button key={r} onClick={() => { setMinRating(r); setPage(1) }}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${minRating === r ? "bg-green-700 text-white border-green-700" : "border-green-200 text-gray-600 hover:border-green-400"}`}>
              {r === 0 ? "All" : `${r}+⭐`}
            </button>
          ))}
        </div>
      </div>

      <Btn variant="outline" className="w-full text-sm" onClick={() => { setSelectedCat(""); setSelectedLGA(""); setSelectedSubcat(""); setPriceMax(500000); setMinRating(0); setPage(1) }}>
        Clear All Filters
      </Btn>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-green-700">Home</Link> <ChevronRight size={12}/> <span className="text-gray-900">Products</span>
        {selectedCat && <><ChevronRight size={12}/><span className="text-gray-900">{CATEGORIES.find(c => c.id === selectedCat)?.name}</span></>}
      </div>

      {/* Main - Full Width */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-sm text-gray-500">{filtered.length} products found</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-green-200 text-green-700 hover:bg-green-50">
              <Filter size={14}/> Filter
            </button>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-sm rounded-lg border border-green-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <div className="flex rounded-lg border border-green-200 overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-green-50"}`}><Grid size={15}/></button>
                <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-green-50"}`}><List size={15}/></button>
              </div>
            </div>
          </div>

        {/* Filter Drawer - All devices */}
        {showFilter && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilter(false)} />

            {/* Drawer */}
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-white shadow-lg overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-green-100 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => setShowFilter(false)} className="p-1 hover:bg-green-50 rounded-lg"><X size={20} className="text-gray-600"/></button>
              </div>
              <div className="p-4">
                <FilterPanel />
              </div>
            </div>
          </div>
        )}

          {paginated.length > 0 ? (
            <div className={viewMode === "grid" ? "grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}>
              {paginated.map(p => viewMode === "grid" ? <ProductCard key={p.id} product={p} /> : (
                <div key={p.id} className="bg-white rounded-xl border border-green-100 p-3 flex gap-4 hover:shadow-md transition-shadow">
                  <img src={p.images[0]} alt={p.name} className="w-24 h-24 rounded-lg object-cover bg-green-50 shrink-0 cursor-pointer" onClick={() => nav(`/products/${p.id}`)} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm hover:text-green-700 cursor-pointer" onClick={() => nav(`/products/${p.id}`)}>{p.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{p.location}, {p.lga}</p>
                    <div className="flex items-center gap-1 mt-1"><Stars rating={p.rating} size={11}/><span className="text-xs text-gray-400">({p.reviews})</span></div>
                    <div className="flex items-center justify-between mt-2">
                      <div><span className="font-bold text-green-700">{fmt(p.price)}</span>{p.originalPrice && <span className="text-xs text-gray-400 line-through ml-1">{fmt(p.originalPrice)}</span>}</div>
                      <Btn variant="primary" className="text-xs px-3 py-1.5" onClick={() => useApp().addToCart(p)}>Add to Cart</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">No products found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-green-200 disabled:opacity-40 hover:bg-green-50 transition-colors"><ChevronLeft size={16}/></button>
              {Array.from({length: totalPages}, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-green-700 text-white" : "border border-green-200 hover:bg-green-50 text-gray-700"}`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-green-200 disabled:opacity-40 hover:bg-green-50 transition-colors"><ChevronRight size={16}/></button>
            </div>
          )}
      </div>
    </div>
  )
}

// ─── ProductDetailPage ────────────────────────────────────────────────────────

function ProductDetailPage() {
  const { id } = useParams()
  const { lang, addToCart } = useApp()
  const nav = useNavigate()
  const product = PRODUCTS.find(p => p.id === id)
  const [imgIdx, setImgIdx] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<"desc"|"reviews">("desc")

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Product not found</h2>
      <Btn variant="primary" onClick={() => nav("/products")}>Browse Products</Btn>
    </div>
  )

  const seller = SELLERS.find(s => s.id === product.sellerId)
  const related = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  const reviews = [
    { id:"r1", user:"Aisha Bello",    rating:5, comment:"Excellent quality! The product is even more beautiful in person. Fast delivery to Minna.", date:"Dec 15, 2024", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format" },
    { id:"r2", user:"Ibrahim Tanko",  rating:4, comment:"Very good product. Packaging could be better but overall satisfied with my purchase.", date:"Dec 8, 2024",  avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format" },
    { id:"r3", user:"Fatima Umar",    rating:5, comment:"Perfect! Bought as a gift and everyone loved it. Will definitely order again from this seller.", date:"Nov 30, 2024", avatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-green-700">Home</Link> <ChevronRight size={12}/>
        <Link to="/products" className="hover:text-green-700">Products</Link> <ChevronRight size={12}/>
        <span className="text-gray-900 truncate">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-green-50 mb-3">
            <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-green-600" : "border-green-100"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-green-100 text-green-800">{CATEGORIES.find(c => c.id === product.category)?.icon} {CATEGORIES.find(c => c.id === product.category)?.name}</Badge>
            {product.inStock ? <Badge className="bg-emerald-100 text-emerald-700"><Check size={11}/>In Stock</Badge> : <Badge className="bg-red-100 text-red-700"><X size={11}/>Out of Stock</Badge>}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{lang === "ha" && product.nameHa ? product.nameHa : product.name}</h1>

          <div className="flex items-center gap-3 mb-3">
            <Stars rating={product.rating} size={16} />
            <span className="text-sm text-green-700 font-semibold">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviews} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-black text-green-700">{fmt(product.price)}</span>
            {product.originalPrice && <>
              <span className="text-lg text-gray-400 line-through">{fmt(product.originalPrice)}</span>
              <Badge className="bg-red-100 text-red-700 font-bold">{discount}% OFF</Badge>
            </>}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <MapPin size={13} className="text-green-600"/><span>{product.location}, {product.lga} LGA, Niger State</span>
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border-2 border-green-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center hover:bg-green-50 transition-colors text-green-700"><Minus size={14}/></button>
              <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center hover:bg-green-50 transition-colors text-green-700"><Plus size={14}/></button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mb-6 sm:flex-row">
            {product.category === "services" ? (
              <>
                <Btn variant="primary" className="flex-1 py-3" onClick={() => { for(let i = 0; i < qty; i++) addToCart(product); nav("/cart") }} disabled={!product.inStock}>
                  <Zap size={16}/> {tr("Book Service", lang)}
                </Btn>
                <Btn variant="outline" className="flex-1 py-3" onClick={() => { for(let i = 0; i < qty; i++) addToCart(product) }} disabled={!product.inStock}>
                  <MessageCircle size={16}/> {tr("Get a Quote", lang)}
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="primary" className="flex-1 py-3" onClick={() => { for(let i = 0; i < qty; i++) addToCart(product); nav("/cart") }} disabled={!product.inStock}>
                  <ShoppingCart size={16}/> {tr("Buy Now", lang)}
                </Btn>
                <Btn variant="outline" className="flex-1 py-3" onClick={() => { for(let i = 0; i < qty; i++) addToCart(product) }} disabled={!product.inStock}>
                  <ShoppingCart size={16}/> {tr("Add to Cart", lang)}
                </Btn>
              </>
            )}
          </div>

          {/* Seller card */}
          {seller && (
            <Link to={`/seller/${seller.id}`} className="block border border-green-200 rounded-xl p-4 hover:border-green-400 hover:shadow-md transition-all">
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <img src={seller.avatar} alt={seller.name} className="w-12 h-12 rounded-full object-cover border-2 border-green-200" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm">{seller.name}</span>
                    {seller.verified && <CheckCircle size={13} className="text-green-600" />}
                  </div>
                  <p className="text-xs text-gray-500">{seller.location}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="text-amber-500 font-medium">⭐ {seller.rating}</span>
                    <span>{seller.totalSales.toLocaleString()} sales</span>
                    <span>{seller.products} products</span>
                  </div>
                </div>
                <div className="flex w-full flex-row gap-1.5 sm:w-auto sm:flex-col">
                  <a href={`tel:${seller.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs bg-green-700 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-800 transition-colors">
                    <Phone size={11}/> Call
                  </a>
                  {product.category === "services" && (
                    <a href={`https://wa.me/${seller.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                      <MessageCircle size={11}/> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Delivery/Service info */}
          <div className="mt-4 grid gap-3 rounded-xl bg-green-50 p-4 text-center md:grid-cols-3">
            {(product.category === "services" ? [
              { icon:<Zap size={18} className="text-green-700"/>, label:"Service Visit", sub:"Arranged" },
              { icon:<Shield size={18} className="text-green-700"/>, label:"Verified", sub:"Professionals" },
              { icon:<Award size={18} className="text-green-700"/>, label:"Rated", sub:"& Reviewed" },
            ] : [
              { icon:<Truck size={18} className="text-green-700"/>, label:"Fast Delivery", sub:"24–48 hrs" },
              { icon:<Shield size={18} className="text-green-700"/>, label:"Buyer Protection", sub:"100% Secure" },
              { icon:<Award size={18} className="text-green-700"/>, label:"Authentic", sub:"Verified Seller" },
            ]).map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                {item.icon}
                <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                <span className="text-[10px] text-gray-500">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex gap-0 border-b-2 border-green-100 mb-4">
          {(["desc","reviews"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${tab === t ? "border-green-700 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {t === "desc" ? "Description" : `Reviews (${product.reviews})`}
            </button>
          ))}
        </div>

        {tab === "desc" ? (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p>{product.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map(tag => <Badge key={tag} className="bg-green-100 text-green-700">#{tag}</Badge>)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-green-100 p-4">
                <div className="flex items-start gap-3">
                  <img src={r.avatar} alt={r.user} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-sm text-gray-900">{r.user}</span>
                      <span className="text-xs text-gray-400">{r.date}</span>
                    </div>
                    <Stars rating={r.rating} size={12} />
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── SellerStorefront ─────────────────────────────────────────────────────────

function SellerStorefront() {
  const { id } = useParams()
  const nav = useNavigate()
  const seller = SELLERS.find(s => s.id === id)
  const products = PRODUCTS.filter(p => p.sellerId === id)

  if (!seller) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-bold text-gray-700 mb-2">Seller not found</h2>
      <Btn variant="primary" onClick={() => nav("/")}>Go Home</Btn>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="relative h-48 rounded-2xl overflow-hidden bg-green-100 mb-0">
        <img src={seller.banner} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-green-900/30" />
      </div>

      {/* Seller header */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 mb-6 -mt-8 mx-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <img src={seller.avatar} alt={seller.name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900">{seller.name}</h1>
              {seller.verified && <Badge className="bg-green-100 text-green-700"><CheckCircle size={11}/>Verified Seller</Badge>}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12}/>{seller.location}</p>
            <p className="text-gray-600 text-sm mt-2 max-w-lg">{seller.description}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-amber-400 text-amber-400"/><strong>{seller.rating}</strong><span className="text-gray-500">rating</span></span>
              <span className="text-sm"><strong>{seller.totalSales.toLocaleString()}</strong> <span className="text-gray-500">sales</span></span>
              <span className="text-sm"><strong>{seller.products}</strong> <span className="text-gray-500">products</span></span>
              <span className="text-sm text-gray-500">Joined {seller.joined}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${seller.phone}`} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors">
              <Phone size={14}/> Call Seller
            </a>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-green-700 text-green-700 text-sm font-semibold hover:bg-green-50 transition-colors">
              <MessageCircle size={14}/> Message
            </button>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Products by {seller.name}</h2>
      {products.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">No products listed yet</div>
      )}
    </div>
  )
}

// ─── CartPage ─────────────────────────────────────────────────────────────────

function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal, lang } = useApp()
  const nav = useNavigate()
  const DELIVERY_FEE = cart.length > 0 ? 1500 : 0

  if (cart.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Explore products from sellers across Niger State</p>
      <Btn variant="primary" className="px-8 py-3 text-base" onClick={() => nav("/products")}>
        <ShoppingBag size={18}/> Start Shopping
      </Btn>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({cart.length} items)</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="md:col-span-2 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-green-100 p-4 flex flex-col gap-4 sm:flex-row">
              <img src={item.images[0]} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-green-50 shrink-0 cursor-pointer" onClick={() => nav(`/products/${item.id}`)} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm hover:text-green-700 cursor-pointer line-clamp-2" onClick={() => nav(`/products/${item.id}`)}>{item.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.seller} · {item.location}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-bold text-green-700">{fmt(item.price)}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border-2 border-green-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} className="flex h-11 w-11 items-center justify-center hover:bg-green-50 text-green-700"><Minus size={12}/></button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} className="flex h-11 w-11 items-center justify-center hover:bg-green-50 text-green-700"><Plus size={12}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from cart`} className="flex h-11 w-11 items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl border border-green-100 p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4 text-lg">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal ({cart.reduce((s,i)=>s+i.quantity,0)} items)</span><span>{fmt(cartTotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span>{DELIVERY_FEE === 0 ? "Free" : fmt(DELIVERY_FEE)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Service Fee</span><span>{fmt(500)}</span></div>
              <div className="border-t border-green-100 pt-2 flex justify-between font-black text-gray-900 text-base"><span>Total</span><span className="text-green-700">{fmt(cartTotal + DELIVERY_FEE + 500)}</span></div>
            </div>
            <Btn variant="primary" className="w-full py-3 text-base mb-3" onClick={() => nav("/checkout")}>
              <CreditCard size={16}/> Proceed to Checkout
            </Btn>
            <Btn variant="outline" className="w-full py-2.5 text-sm" onClick={() => nav("/products")}>
              Continue Shopping
            </Btn>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 justify-center">
              <Shield size={12} className="text-green-600"/><span>Secured by Paystack & Flutterwave</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

function CheckoutPage() {
  const { cart, cartTotal, lang, isLoggedIn } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: "", phone: "+234 ", address: "", lga: "", landmark: "",
    payment: "card", saveAddress: false
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({...f, [k]: v}))
  const DELIVERY = 1500
  const total = cartTotal + DELIVERY + 500

  if (!isLoggedIn) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Lock size={40} className="text-green-300 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Login Required</h2>
      <p className="text-gray-500 mb-6">Please login to complete your purchase</p>
      <Btn variant="primary" onClick={() => nav("/auth")}>Login to Continue</Btn>
    </div>
  )

  if (cart.length === 0) { nav("/cart"); return null }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-8">
        {[{n:1,label:"Address"},{n:2,label:"Payment"},{n:3,label:"Confirm"}].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 ${step >= s.n ? "text-green-700" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > s.n ? "bg-green-700 text-white" : step === s.n ? "bg-green-700 text-white ring-4 ring-green-100" : "bg-gray-200 text-gray-500"}`}>
                {step > s.n ? <Check size={14}/> : s.n}
              </div>
              <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${step > s.n ? "bg-green-700" : "bg-gray-200"}`}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {step === 1 && (
            <div className="bg-white rounded-xl border border-green-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">Delivery Address</h2>
              <div className="space-y-4">
                {[
                  { label:"Full Name", key:"name", type:"text", placeholder:"e.g. Aminu Bello" },
                  { label:"Phone Number", key:"phone", type:"tel", placeholder:"+234 803 000 1234" },
                  { label:"Street Address", key:"address", type:"text", placeholder:"House/Flat no., Street name" },
                  { label:"Landmark (Optional)", key:"landmark", type:"text", placeholder:"Near, opposite..." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border-2 border-green-200 px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-green-50/30 transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">LGA</label>
                  <select value={form.lga} onChange={e => set("lga", e.target.value)}
                    className="w-full rounded-xl border-2 border-green-200 px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-white">
                    <option value="">Select your LGA</option>
                    {LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <Btn variant="primary" className="w-full py-3 text-base" onClick={() => setStep(2)} disabled={!form.name || !form.phone || !form.address || !form.lga}>
                  Continue to Payment <ChevronRight size={16}/>
                </Btn>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-xl border border-green-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">Payment Method</h2>
              <div className="space-y-3 mb-6">
                {[
                  { id:"card",     label:"Debit/Credit Card", sub:"Visa, Mastercard (Paystack)",  icon:"💳" },
                  { id:"bank",     label:"Bank Transfer",     sub:"Instant bank payment",          icon:"🏦" },
                  { id:"ussd",     label:"USSD (*737#)",      sub:"Pay via USSD code",             icon:"📱" },
                  { id:"delivery", label:"Pay on Delivery",   sub:"Cash on delivery (Minna only)", icon:"💵" },
                ].map(p => (
                  <label key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${form.payment === p.id ? "border-green-600 bg-green-50" : "border-green-100 hover:border-green-300"}`}>
                    <input type="radio" name="payment" value={p.id} checked={form.payment === p.id} onChange={() => set("payment", p.id)} className="accent-green-700" />
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              {(form.payment === "card" || form.payment === "bank") && (
                <div className="bg-green-50 rounded-xl p-4 mb-4 text-sm text-gray-600">
                  <p className="font-semibold text-green-800 mb-1">🔒 Secured by Paystack</p>
                  <p>You will be redirected to Paystack's secure payment page to complete your transaction.</p>
                </div>
              )}
              <div className="flex gap-3">
                <Btn variant="outline" className="flex-1 py-3" onClick={() => setStep(1)}><ChevronLeft size={16}/>Back</Btn>
                <Btn variant="primary" className="flex-1 py-3" onClick={() => setStep(3)}>Review Order <ChevronRight size={16}/></Btn>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-xl border border-green-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 text-lg">Order Confirmation</h2>
              <div className="space-y-3 mb-6">
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Delivery Address</h3>
                  <p className="text-sm text-gray-900 font-medium">{form.name}</p>
                  <p className="text-sm text-gray-600">{form.phone}</p>
                  <p className="text-sm text-gray-600">{form.address}, {form.lga} LGA</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-1">Payment Method</h3>
                  <p className="text-sm text-gray-900">{{card:"💳 Card (Paystack)",bank:"🏦 Bank Transfer",ussd:"📱 USSD",delivery:"💵 Pay on Delivery"}[form.payment]}</p>
                </div>
                <div className="space-y-1.5 text-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-600">{item.name} × {item.quantity}</span>
                      <span className="font-medium">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-green-100 font-black text-base text-green-700">
                    <span>Total</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Btn variant="outline" className="flex-1 py-3" onClick={() => setStep(2)}><ChevronLeft size={16}/>Back</Btn>
                <Btn variant="gold" className="flex-1 py-3 text-base" onClick={() => nav("/dashboard?tab=orders")}>
                  <CheckCircle size={16}/> Place Order
                </Btn>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white rounded-xl border border-green-100 p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm mb-3">
              {cart.map(i => (
                <div key={i.id} className="flex gap-2">
                  <img src={i.images[0]} alt="" className="w-8 h-8 rounded-md object-cover bg-green-50"/>
                  <div className="flex-1 min-w-0"><p className="text-xs text-gray-700 truncate">{i.name}</p><p className="text-xs text-gray-400">×{i.quantity}</p></div>
                  <span className="text-xs font-medium text-gray-900">{fmt(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-green-100 pt-3 space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(cartTotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{fmt(DELIVERY)}</span></div>
              <div className="flex justify-between"><span>Service Fee</span><span>{fmt(500)}</span></div>
              <div className="flex justify-between font-black text-green-700 text-base pt-1.5 border-t border-green-100"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BuyerDashboard ───────────────────────────────────────────────────────────

function BuyerDashboard() {
  const { user, isLoggedIn, wishlist, cart } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const tab = new URLSearchParams(loc.search).get("tab") || "overview"

  if (!isLoggedIn) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Lock size={40} className="text-green-300 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Login Required</h2>
      <Btn variant="primary" onClick={() => nav("/auth")}>Login to View Dashboard</Btn>
    </div>
  )

  const orders = [
    { id:"ORD-2025-001", item:"Bida Brasswork Vase", date:"Jun 20, 2025", amount:8500,  status:"Delivered",  img:"https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=60&h=60&fit=crop&auto=format" },
    { id:"ORD-2025-002", item:"Samsung Galaxy A55",  date:"Jun 18, 2025", amount:285000, status:"In Transit", img:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=60&h=60&fit=crop&auto=format" },
    { id:"ORD-2025-003", item:"Fresh Yam 100kg",     date:"Jun 15, 2025", amount:25000,  status:"Processing", img:"https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=60&h=60&fit=crop&auto=format" },
    { id:"ORD-2025-004", item:"Groundnut Oil 25L",   date:"Jun 10, 2025", amount:21000,  status:"Delivered",  img:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=60&h=60&fit=crop&auto=format" },
  ]

  const statusColor = (s: string) =>
    s === "Delivered" ? "bg-green-100 text-green-700" : s === "In Transit" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"

  const wishedProducts = PRODUCTS.filter(p => wishlist.includes(p.id))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-green-100 p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-green-50">
              <div className="w-12 h-12 rounded-xl bg-green-700 text-white flex items-center justify-center text-lg font-black">{user?.name[0]}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role} Account</p>
              </div>
            </div>
            {[
              { id:"overview", icon:<Home size={16}/>, label:"Overview" },
              { id:"orders",   icon:<Package size={16}/>, label:"My Orders" },
              { id:"wishlist", icon:<Heart size={16}/>, label:"Wishlist" },
              { id:"settings", icon:<Settings size={16}/>, label:"Settings" },
            ].map(t => (
              <Link key={t.id} to={`/dashboard?tab=${t.id}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-1 ${tab === t.id ? "bg-green-700 text-white" : "text-gray-600 hover:bg-green-50 hover:text-green-700"}`}>
                {t.icon} {t.label}
              </Link>
            ))}
            <div className="border-t border-green-50 pt-2 mt-2">
              {user?.role === "seller" && (
                <Link to="/seller-dashboard" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <Store size={16}/> Seller Panel
                </Link>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {tab === "overview" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome back, {user?.name.split(" ")[0]}! 👋</h1>
              <div className="mb-6 grid gap-3 md:grid-cols-4">
                {[
                  { label:"Total Orders",    value:"4",    icon:<Package size={20} className="text-green-600"/>, bg:"bg-green-50" },
                  { label:"Wishlist Items",  value:wishlist.length.toString(), icon:<Heart size={20} className="text-red-500"/>, bg:"bg-red-50" },
                  { label:"Cart Items",      value:cart.reduce((s,i)=>s+i.quantity,0).toString(), icon:<ShoppingCart size={20} className="text-amber-600"/>, bg:"bg-amber-50" },
                  { label:"Delivered",       value:"2",    icon:<CheckCircle size={20} className="text-blue-600"/>, bg:"bg-blue-50" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl border border-green-100 p-4">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>{stat.icon}</div>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              <h2 className="font-bold text-gray-900 mb-3">Recent Orders</h2>
              <div className="space-y-2">
                {orders.slice(0,3).map(o => (
                  <div key={o.id} className="bg-white rounded-xl border border-green-100 p-3 flex items-center gap-3">
                    <img src={o.img} alt="" className="w-10 h-10 rounded-lg object-cover bg-green-50"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{o.item}</p>
                      <p className="text-xs text-gray-500">{o.id} · {o.date}</p>
                    </div>
                    <span className="font-bold text-green-700 text-sm">{fmt(o.amount)}</span>
                    <Badge className={statusColor(o.status)}>{o.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">My Orders</h1>
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="bg-white rounded-xl border border-green-100 p-4 flex items-center gap-4">
                    <img src={o.img} alt="" className="w-14 h-14 rounded-xl object-cover bg-green-50 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{o.item}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.id} · Ordered {o.date}</p>
                      <Badge className={`mt-1.5 ${statusColor(o.status)}`}>{o.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-700">{fmt(o.amount)}</p>
                      <Btn variant="outline" className="text-xs px-3 py-1.5 mt-2" onClick={() => {}}>Track</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "wishlist" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Wishlist ({wishedProducts.length})</h1>
              {wishedProducts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {wishedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart size={40} className="text-gray-300 mx-auto mb-3"/>
                  <p className="text-gray-500">Your wishlist is empty</p>
                  <Btn variant="primary" className="mt-4" onClick={() => nav("/products")}>Browse Products</Btn>
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Settings</h1>
              <div className="bg-white rounded-xl border border-green-100 p-6 space-y-4">
                {[
                  { label:"Full Name", val:"Aminu Bello" },
                  { label:"Email Address", val:"aminu.bello@email.com" },
                  { label:"Phone Number", val:"+234 803 456 7890" },
                  { label:"LGA", val:"Bosso" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input defaultValue={f.val} className="w-full rounded-xl border-2 border-green-200 px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 bg-green-50/30" />
                  </div>
                ))}
                <Btn variant="primary" className="px-8">Save Changes</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SellerDashboard ──────────────────────────────────────────────────────────

function SellerDashboard() {
  const { isLoggedIn } = useApp()
  const nav = useNavigate()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    void restoreSession().finally(() => setCheckingSession(false))
  }, [])

  if (checkingSession) return <div className="max-w-lg mx-auto px-4 py-20 text-center text-sm text-gray-500">Restoring your secure session...</div>

  if (!isLoggedIn && !getTokens()?.accessToken) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Lock size={40} className="text-green-300 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Login Required</h2>
      <Btn variant="primary" onClick={() => nav("/vendor-auth?mode=seller")}>Login</Btn>
    </div>
  )

  return <VendorModule />
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────

function AuthPage() {
  const { setIsLoggedIn, setUser, setCurrentSellerId, setSellerData } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  const sellerEntry = params.get("mode") === "seller" || params.get("role") === "seller" || loc.pathname.includes("vendor-auth")
  const [mode, setMode] = useState<"login"|"register"|"forgot">(params.get("mode") === "seller" ? "register" : "login")
  const [role, setRole] = useState<UserRole>(sellerEntry ? "seller" : "buyer")
  const [form, setForm] = useState({ name:"", fullName:"", email:"", phone:"+234 ", phoneNumber:"", nin:"", password:"", confirmPassword:"", lga:"" })
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}))
  const [showPw, setShowPw] = useState(false)
  const [vendorError, setVendorError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [vendorStep, setVendorStep] = useState(1)
  const [ninPhoto, setNinPhoto] = useState<File | null>(null)
  const [ninPhotoPreview, setNinPhotoPreview] = useState("")
  const [cacDocument, setCacDocument] = useState<File | null>(null)
  const [cacDocumentPreview, setCacDocumentPreview] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const ninPhotoInputRef = useRef<HTMLInputElement>(null)
  const cacDocumentInputRef = useRef<HTMLInputElement>(null)

  const handleLogin = async () => {
    const next: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address."
    if (!form.password) next.password = "Enter your password."
    setFieldErrors(next)
    setLoginError("")
    if (Object.keys(next).length) return

    if (role === "seller") {
      try {
        setSubmitting(true)
        const result = await authService.loginVendor({ email: form.email, password: form.password })
        if (result.role !== "VENDOR") throw new Error("This account is not a vendor account")
        setIsLoggedIn(true)
        setUser({ name: form.email.split("@")[0], role: "seller" })
        const seller = SELLERS[0]
        if (seller) {
          setCurrentSellerId(seller.id)
          setSellerData(seller)
        }
        nav("/seller-dashboard")
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setLoginError("Invalid email or password")
        else if (err instanceof ApiError && err.status === 403) setLoginError("Account is not active â€” contact support.")
        else if (err instanceof Error && err.message === "This account is not a vendor account") setLoginError(err.message)
        else setLoginError("Something went wrong, try again")
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      setSubmitting(true)
      const result = await authService.login({ email: form.email, password: form.password, deviceName: "ZAMANI NG MARKET HUB web" })
      const nextRole: UserRole = result.role === "VENDOR" ? "seller" : result.role === "ADMIN" ? "admin" : "buyer"
      setIsLoggedIn(true)
      setUser({ name: form.email.split("@")[0], role: nextRole })
      if (nextRole === "seller") {
        const seller = SELLERS.find((entry) => entry.name.toLowerCase().includes(form.email.split("@")[0])) || SELLERS[0]
        if (seller) {
          setCurrentSellerId(seller.id)
          setSellerData(seller)
        }
      }
      nav(nextRole === "seller" ? "/seller-dashboard" : nextRole === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setLoginError("Invalid email or password")
      else if (err instanceof ApiError && err.status === 403) setLoginError("Account is not active — contact support.")
      else if (err instanceof ApiError && err.status === 400 && err.body && typeof err.body === "object" && "message" in err.body) {
        const messages = Array.isArray(err.body.message) ? err.body.message.map(String) : [String(err.body.message)]
        const errors: Record<string, string> = {}
        messages.forEach((message) => {
          const lower = message.toLowerCase()
          if (lower.includes("email")) errors.email = message
          else if (lower.includes("password")) errors.password = message
        })
        setFieldErrors(errors)
        setLoginError(Object.keys(errors).length ? "Please correct the highlighted fields." : messages.join(" "))
      } else setLoginError("Something went wrong, try again")
    } finally {
      setSubmitting(false)
    }
  }

  const validateVendorRegistration = () => {
    const next: Record<string, string> = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address."
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) next.password = "Use an uppercase letter, lowercase letter, and a number."
    if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match."
    const fullName = form.fullName.trim()
    if (fullName.length < 2 || fullName.length > 160) next.fullName = "Full name must be between 2 and 160 characters."
    if (!form.phoneNumber.trim()) next.phoneNumber = "Enter your phone number."
    if (!/^\d{11}$/.test(form.nin)) next.nin = "NIN must be exactly 11 digits."
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

    const validateVendorStep = (step: number) => {
    const next: Record<string, string> = {}
    if (step === 1) {
      const fullName = form.fullName.trim()
      if (fullName.length < 2 || fullName.length > 160) next.fullName = "Full name must be between 2 and 160 characters."
      if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address."
      if (!form.phoneNumber.trim()) next.phoneNumber = "Enter your phone number."
    }
    if (step === 2) {
      if (!/^\d{11}$/.test(form.nin)) next.nin = "NIN must be exactly 11 digits."
      // TEMP: NIN photo made optional for testing with mock data — restore `if (!ninPhoto) next.ninPhoto = "Upload your NIN photo."` before going live.
    }
    // TEMP: CAC document made optional for testing with mock data — restore `if (!cacDocument) next.cacDocument = "Upload your CAC document."` before going live.
    if (step === 4) {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) next.password = "Use an uppercase letter, lowercase letter, and a number."
      if (form.password !== form.confirmPassword) next.confirmPassword = "Passwords do not match."
      if (!termsAccepted) next.terms = "Accept the terms to continue."
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const selectVendorFile = (field: "ninPhoto" | "cacDocument", file?: File) => {
    if (!file) return
    const allowed = field === "ninPhoto" ? ["image/jpeg", "image/png"] : ["image/jpeg", "image/png", "application/pdf"]
    if (!allowed.includes(file.type)) {
      setFieldErrors((current) => ({ ...current, [field]: field === "ninPhoto" ? "Upload a JPEG or PNG image." : "Upload a JPEG, PNG, or PDF file." }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((current) => ({ ...current, [field]: "File must be 5MB or smaller." }))
      return
    }
    setFieldErrors((current) => ({ ...current, [field]: "" }))
    if (field === "ninPhoto") {
      setNinPhoto(file)
      setNinPhotoPreview(URL.createObjectURL(file))
    } else {
      setCacDocument(file)
      setCacDocumentPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "")
    }
  }

  const continueVendorRegistration = () => {
    if (validateVendorStep(vendorStep)) setVendorStep((current) => current + 1)
  }

  const handleVendorRegistrationError = (err: unknown) => {
    if (err instanceof ApiError && err.status < 500 && err.body && typeof err.body === "object" && "message" in err.body) {
      const messages = Array.isArray(err.body.message) ? err.body.message.map(String) : [String(err.body.message)]
      const next: Record<string, string> = {}
      messages.forEach((message) => {
        const lower = message.toLowerCase()
        if (lower.startsWith("fullname") || lower.includes("full name")) next.fullName = message
        else if (lower.startsWith("email") || lower.includes("email")) next.email = message
        else if (lower.startsWith("phonenumber") || lower.includes("phone number")) next.phoneNumber = message
        else if (lower.startsWith("nin") || lower.includes("nin")) next.nin = message
        else if (lower.startsWith("password") || lower.includes("password")) next.password = message
      })
      setFieldErrors(next)
      setVendorError(Object.keys(next).length ? "Please correct the highlighted fields." : messages.join(" "))
      return
    }
    setVendorError("We could not create your vendor account. Please check your connection and try again.")
  }

  const handleRegister = async () => {
    if (role === "seller") {
      if (!validateVendorStep(4)) return
      try {
        setSubmitting(true)
        setVendorError("")
        await authService.registerVendor({
          fullName: form.fullName.trim(),
          email: form.email,
          phoneNumber: form.phoneNumber.trim(),
          nin: form.nin,
          password: form.password,
          confirmPassword: form.confirmPassword,
        })
        setIsLoggedIn(false)
        nav("/vendor-auth")
      } catch (err) {
        handleVendorRegistrationError(err)
      } finally {
        setSubmitting(false)
      }
      return
    }
    setIsLoggedIn(true)
    const userName = form.name || "New User"
    setUser({ name: userName, role })

    if (role === "seller") {
      const seller = SELLERS.find(s => s.name.toLowerCase().includes(userName.toLowerCase()))
      if (seller) {
        setCurrentSellerId(seller.id)
        setSellerData(seller)
      } else {
        setCurrentSellerId("s1")
        const defaultSeller = SELLERS.find(s => s.id === "s1")
        if (defaultSeller) setSellerData(defaultSeller)
      }
    }
    nav("/dashboard")
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-green-800 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-white -translate-x-1/2 -translate-y-1/2"/>
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-amber-400 translate-x-1/2 translate-y-1/2"/>
        </div>
        <div className="relative z-10 max-w-xs text-center">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4"><Leaf size={28} className="text-white"/></div>
          <h2 className="text-3xl font-black mb-3">ZAMANI NG <span className="text-amber-400">MARKET HUB</span></h2>
          <p className="text-green-200 text-base leading-relaxed">Niger State's largest online marketplace. Buy and sell across all 25 LGAs.</p>
          <div className="mt-8 space-y-3 text-left">
            {[
              "✅ 5,000+ verified sellers",
              "✅ Delivery across all 25 LGAs",
              "✅ Secure Paystack & Flutterwave payments",
              "✅ Local products — Bida brass, Nupe crafts & more",
              "✅ Free to register as buyer or seller",
            ].map(f => <p key={f} className="text-sm text-green-200">{f}</p>)}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center"><Leaf size={16} className="text-white"/></div>
            <span className="text-lg font-black text-green-800">ZAMANI NG <span className="text-amber-500">MARKET HUB</span></span>
          </div>

          {mode === "forgot" ? (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Reset Password</h1>
              <p className="text-gray-500 text-sm mb-6">Enter your email to receive a reset link</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>
                  {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
                </div>
                <Btn variant="primary" className="w-full py-3 text-base">Send Reset Link</Btn>
                <button onClick={()=>setMode("login")} className="w-full text-sm text-green-700 hover:underline">Back to Login</button>
              </div>
            </>
          ) : mode === "login" ? (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
              <p className="text-gray-500 text-sm mb-6">Login to your ZAMANI NG MARKET HUB account</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>
                  {fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="••••••••" className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30 pr-10"/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={16}/></button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600"><input type="checkbox" className="accent-green-700"/>Remember me</label>
                  <button onClick={()=>setMode("forgot")} className="text-green-700 hover:underline font-medium">Forgot password?</button>
                </div>
                {loginError && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
                <Btn variant="primary" className="w-full py-3 text-base" onClick={() => void handleLogin()} disabled={submitting}>{submitting ? "Logging in..." : "Login to ZAMANI NG MARKET HUB"}</Btn>
                <p className="text-center text-sm text-gray-500">Don't have an account? <button onClick={()=>setMode("register")} className="text-green-700 font-semibold hover:underline">Create one free</button></p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Join ZAMANI NG MARKET HUB</h1>
              <p className="text-gray-500 text-sm mb-4">Create your free account today</p>
              {/* Role toggle */}
              <div className="flex rounded-xl border-2 border-green-200 overflow-hidden mb-5">
                <button onClick={()=>setRole("buyer")} className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${role==="buyer"?"bg-green-700 text-white":"text-gray-600 hover:bg-green-50"}`}><ShoppingBag size={14}/> Buy</button>
                <button onClick={()=>setRole("seller")} className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${role==="seller"?"bg-green-700 text-white":"text-gray-600 hover:bg-green-50"}`}><Store size={14}/> Sell</button>
              </div>
              {role === "seller" && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800 flex items-start gap-2"><Award size={14} className="shrink-0 mt-0.5"/><span>Seller accounts require ID verification. Start listing products free within 24 hours of approval.</span></div>}
              {role === "seller" ? <div className="space-y-4">
                {(() => {
                  const steps = ["Account", "NIN verification", "CAC document", "Security"]
                  return <>
                    <div className="mb-6">
                      <div className="flex items-center">
                        {steps.map((step, index) => <React.Fragment key={step}><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index + 1 <= vendorStep ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"}`}>{index + 1}</div>{index < steps.length - 1 && <div className={`h-1 flex-1 ${index + 1 < vendorStep ? "bg-green-700" : "bg-gray-200"}`} />}</React.Fragment>)}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500"><span>Step {vendorStep} of 4 · {steps[vendorStep - 1]}</span><span>{vendorStep < 4 ? `Next: ${steps[vendorStep]}` : "Final step"}</span></div>
                    </div>
                    {vendorStep === 1 && <><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label><input type="text" placeholder="Aminu Bello" value={form.fullName} onChange={e=>set("fullName",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>{fieldErrors.fullName && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.fullName}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label><input type="email" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>{fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.email}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label><input type="tel" value={form.phoneNumber} onChange={e=>set("phoneNumber",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>{fieldErrors.phoneNumber && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.phoneNumber}</p>}</div></>}
                    {vendorStep === 2 && <><div><label className="block text-sm font-medium text-gray-700 mb-1.5">NIN</label><input type="text" inputMode="numeric" maxLength={11} value={form.nin} onChange={e=>set("nin",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>{fieldErrors.nin && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.nin}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">NIN Photo</label><input ref={ninPhotoInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={e=>selectVendorFile("ninPhoto", e.target.files?.[0])}/><div onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); selectVendorFile("ninPhoto", e.dataTransfer.files[0]) }} onClick={()=>ninPhotoInputRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-green-200 bg-green-50/30 p-5 text-center text-sm text-gray-600"><Upload size={20} className="mx-auto mb-2 text-green-700"/>Drop a JPEG or PNG here, or click to browse<br/><span className="text-xs text-gray-500">Maximum file size: 5MB</span></div>{ninPhoto && <div className="mt-2 flex items-center gap-3 rounded-xl border border-green-100 p-2">{ninPhotoPreview && <img src={ninPhotoPreview} alt="NIN preview" className="h-12 w-12 rounded-lg object-cover"/>}<span className="min-w-0 flex-1 truncate text-sm text-gray-700">{ninPhoto.name}</span><button type="button" onClick={()=>{ setNinPhoto(null); setNinPhotoPreview(""); if (ninPhotoInputRef.current) ninPhotoInputRef.current.value = "" }} className="text-sm font-medium text-red-600">Remove</button></div>}{fieldErrors.ninPhoto && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.ninPhoto}</p>}</div></>}
                    {vendorStep === 3 && <div><label className="block text-sm font-medium text-gray-700 mb-1.5">CAC Document</label><input ref={cacDocumentInputRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={e=>selectVendorFile("cacDocument", e.target.files?.[0])}/><div onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); selectVendorFile("cacDocument", e.dataTransfer.files[0]) }} onClick={()=>cacDocumentInputRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-green-200 bg-green-50/30 p-5 text-center text-sm text-gray-600"><Upload size={20} className="mx-auto mb-2 text-green-700"/>Drop a JPEG, PNG, or PDF here, or click to browse<br/><span className="text-xs text-gray-500">Maximum file size: 5MB</span></div>{cacDocument && <div className="mt-2 flex items-center gap-3 rounded-xl border border-green-100 p-2">{cacDocumentPreview ? <img src={cacDocumentPreview} alt="CAC preview" className="h-12 w-12 rounded-lg object-cover"/> : <FileText size={24} className="text-green-700"/>}<span className="min-w-0 flex-1 truncate text-sm text-gray-700">{cacDocument.name}</span><button type="button" onClick={()=>{ setCacDocument(null); setCacDocumentPreview(""); if (cacDocumentInputRef.current) cacDocumentInputRef.current.value = "" }} className="text-sm font-medium text-red-600">Remove</button></div>}{fieldErrors.cacDocument && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.cacDocument}</p>}</div>}
                    {vendorStep === 4 && <><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label><div className="relative"><input type={showPw?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Use uppercase, lowercase, and a number" className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30 pr-10"/><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={16}/></button></div>{fieldErrors.password && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}</div><div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label><input type={showPw?"text":"password"} value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/>{fieldErrors.confirmPassword && <p className="mt-1 text-xs font-semibold text-red-600">{fieldErrors.confirmPassword}</p>}</div><label className="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 accent-green-700"/>I agree to the Terms of Service and Privacy Policy.</label>{fieldErrors.terms && <p className="-mt-2 text-xs font-semibold text-red-600">{fieldErrors.terms}</p>}</>}
                    {vendorError && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{vendorError}</p>}
                    <div className="flex items-center justify-between pt-2">{vendorStep > 1 ? <button type="button" onClick={()=>setVendorStep(current=>current-1)} className="text-sm font-semibold text-green-700 hover:underline">← Back</button> : <span />}{vendorStep < 4 ? <Btn variant="primary" onClick={continueVendorRegistration}>Continue <ArrowRight size={16}/></Btn> : <Btn variant="primary" onClick={() => void handleRegister()} disabled={submitting}>{submitting ? "Creating account..." : "Create Seller Account"} <ArrowRight size={16}/></Btn>}</div>
                  </>
                })()}
                <p className="text-center text-sm text-gray-500">Already have an account? <button onClick={()=>setMode("login")} className="text-green-700 font-semibold hover:underline">Login here</button></p>
              </div> : <div className="space-y-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label><input type="text" placeholder="Aminu Bello" value={form.name} onChange={e=>set("name",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label><input type="email" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label><input type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">LGA</label><select value={form.lga} onChange={e=>set("lga",e.target.value)} className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-white"><option value="">Select your LGA</option>{LGAS.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label><div className="relative"><input type={showPw?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min. 8 characters" className="w-full rounded-xl border-2 border-green-200 px-4 py-3 text-sm focus:outline-none focus:border-green-600 bg-green-50/30 pr-10"/><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={16}/></button></div></div>
                <Btn variant="primary" className="w-full py-3 text-base" onClick={() => void handleRegister()}>Create Buyer Account <ArrowRight size={16}/></Btn>
                <p className="text-center text-xs text-gray-400">By registering you agree to our <a href="#" className="text-green-700 underline">Terms of Service</a> and <a href="#" className="text-green-700 underline">Privacy Policy</a></p><p className="text-center text-sm text-gray-500">Already have an account? <button onClick={()=>setMode("login")} className="text-green-700 font-semibold hover:underline">Login here</button></p>
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SearchResultsPage ────────────────────────────────────────────────────────

function SearchResultsPage() {
  const { lang } = useApp()
  const loc = useLocation()
  const q = new URLSearchParams(loc.search).get("q") || ""
  const [selectedCat, setSelectedCat] = useState("")
  const [sortBy, setSortBy] = useState("featured")

  const results = PRODUCTS.filter(p =>
    q ? (p.name.toLowerCase().includes(q.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(q.toLowerCase())) || p.category.toLowerCase().includes(q.toLowerCase())) : true
  ).filter(p => selectedCat ? p.category === selectedCat : true)
   .sort((a, b) => sortBy === "price-asc" ? a.price - b.price : sortBy === "price-desc" ? b.price - a.price : sortBy === "rating" ? b.rating - a.rating : 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Search results for "<span className="text-green-700">{q}</span>"</h1>
        <p className="text-sm text-gray-500 mt-0.5">{results.length} products found across Niger State</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={()=>setSelectedCat("")} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCat?"bg-green-700 text-white":"border border-green-200 text-gray-600 hover:border-green-400"}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={()=>setSelectedCat(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${selectedCat===c.id?"bg-green-700 text-white":"border border-green-200 text-gray-600 hover:border-green-400"}`}>
            {c.icon} {lang==="ha"?c.nameHa:c.name}
          </button>
        ))}
        <div className="ml-auto">
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="text-sm rounded-lg border border-green-200 px-3 py-1.5 bg-white focus:outline-none text-gray-700">
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No results for "{q}"</h2>
          <p className="text-gray-500 text-sm mb-6">Try different keywords or browse by category</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors">
            <Grid size={16}/> Browse All Products
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────

function AdminPanel() {
  const { isLoggedIn, user } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<"overview"|"users"|"products"|"categories">("overview")

  if (!isLoggedIn || user?.role !== "admin") return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Shield size={40} className="text-gray-300 mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Admin Access Required</h2>
      <p className="text-gray-500 mb-4">Login with an admin account to access this panel</p>
      <Btn variant="primary" onClick={()=>nav("/auth")}>Login</Btn>
      <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700 border border-amber-200">
        Demo: Login and then set role to "admin" to preview this panel
      </div>
    </div>
  )

  const adminStats = [
    { label:"Total Users",     value:"12,453", icon:<Users size={20} className="text-blue-600"/>,  bg:"bg-blue-50" },
    { label:"Active Sellers",  value:"3,891",  icon:<Store size={20} className="text-green-600"/>,  bg:"bg-green-50" },
    { label:"Total Products",  value:"47,230", icon:<Package size={20} className="text-purple-600"/>, bg:"bg-purple-50" },
    { label:"Pending Approval",value:"234",    icon:<AlertCircle size={20} className="text-amber-600"/>, bg:"bg-amber-50" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1><p className="text-sm text-gray-500">ZAMANI NG MARKET HUB Platform Management</p></div>
        <Badge className="bg-red-100 text-red-700 px-3 py-1.5"><Shield size={12}/> Admin</Badge>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b-2 border-green-100 mb-6">
        {(["overview","users","products","categories"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`min-h-11 shrink-0 px-5 py-3 text-sm font-semibold border-b-2 -mb-[2px] capitalize transition-colors ${tab===t?"border-green-700 text-green-700":"border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {adminStats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-green-100 p-4">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Platform Revenue</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={SALES_DATA.map(d=>({...d,revenue:d.revenue*10}))}>
                <defs><linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#15803d" stopOpacity={0.2}/><stop offset="95%" stopColor="#15803d" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4"/>
                <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₦${(v/1000000).toFixed(1)}M`}/>
                <Tooltip formatter={(v:number)=>[`₦${v.toLocaleString()}`, "Revenue"]}/>
                <Area type="monotone" dataKey="revenue" stroke="#15803d" strokeWidth={2.5} fill="url(#adminRev)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="overflow-x-auto rounded-xl border border-green-100 bg-white">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-green-50 border-b border-green-100">
              <tr>{["User","LGA","Role","Joined","Status","Actions"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {[
                { name:"Aminu Bello",    lga:"Bosso",     role:"Buyer",  joined:"Jun 2024", status:"Active" },
                { name:"Bida Craft Hub", lga:"Bida",      role:"Seller", joined:"Mar 2021", status:"Verified" },
                { name:"Hauwa Suleiman", lga:"Chanchaga", role:"Buyer",  joined:"Jan 2025", status:"Active" },
                { name:"Niger Farm Direct",lga:"Lavun",   role:"Seller", joined:"Jan 2019", status:"Verified" },
                { name:"Musa Ibrahim",   lga:"Lapai",     role:"Buyer",  joined:"Apr 2025", status:"Pending" },
              ].map((u, i) => (
                <tr key={i} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.lga}</td>
                  <td className="px-4 py-3"><Badge className={u.role==="Seller"?"bg-green-100 text-green-700":"bg-blue-100 text-blue-700"}>{u.role}</Badge></td>
                  <td className="px-4 py-3 text-gray-500">{u.joined}</td>
                  <td className="px-4 py-3"><Badge className={u.status==="Active"?"bg-emerald-100 text-emerald-700":u.status==="Verified"?"bg-blue-100 text-blue-700":"bg-amber-100 text-amber-700"}>{u.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button aria-label={`View ${u.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50"><Eye size={13}/></button><button aria-label={`Edit ${u.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"><Edit size={13}/></button><button aria-label={`Delete ${u.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={13}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "products" && (
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending Approval ({PRODUCTS.length})</h3>
            <div className="flex gap-2">
              <Btn variant="primary" className="text-xs px-3 py-2"><Check size={12}/> Approve All</Btn>
            </div>
          </div>
          <div className="space-y-3">
            {PRODUCTS.slice(0, 5).map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-green-100 p-3 flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-green-50"/>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">by {p.seller} · {p.lga}</p>
                </div>
                <span className="font-bold text-green-700 text-sm">{fmt(p.price)}</span>
                <div className="flex w-full gap-1.5 sm:w-auto">
                  <Btn variant="primary" className="text-xs px-3 py-1.5"><Check size={11}/> Approve</Btn>
                  <Btn variant="outline" className="text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"><X size={11}/> Reject</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">All Categories</h3>
            <Btn variant="primary" className="text-sm"><Plus size={14}/> Add Category</Btn>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {CATEGORIES.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-green-100 p-4">
                <div className="text-3xl mb-2">{c.icon}</div>
                <h4 className="font-semibold text-gray-900 text-sm">{c.name}</h4>
                <p className="text-xs text-gray-500 mb-3">{c.count} products</p>
                <div className="flex gap-1.5">
                  <button className="flex-1 text-xs py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-1"><Edit size={11}/> Edit</button>
                  <button aria-label={`Delete ${c.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={11}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/vendor-auth" element={<Layout><AuthPage /></Layout>} />
          <Route path="/seller-dashboard" element={<Layout><SellerDashboard /></Layout>} />
          <Route path="/seller/:id" element={<Layout><SellerStorefront /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
          <Route path="/*" element={<BuyerModule />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
