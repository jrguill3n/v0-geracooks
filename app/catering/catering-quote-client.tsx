"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Minus, Plus, X, ChevronUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  servesLabel?: string // e.g. "6-8 pax", "20 pax"
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
      {
        id: "b01",
        name: "Trifle cups individuales (compota de berries, yogurt griego, granola)",
        price: 4.0,
      },
      {
        id: "b02",
        name: "Waffle & pancake bar (Mini waffles, mini pancakes, fruta, miel, tocino y almond butter)",
        price: 140.0,
        servesLabel: "20 pax",
      },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIN_PER_UNIT = 20

function isServesItem(item: CateringItem) {
  return !!item.servesLabel
}

function minQty(item: CateringItem) {
  return isServesItem(item) ? 1 : MIN_PER_UNIT
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuantityStepper({
  item,
  qty,
  onChange,
}: {
  item: CateringItem
  qty: number
  onChange: (newQty: number) => void
}) {
  const min = minQty(item)

  const decrement = () => {
    if (qty <= 0) return
    const next = qty - 1
    // snap to 0 if going below min (but above 0)
    onChange(next < min ? 0 : next)
  }

  const increment = () => {
    if (qty === 0) {
      onChange(min)
    } else {
      onChange(qty + 1)
    }
  }

  const showError = qty > 0 && qty < min

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={decrement}
          disabled={qty === 0}
          aria-label="Reducir cantidad"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-indigo-100"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-9 text-center font-bold text-gray-800 text-base tabular-nums">{qty}</span>
        <button
          type="button"
          onClick={increment}
          aria-label="Aumentar cantidad"
          className="h-11 w-11 rounded-full flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {showError && (
        <p className="text-xs text-red-500 font-medium text-right">Mínimo {min} unidades</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Cart = Record<string, number> // itemId -> qty

export function CateringQuoteClient() {
  const { toast } = useToast()

  // Cart
  const [cart, setCart] = useState<Cart>({})

  // People calculator
  const [people, setPeople] = useState<string>("")

  // Contact form
  const [nombre, setNombre] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [direccion, setDireccion] = useState("")
  const [notas, setNotas] = useState("")

  // UI state
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSummarySheet, setShowSummarySheet] = useState(false)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pillsRef = useRef<HTMLDivElement>(null)

  // ─── Derived ────────────────────────────────────────────────────────────────

  const allItems = CATEGORIES.flatMap((c) => c.items)

  const selectedItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = allItems.find((i) => i.id === id)!
      return { item, qty }
    })

  const hasValidationErrors = selectedItems.some(
    ({ item, qty }) => qty > 0 && qty < minQty(item),
  )

  const subtotal = selectedItems.reduce((sum, { item, qty }) => {
    if (item.priceUnknown) return sum
    return sum + item.price * qty
  }, 0)

  const totalUnits = selectedItems.reduce((sum, { qty }) => sum + qty, 0)

  const suggestedPieces = people ? Number.parseInt(people, 10) * 5 : null

  const canSubmit =
    nombre.trim().length > 0 &&
    phone.trim().length > 0 &&
    selectedItems.length > 0 &&
    !hasValidationErrors

  // ─── Scroll spy ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute("data-category") ?? "")
          }
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
    const offset = 90
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: "smooth" })
  }

  // ─── Cart actions ────────────────────────────────────────────────────────────

  const setQty = useCallback((id: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: qty }
    })
  }, [])

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const payload = {
        contact: { nombre, phone: countryCode + phone, email, fecha, hora, direccion, notas },
        people: people ? Number.parseInt(people, 10) : null,
        items: selectedItems.map(({ item, qty }) => ({
          id: item.id,
          name: item.name,
          qty,
          unitPrice: item.priceUnknown ? null : item.price,
          lineTotal: item.priceUnknown ? null : item.price * qty,
        })),
        subtotal,
      }

      await fetch("/api/catering-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setSubmitted(true)
      setCart({})
      setShowSummarySheet(false)
    } catch {
      toast({ title: "Error", description: "Hubo un problema al enviar. Intenta de nuevo.", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success screen ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Solicitud enviada</h1>
          <p className="text-gray-600 leading-relaxed mb-8">
            Recibimos tu cotización. Nos pondremos en contacto contigo a la brevedad para confirmar detalles y precios.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors"
          >
            Armar otra cotización
          </button>
        </div>
        <Toaster />
      </div>
    )
  }

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-white to-slate-50">
      <Toaster />

      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <Image src="/gera-logo.png" alt="Gera Cooks" width={100} height={100} className="object-contain h-12 w-auto" />
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Catering</h1>
              <p className="text-sm text-gray-500 max-w-xs text-balance hidden sm:block">
                Arma tu cotización en minutos
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
          <p className="text-sm text-gray-500 sm:hidden text-balance">
            Arma tu cotización en minutos. Selecciona piezas, ajusta cantidades y envíanos tu solicitud.
          </p>
          <p className="text-sm text-gray-500 hidden sm:block text-balance">
            Selecciona piezas, ajusta cantidades y envíanos tu solicitud.
          </p>
        </div>
      </header>

      {/* Sticky category pills */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div
          ref={pillsRef}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => scrollToCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.name
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body: two-column on desktop */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">

        {/* Left: items + contact */}
        <div className="space-y-6">

          {/* Helper note */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
            <p className="text-sm text-indigo-800 leading-relaxed">
              El pedido mínimo de cada item es de 20 unidades, a excepción de los que marcan a cuántas personas sirven. Sugerimos un mínimo de 5 piezas por persona.
            </p>
          </div>

          {/* People calculator */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Calculadora de porciones</h2>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                placeholder="Número de personas"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                className="flex-1 rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
              />
              {suggestedPieces !== null && !Number.isNaN(suggestedPieces) && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Sugerido</p>
                  <p className="text-lg font-bold text-indigo-600">{suggestedPieces} pzas</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Orientativo: 5 piezas por persona.</p>
          </div>

          {/* Categories */}
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              ref={(el) => { sectionRefs.current[cat.name] = el }}
              data-category={cat.name}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{cat.name}</h2>
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cat.items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {cat.items.map((item) => {
                    const qty = cart[item.id] ?? 0
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-indigo-50/40 transition-colors"
                      >
                        <div className="flex-1 pr-4 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {item.priceUnknown ? (
                              <span className="text-sm font-semibold text-amber-600">Precio a confirmar</span>
                            ) : (
                              <span className="text-sm font-bold text-indigo-600">{fmt(item.price)}</span>
                            )}
                            {item.servesLabel && (
                              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">
                                {item.servesLabel}
                              </span>
                            )}
                            {!item.servesLabel && (
                              <span className="text-xs text-gray-400">/ unidad</span>
                            )}
                          </div>
                        </div>
                        <QuantityStepper item={item} qty={qty} onChange={(q) => setQty(item.id, q)} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Contact form */}
          <div id="contact-form" className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-5">
            <h2 className="text-base font-bold text-gray-800 mb-4">Datos de contacto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <PhoneInput
                  countryCode={countryCode}
                  phoneNumber={phone}
                  onCountryCodeChange={setCountryCode}
                  onPhoneNumberChange={setPhone}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Fecha del evento
                  </label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Hora
                  </label>
                  <Input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Dirección / Ubicación
                </label>
                <Input
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ciudad o dirección del evento"
                  className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 h-11"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Notas adicionales
                </label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Restricciones alimentarias, tipo de evento, etc."
                  rows={3}
                  className="rounded-xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit (mobile, below form) */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg transition-colors text-base"
            >
              {submitting ? "Enviando..." : "Solicitar cotización"}
            </button>
            {!canSubmit && selectedItems.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-2">Agrega al menos un item para continuar.</p>
            )}
            {!canSubmit && selectedItems.length > 0 && (!nombre || !phone) && (
              <p className="text-xs text-gray-400 text-center mt-2">Completa nombre y teléfono para continuar.</p>
            )}
          </div>
        </div>

        {/* Right: quote summary (desktop) */}
        <aside className="hidden lg:block sticky top-24">
          <QuoteSummary
            selectedItems={selectedItems}
            subtotal={subtotal}
            totalUnits={totalUnits}
            canSubmit={canSubmit}
            submitting={submitting}
            hasValidationErrors={hasValidationErrors}
            onSubmit={handleSubmit}
            nombre={nombre}
            phone={phone}
          />
        </aside>
      </div>

      {/* Mobile floating bar — visible only when items selected */}
      {selectedItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg px-4 pt-2 pb-4 safe-area-bottom">
          {selectedItems.some(({ item }) => item.priceUnknown) && (
            <p className="text-xs text-amber-600 text-center mb-1.5">
              Algunos artículos pueden tener precio a confirmar.
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowSummarySheet(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-between px-5"
          >
            <span className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnits} pzas
              </span>
              <span>Ver cotización</span>
            </span>
            <span className="font-bold">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Mobile bottom sheet — shadcn Sheet side="bottom" */}
      <Sheet open={showSummarySheet} onOpenChange={setShowSummarySheet}>
        <SheetContent
          side="bottom"
          className="lg:hidden h-[85vh] p-0 flex flex-col rounded-t-3xl overflow-hidden"
        >
          <SheetHeader className="px-5 py-4 border-b border-gray-100 shrink-0">
            <SheetTitle className="text-base font-bold text-gray-900">Tu cotización</SheetTitle>
          </SheetHeader>

          {/* Scrollable items list */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            <QuoteSummaryItems
              selectedItems={selectedItems}
              totalUnits={totalUnits}
              hasValidationErrors={hasValidationErrors}
              canSubmit={canSubmit}
              nombre={nombre}
              phone={phone}
            />
          </div>

          {/* Sticky footer */}
          <SheetFooter className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 flex-col gap-2">
            {selectedItems.some(({ item }) => item.priceUnknown) && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed w-full">
                Algunos artículos pueden tener precio a confirmar.
              </p>
            )}
            <div className="flex items-center justify-between w-full mb-1">
              <div>
                <p className="text-xs text-gray-500">{totalUnits} piezas totales</p>
                <p className="text-xs text-gray-400">Subtotal estimado</p>
              </div>
              <p className="text-2xl font-bold text-indigo-700">{fmt(subtotal)}</p>
            </div>
            {!canSubmit && (!nombre || !phone) && selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowSummarySheet(false)
                  setTimeout(() => {
                    const el = document.getElementById("contact-form")
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 100
                      window.scrollTo({ top, behavior: "smooth" })
                    }
                  }, 300)
                }}
                className="w-full text-sm text-indigo-600 font-semibold py-2 flex items-center justify-center gap-1 hover:text-indigo-800"
              >
                <ChevronUp className="w-4 h-4" />
                Completar datos de contacto
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { handleSubmit(e); setShowSummarySheet(false) }}
              disabled={!canSubmit || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg transition-colors text-base"
            >
              {submitting ? "Enviando..." : "Solicitar cotización"}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Quote Summary Items (used inside the bottom sheet scroll area) ───────────

function QuoteSummaryItems({
  selectedItems,
  totalUnits,
  hasValidationErrors,
  canSubmit,
  nombre,
  phone,
}: {
  selectedItems: { item: CateringItem; qty: number }[]
  totalUnits: number
  hasValidationErrors: boolean
  canSubmit: boolean
  nombre: string
  phone: string
}) {
  return (
    <div className="space-y-3">
      {selectedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">Aún no has seleccionado ningún item.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {selectedItems.map(({ item, qty }) => (
            <div key={item.id} className="flex items-start justify-between gap-2 py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{qty} {item.servesLabel ? "unidad(es)" : "pzas"}</p>
              </div>
              <div className="text-right shrink-0">
                {item.priceUnknown ? (
                  <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">Precio a confirmar</span>
                ) : (
                  <p className="text-sm font-bold text-indigo-700">{fmt(item.price * qty)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasValidationErrors && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <p className="text-xs text-red-600 font-medium">
            Algunos items tienen cantidades inválidas. Corrige antes de enviar.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Quote Summary component (desktop sidebar) ────────────────────────────────

function QuoteSummary({
  selectedItems,
  subtotal,
  totalUnits,
  canSubmit,
  submitting,
  hasValidationErrors,
  onSubmit,
  nombre,
  phone,
  inSheet = false,
}: {
  selectedItems: { item: CateringItem; qty: number }[]
  subtotal: number
  totalUnits: number
  canSubmit: boolean
  submitting: boolean
  hasValidationErrors: boolean
  onSubmit: (e: React.FormEvent) => void
  nombre: string
  phone: string
  inSheet?: boolean
}) {
  const scrollToContact = () => {
    const el = document.getElementById("contact-form")
    if (el) {
      const offset = 100
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

  return (
    <div className={`bg-white ${inSheet ? "" : "rounded-2xl shadow-sm border border-gray-100"} overflow-hidden`}>
      {!inSheet && (
        <div className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
          <h2 className="text-base font-bold text-white">Resumen de cotización</h2>
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {selectedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Aún no has seleccionado ningún item.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedItems.map(({ item, qty }) => (
                <div key={item.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-400">{qty} {item.servesLabel ? "unidad(es)" : "pzas"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.priceUnknown ? (
                      <span className="text-xs text-amber-600 font-semibold whitespace-nowrap">Precio a confirmar</span>
                    ) : (
                      <p className="text-sm font-bold text-indigo-700">{fmt(item.price * qty)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{totalUnits} piezas totales</p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Subtotal estimado</p>
                  <p className="text-xl font-bold text-indigo-700">{fmt(subtotal)}</p>
                </div>
              </div>
              {selectedItems.some(({ item }) => item.priceUnknown) && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  Algunos artículos pueden tener precio a confirmar.
                </p>
              )}
            </div>
          </>
        )}

        {hasValidationErrors && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-xs text-red-600 font-medium">
              Algunos items tienen cantidades inválidas. Corrige antes de enviar.
            </p>
          </div>
        )}

        {!canSubmit && (!nombre || !phone) && selectedItems.length > 0 && (
          <button
            type="button"
            onClick={scrollToContact}
            className="w-full text-sm text-indigo-600 font-semibold py-2 flex items-center justify-center gap-1 hover:text-indigo-800"
          >
            <ChevronUp className="w-4 h-4" />
            Completar datos de contacto
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg transition-colors text-base"
        >
          {submitting ? "Enviando..." : "Solicitar cotización"}
        </button>
      </div>
    </div>
  )
}
