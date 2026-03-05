"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Minus, Plus, Sparkles, ChevronDown, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/phone-input"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

// ─── Data ────────────────────────────────────────────────────────────────────

export interface CateringItem {
  id: string
  name: string
  price: number
  priceUnknown?: boolean
  servesLabel?: string
  unitLabel?: string
}

export interface CateringCategory {
  name: string
  items: CateringItem[]
}

const CATEGORIES: CateringCategory[] = [
  {
    name: "Appetizers",
    items: [
      { id: "a01", name: "Brochetas caprese", price: 2.0 },
      { id: "a02", name: "Mini albóndigas res BBQ", price: 2.0 },
      { id: "a03", name: "Mini sandwich de pavo y pesto", price: 1.9 },
      { id: "a04", name: "Mini sandwich de jamón y queso", price: 1.5 },
      { id: "a05", name: "Mini sandwich de ensalada de pollo", price: 1.8 },
      { id: "a06", name: "Papitas cambray al cilantro", price: 1.2 },
      { id: "a07", name: "Dátiles rellenos de roquefort y nuez", price: 1.5 },
      { id: "a08", name: "Volován con mousse de salmón ahumado", price: 2.5 },
      { id: "a09", name: "Volován grande de ensalada de pollo", price: 2.5 },
      { id: "a10", name: "Sliders de frijoles y carnitas", price: 3.0 },
      { id: "a11", name: "Sliders de pulled pork y Cole slaw", price: 3.0 },
      { id: "a12", name: "Shot de coctel de camarón", price: 2.5 },
      { id: "a13", name: "Bruschetta de queso de cabra y champiñones al vino blanco", price: 2.5 },
      { id: "a14", name: "Tortilla española", price: 1.5 },
      { id: "a15", name: "Pinchito de prosciutto y melón", price: 0, priceUnknown: true },
      { id: "a16", name: "Ensalada de mango, arándano, queso de cabra, cashews y vinagreta de poppy seed", price: 4.0 },
      { id: "a17", name: "Ensalada de espinacas, uvas, roquefort, nuez garapiñada y vinagreta balsámica", price: 4.0 },
      { id: "a18", name: "Ensalada de arúgula, betabel, queso feta, pistaches y vinagreta de miel y mostaza", price: 4.0 },
      { id: "a19", name: "Brocheta de frutas", price: 2.0 },
      { id: "a20", name: "Rosca de sushi", price: 48.0, servesLabel: "6-8 pax" },
      { id: "a21", name: "Camarones spicy", price: 25.0 },
      { id: "a22", name: "Platón de crudités con humus", price: 80.0, servesLabel: "20 pax" },
      { id: "a23", name: "Tabla de charcutería y quesos", price: 160.0, servesLabel: "20 pax" },
      { id: "a24", name: "Hogaza rellena de dip de alcachofa y parmesano", price: 28.0 },
      { id: "a25", name: "Dip de ostión ahumado con ajonjolí", price: 13.0 },
      { id: "a26", name: "Tronco de queso de cabra con arándano y nuez", price: 20.0 },
      { id: "a27", name: "Hojaldre con queso brie y mermelada de chiles", price: 28.0 },
      { id: "a28", name: "Cupcakes vainilla decoración lisa", price: 2.0 },
      { id: "a29", name: "Cupcakes chocolate decoración lisa", price: 2.0 },
    ],
  },
  {
    name: "Breakfast / Brunch",
    items: [
      { id: "b01", name: "Trifle cups individuales (compota de berries, yogurt griego, granola)", price: 4.0 },
      { id: "b02", name: "Waffle & pancake bar (Mini waffles, mini pancakes, fruta, miel, tocino y almond butter)", price: 140.0, servesLabel: "20 pax" },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIN_PER_UNIT = 20

const PIECES_APPROX: Record<string, number> = {
  a20: 30,
  a22: 100,
  a23: 100,
  b02: 100,
}

function isServesItem(item: CateringItem) {
  return !!item.servesLabel
}

function minQty(item: CateringItem) {
  return isServesItem(item) ? 1 : MIN_PER_UNIT
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

// ─── Auto-build ───────────────────────────────────────────────────────────────

type AutoStyle = "ligero" | "estandar" | "abundante"
type EventType = "reunion" | "cumpleanos" | "corporativo"

const STYLE_PPP: Record<AutoStyle, number> = { ligero: 4, estandar: 5, abundante: 6 }

const TRAY_TABLA   = "a23"
const TRAY_CRUDITE = "a22"
const TRAY_ROSCA   = "a20"

const POOLS: Record<EventType, { trays: string[]; premium: string[]; hearty: string[]; light: string[]; dessert: string[] }> = {
  corporativo: { trays: [TRAY_TABLA, TRAY_CRUDITE], premium: ["a08", "a13", "a07", "a15", "a01"], hearty: ["a03", "a04", "a05"], light: ["a16", "a17", "a18"], dessert: ["a19"] },
  cumpleanos:  { trays: [TRAY_CRUDITE, TRAY_TABLA], premium: ["a10", "a11", "a02"], hearty: ["a03", "a04", "a05", "a06"], light: ["a16"], dessert: ["a28", "a29"] },
  reunion:     { trays: [TRAY_ROSCA, TRAY_TABLA],   premium: ["a08", "a13", "a01"], hearty: ["a03", "a10", "a02", "a14"], light: ["a16", "a17"], dessert: ["a19", "a28"] },
}

const ALL_POOL_IDS = [...new Set(Object.values(POOLS).flatMap((p) => [...p.trays, ...p.premium, ...p.hearty, ...p.light, ...p.dessert]))]

function buildMenuCart(peopleNum: number, style: AutoStyle, eventType: EventType, baseCart: Cart = {}): Cart {
  const ppp = STYLE_PPP[style]
  const targetPieces = peopleNum * ppp
  const cart: Cart = { ...baseCart }
  const pool = POOLS[eventType]
  for (const id of ALL_POOL_IDS) cart[id] = 0

  let usedEquiv = 0
  if (eventType === "corporativo") {
    if (peopleNum >= 18) { cart[TRAY_TABLA] = 1; usedEquiv += 100 }
    if (peopleNum >= 20 && style !== "ligero") { cart[TRAY_CRUDITE] = 1; usedEquiv += 100 }
  } else if (eventType === "cumpleanos") {
    if (peopleNum >= 20 && style !== "ligero") { cart[TRAY_CRUDITE] = 1; usedEquiv += 100 }
  } else {
    if (peopleNum >= 20) { cart[TRAY_TABLA] = 1; usedEquiv += 100 }
    else if (peopleNum >= 6) { cart[TRAY_ROSCA] = 1; usedEquiv += 35 }
  }

  const remaining = Math.max(0, targetPieces - usedEquiv)
  const distribute = (ids: string[], totalPieces: number, count: number) => {
    if (totalPieces <= 0 || ids.length === 0) return
    const selected = ids.slice(0, count)
    const base = Math.floor(totalPieces / selected.length)
    const rounded = Math.ceil(Math.max(base, MIN_PER_UNIT) / MIN_PER_UNIT) * MIN_PER_UNIT
    for (const id of selected) cart[id] = rounded
  }

  if (eventType === "corporativo") {
    const premiumTarget = Math.round(remaining * 0.65)
    const lightTarget   = Math.round(remaining * 0.25)
    const sweetTarget   = remaining - premiumTarget - lightTarget
    const premiumPool   = (style === "abundante" || peopleNum >= 25) ? pool.premium : pool.premium.filter((id) => !["a10","a11"].includes(id))
    distribute(premiumPool, premiumTarget, peopleNum <= 15 ? 3 : 4)
    distribute(pool.light,   lightTarget, 1)
    distribute(pool.dessert, sweetTarget, 1)
  } else if (eventType === "cumpleanos") {
    const heartyTarget  = Math.round(remaining * 0.65)
    const lightTarget   = Math.round(remaining * 0.10)
    const dessertTarget = remaining - heartyTarget - lightTarget
    distribute(pool.premium, heartyTarget, peopleNum <= 15 ? 2 : 3)
    distribute(pool.hearty,  lightTarget, 1)
    if (dessertTarget > 0) {
      const half = Math.ceil(Math.max(MIN_PER_UNIT, Math.round(peopleNum * 0.6 / 2) * 2) / 2 / MIN_PER_UNIT) * MIN_PER_UNIT
      cart["a28"] = half; cart["a29"] = half
    }
  } else {
    const savoryTarget = Math.round(remaining * 0.60)
    const lightTarget  = Math.round(remaining * 0.20)
    const sweetTarget  = remaining - savoryTarget - lightTarget
    distribute([...pool.premium, ...pool.hearty], savoryTarget, peopleNum <= 15 ? 3 : 5)
    distribute(pool.light,   lightTarget, 1)
    distribute(pool.dessert, sweetTarget, 1)
  }
  return cart
}

// ─── Cart type ────────────────────────────────────────────────────────────────

type Cart = Record<string, number>

// ─── QuantityStepper ─────────────────────────────────────────────────────────

function QuantityStepper({ item, qty, onChange }: { item: CateringItem; qty: number; onChange: (q: number) => void }) {
  const min = minQty(item)
  const decrement = () => { if (qty <= 0) return; onChange(qty - 1 < min ? 0 : qty - 1) }
  const increment = () => onChange(qty === 0 ? min : qty + 1)
  const showError = qty > 0 && qty < min

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={qty === 0}
          aria-label="Reducir"
          className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className={`w-8 text-center font-bold text-sm tabular-nums ${qty > 0 ? "text-primary" : "text-gray-400"}`}>{qty}</span>
        <button
          type="button"
          onClick={increment}
          aria-label="Aumentar"
          className="h-9 w-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {showError && <p className="text-[10px] text-red-500 font-medium">Mín. {min} uds.</p>}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CateringQuoteClient() {
  const { toast } = useToast()

  // Cart
  const [cart, setCart] = useState<Cart>({})

  // Event size
  const [people, setPeople] = useState(20)

  // Contact form
  const [nombre, setNombre]         = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [phone, setPhone]           = useState("")
  const [email, setEmail]           = useState("")
  const [fecha, setFecha]           = useState("")
  const [hora, setHora]             = useState("")
  const [direccion, setDireccion]   = useState("")
  const [notas, setNotas]           = useState("")

  // UI
  const [activeCategory, setActiveCategory]   = useState(CATEGORIES[0].name)
  const [showSummarySheet, setShowSummarySheet] = useState(false)
  const [showContactSheet, setShowContactSheet] = useState(false)
  const [showAutoSheet, setShowAutoSheet]       = useState(false)
  const [submitting, setSubmitting]             = useState(false)
  const [submitted, setSubmitted]               = useState(false)

  // Auto-build
  const [autoStyle, setAutoStyle]   = useState<AutoStyle>("estandar")
  const [eventType, setEventType]   = useState<EventType>("reunion")
  const [showReplaceModal, setShowReplaceModal] = useState(false)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pillsRef    = useRef<HTMLDivElement>(null)

  // ─── Derived ──────────────────────────────────────────────────────────────

  const allItems = CATEGORIES.flatMap((c) => c.items)

  const selectedItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: allItems.find((i) => i.id === id)!, qty }))

  const hasValidationErrors = selectedItems.some(({ item, qty }) => qty > 0 && qty < minQty(item))

  const subtotal = selectedItems.reduce((sum, { item, qty }) => item.priceUnknown ? sum : sum + item.price * qty, 0)

  const totalUnits = selectedItems.reduce((sum, { qty }) => sum + qty, 0)

  const suggestedPieces = people * 5

  const selectedPieces = selectedItems.reduce((sum, { item, qty }) => {
    return isServesItem(item) ? sum + (PIECES_APPROX[item.id] ?? 20) * qty : sum + qty
  }, 0)

  const progressPct = suggestedPieces > 0 ? Math.min(100, Math.round((selectedPieces / suggestedPieces) * 100)) : 0
  const hasReachedTarget = selectedPieces >= suggestedPieces

  const canSubmit = nombre.trim().length > 0 && phone.trim().length > 0 && selectedItems.length > 0 && !hasValidationErrors

  // ─── Scroll spy ───────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveCategory(entry.target.getAttribute("data-category") ?? "")
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )
    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref)
    }
    return () => observer.disconnect()
  }, [])

  const scrollToCategory = (name: string) => {
    const el = sectionRefs.current[name]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 106
    window.scrollTo({ top, behavior: "smooth" })
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) { const next = { ...prev }; delete next[id]; return next }
      return { ...prev, [id]: qty }
    })
  }, [])

  // ─── Auto-build ───────────────────────────────────────────────────────────

  const hasExistingItems = Object.values(cart).some((q) => q > 0)

  const applyGenerate = useCallback((mode: "replace" | "add") => {
    const base = mode === "add" ? cart : {}
    const newCart = buildMenuCart(people, autoStyle, eventType, base)
    setCart(newCart)
    const label = eventType === "reunion" ? "Reunión" : eventType === "cumpleanos" ? "Cumpleaños" : "Corporativo"
    toast({ title: "Menú generado", description: `Sugerencia para ${people} personas · ${label}. Puedes ajustar cantidades.`, duration: 4000 })
    setShowAutoSheet(false)
    setTimeout(() => {
      const el = sectionRefs.current[CATEGORIES[0].name]
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" })
    }, 200)
  }, [people, autoStyle, eventType, cart, toast])

  const handleAutoGenerate = useCallback(() => {
    if (hasExistingItems) setShowReplaceModal(true)
    else applyGenerate("replace")
  }, [hasExistingItems, applyGenerate])

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await fetch("/api/catering-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { nombre, phone: countryCode + phone, email, fecha, hora, direccion, notas },
          people,
          items: selectedItems.map(({ item, qty }) => ({
            id: item.id, name: item.name, qty,
            unitPrice: item.priceUnknown ? null : item.price,
            lineTotal: item.priceUnknown ? null : item.price * qty,
          })),
          subtotal,
        }),
      })
      setSubmitted(true)
      setCart({})
      setShowContactSheet(false)
      setShowSummarySheet(false)
    } catch {
      toast({ title: "Error", description: "Hubo un problema al enviar. Intenta de nuevo.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitud enviada</h1>
          <p className="text-gray-500 leading-relaxed text-sm">
            Recibimos tu cotización. Nos pondremos en contacto contigo a la brevedad para confirmar detalles y precios.
          </p>
          <button type="button" onClick={() => setSubmitted(false)}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-md hover:opacity-90 transition-opacity">
            Armar otra cotización
          </button>
        </div>
        <Toaster />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Toaster />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Image src="/gera-logo.png" alt="Gera Cooks" width={80} height={80} className="h-10 w-auto object-contain" />
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase">Gera Cooks</p>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Catering</h1>
            <p className="text-xs text-gray-400 leading-snug">Arma tu cotización en minutos.</p>
          </div>
        </div>
      </header>

      {/* ── Event Size + Progress (pinned below header on scroll) ── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 space-y-3">

          {/* People stepper */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ¿Para cuántas personas es tu evento?
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPeople((p) => Math.max(1, p - 1))}
                  className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors font-bold text-lg"
                  aria-label="Menos personas"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-gray-900 tabular-nums w-24 text-center">
                  {people} <span className="text-sm font-normal text-gray-500">personas</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPeople((p) => p + 1)}
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                  aria-label="Más personas"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-bold text-primary tabular-nums">{suggestedPieces} piezas sugeridas</p>
                <p className="text-[11px] text-gray-400">~5 piezas por persona</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-600">Piezas seleccionadas</p>
              <p className={`text-xs font-bold tabular-nums ${hasReachedTarget ? "text-green-600" : "text-primary"}`}>
                {selectedPieces} / {suggestedPieces}
              </p>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  hasReachedTarget
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : "bg-gradient-to-r from-primary to-primary/70"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className={`text-xs mt-1 ${hasReachedTarget ? "text-green-600 font-semibold" : "text-gray-400"}`}>
              {hasReachedTarget
                ? "Tu selección cubre el evento."
                : `Te faltan ~${suggestedPieces - selectedPieces} piezas para la recomendación.`}
            </p>
          </div>

          {/* AI suggestion button */}
          <button
            type="button"
            onClick={() => setShowAutoSheet(true)}
            className="flex items-center gap-2 text-sm text-primary font-semibold hover:opacity-80 transition-opacity py-0.5"
          >
            <Sparkles className="w-4 h-4" />
            Sugerir menú automáticamente
          </button>
        </div>
      </div>

      {/* ── Sticky Category Pills ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div ref={pillsRef} className="max-w-2xl mx-auto px-4 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => scrollToCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.name
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-primary/8 text-primary hover:bg-primary/15"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Menu Items ── */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            ref={(el) => { sectionRefs.current[cat.name] = el }}
            data-category={cat.name}
          >
            <div className="flex items-center gap-2 px-1 mb-3">
              <h2 className="text-base font-bold text-gray-900">{cat.name}</h2>
              <span className="text-xs text-gray-400 font-medium">{cat.items.length} opciones</span>
            </div>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const qty = cart[item.id] ?? 0
                const active = qty > 0
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm border transition-all duration-150 ${
                      active ? "border-primary/30 bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    {/* Active indicator */}
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${active ? "bg-primary" : "bg-transparent"}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.priceUnknown ? (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                            Precio a confirmar
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-primary">
                            {fmt(item.price)}
                            {!item.servesLabel && <span className="text-xs font-normal text-gray-400"> / unidad</span>}
                          </span>
                        )}
                        {item.servesLabel && (
                          <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium">
                            {item.servesLabel}
                          </span>
                        )}
                        {!item.servesLabel && (
                          <span className="text-[10px] text-gray-400">mín. {MIN_PER_UNIT} piezas</span>
                        )}
                      </div>
                    </div>

                    {/* Stepper */}
                    <QuantityStepper item={item} qty={qty} onChange={(q) => setQty(item.id, q)} />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Sticky Bottom Bar ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg px-4 pt-2 pb-4 safe-area-bottom">
          <button
            type="button"
            onClick={() => setShowSummarySheet(true)}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-md flex items-center justify-between px-5 hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnits} pzas
              </span>
              <span className="text-sm">Ver cotización</span>
            </span>
            <span className="font-bold text-sm">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* ── Quote Summary Sheet ── */}
      <Sheet open={showSummarySheet} onOpenChange={setShowSummarySheet}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col rounded-t-3xl overflow-hidden">
          <SheetHeader className="px-5 py-4 border-b border-gray-100 shrink-0">
            <SheetTitle className="text-base font-bold text-gray-900">Resumen de cotización</SheetTitle>
          </SheetHeader>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {selectedItems.map(({ item, qty }) => (
              <div key={item.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">× {qty}</p>
                </div>
                <div className="text-right shrink-0">
                  {item.priceUnknown ? (
                    <span className="text-xs font-semibold text-amber-600">Precio a confirmar</span>
                  ) : (
                    <p className="text-sm font-bold text-primary">{fmt(item.price * qty)}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Total piezas</p>
                <p className="text-sm font-bold text-gray-800">{totalUnits}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Total estimado</p>
                <p className="text-xl font-bold text-primary">{fmt(subtotal)}</p>
              </div>
              {selectedItems.some(({ item }) => item.priceUnknown) && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed mt-2">
                  Algunos artículos pueden tener precio a confirmar.
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => { setShowSummarySheet(false); setShowContactSheet(true) }}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-md hover:opacity-90 transition-opacity text-sm"
            >
              Enviar solicitud
            </button>
            <button
              type="button"
              onClick={() => setShowSummarySheet(false)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Editar selección
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Contact Form Sheet ── */}
      <Sheet open={showContactSheet} onOpenChange={setShowContactSheet}>
        <SheetContent side="bottom" className="h-[92vh] p-0 flex flex-col rounded-t-3xl overflow-hidden">
          <SheetHeader className="px-5 py-4 border-b border-gray-100 shrink-0">
            <SheetTitle className="text-base font-bold text-gray-900">Datos de contacto</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Nombre <span className="text-red-400">*</span>
              </label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre completo"
                className="rounded-xl h-11 border-gray-200" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Teléfono <span className="text-red-400">*</span>
              </label>
              <PhoneInput countryCode={countryCode} phoneNumber={phone} onCountryCodeChange={setCountryCode} onPhoneNumberChange={setPhone} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com"
                className="rounded-xl h-11 border-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha</label>
                <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-xl h-11 border-gray-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hora</label>
                <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="rounded-xl h-11 border-gray-200" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Dirección / Ubicación
              </label>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ciudad o dirección del evento"
                className="rounded-xl h-11 border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Notas adicionales
              </label>
              <Textarea value={notas} onChange={(e) => setNotas(e.target.value)}
                placeholder="Restricciones alimentarias, tipo de evento, etc." rows={3}
                className="rounded-xl border-gray-200 resize-none" />
            </div>
          </div>

          <SheetFooter className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex-col gap-2">
            {!canSubmit && (!nombre || !phone) && (
              <p className="text-xs text-gray-400 text-center">Completa nombre y teléfono para continuar.</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity text-sm"
            >
              {submitting ? "Enviando..." : "Solicitar cotización"}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Auto-build Sheet ── */}
      <Sheet open={showAutoSheet} onOpenChange={setShowAutoSheet}>
        <SheetContent side="bottom" className="h-auto p-0 flex flex-col rounded-t-3xl overflow-hidden">
          <SheetHeader className="px-5 py-4 border-b border-gray-100 shrink-0">
            <SheetTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Sugerir menú automáticamente
            </SheetTitle>
          </SheetHeader>

          <div className="px-5 py-5 space-y-5">
            {/* Tipo de evento */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de evento</p>
              <div className="grid grid-cols-3 gap-2">
                {(["reunion", "cumpleanos", "corporativo"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEventType(v)}
                    className={`py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border ${
                      eventType === v
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    {v === "reunion" ? "Reunión" : v === "cumpleanos" ? "Cumpleaños" : "Corporativo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Estilo */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estilo</p>
              <div className="grid grid-cols-3 gap-2">
                {(["ligero", "estandar", "abundante"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAutoStyle(s)}
                    className={`py-3 rounded-2xl text-sm font-semibold transition-all duration-150 border ${
                      autoStyle === s
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    {s === "ligero" ? "Ligero" : s === "estandar" ? "Estándar" : "Abundante"}
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">{STYLE_PPP[s]} pzas/p.</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Se generará una selección balanceada para <span className="font-semibold text-gray-600">{people} personas</span>, con un objetivo de {people * STYLE_PPP[autoStyle]} piezas.
            </p>
          </div>

          <SheetFooter className="px-5 pb-6 pt-2 bg-white shrink-0 flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="flex-1 min-h-[48px] bg-primary text-primary-foreground font-bold rounded-2xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generar menú sugerido
              </button>
              <button
                type="button"
                onClick={() => { setCart({}); setShowAutoSheet(false) }}
                title="Reiniciar selección"
                className="h-12 px-4 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Replace-or-add modal ── */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReplaceModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">¿Qué deseas hacer?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ya tienes items en tu selección. ¿Reemplazarlos con la nueva sugerencia o sumarla?
            </p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => { setShowReplaceModal(false); applyGenerate("replace") }}
                className="w-full min-h-[44px] bg-primary text-primary-foreground font-bold rounded-2xl transition-colors hover:opacity-90">
                Reemplazar
              </button>
              <button type="button" onClick={() => { setShowReplaceModal(false); applyGenerate("add") }}
                className="w-full min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl transition-colors">
                Sumar a lo que tengo
              </button>
              <button type="button" onClick={() => setShowReplaceModal(false)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
