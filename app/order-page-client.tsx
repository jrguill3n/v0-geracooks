"use client"

import type React from "react"
import Image from "next/image"
import { InfoTooltip } from "@/components/info-tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"

interface MenuItem {
  id: string
  name: string
  price: number
  description?: string
  extras?: Array<{ id: string; name: string; price: number }>
}

interface OrderPageClientProps {
  menuItems: Record<string, MenuItem[]>
}

interface OrderItem {
  quantity: number
  extras: string[] // Array of extra IDs
}

export function OrderPageClient({ menuItems }: OrderPageClientProps) {
  const [customerName, setCustomerName] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [twilioErrorDetails, setTwilioErrorDetails] = useState<any>(null)

  const [selectedItemForExtras, setSelectedItemForExtras] = useState<MenuItem | null>(null)
  const [tempExtras, setTempExtras] = useState<string[]>([])

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const categories = Object.keys(menuItems)
    return { [categories[0]]: true }
  })

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const toggleSection = (category: string) => {
    setExpandedSections((prev) => ({ ...prev, [category]: !prev[category] }))
  }

  const scrollToSection = (category: string) => {
    const section = sectionRefs.current[category]
    if (section) {
      const offset = 200
      const top = section.offsetTop - offset
      window.scrollTo({ top, behavior: "smooth" })

      if (!expandedSections[category]) {
        setExpandedSections((prev) => ({ ...prev, [category]: true }))
      }
    }
  }

  const handleAddItem = (item: MenuItem) => {
    if (item.extras && item.extras.length > 0) {
      setSelectedItemForExtras(item)
      setTempExtras(orderItems[item.name]?.extras || [])
    } else {
      updateQuantity(item.name, 1)
    }
  }

  const updateQuantity = (itemName: string, change: number, newExtras?: string[]) => {
    setOrderItems((prev) => {
      const currentItem = prev[itemName]
      const newQuantity = (currentItem?.quantity || 0) + change

      if (newQuantity <= 0) {
        const { [itemName]: _, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [itemName]: {
          quantity: newQuantity,
          extras: newExtras !== undefined ? newExtras : currentItem?.extras || [],
        },
      }
    })
  }

  const confirmExtras = () => {
    if (selectedItemForExtras) {
      updateQuantity(selectedItemForExtras.name, 1, tempExtras)
      setSelectedItemForExtras(null)
      setTempExtras([])
    }
  }

  const getTotalItems = () => {
    return Object.values(orderItems).reduce((sum, item) => sum + item.quantity, 0)
  }

  const getTotalPrice = () => {
    let total = 0
    Object.entries(orderItems).forEach(([itemName, orderItem]) => {
      const item = Object.values(menuItems)
        .flat()
        .find((i) => i.name === itemName)
      if (item) {
        let itemPrice = item.price
        orderItem.extras.forEach((extraId) => {
          const extra = item.extras?.find((e) => e.id === extraId)
          if (extra) {
            itemPrice += extra.price
          }
        })
        total += itemPrice * orderItem.quantity
      }
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !phoneNumber || getTotalItems() === 0) {
      alert("Please fill in your name, phone number, and select at least one item")
      return
    }

    setIsSubmitting(true)

    try {
      const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "")

      const orderData = {
        customerName,
        phone: countryCode + cleanedPhoneNumber,
        orderItems,
        totalPrice: getTotalPrice(),
      }

      console.log("[v0] Submitting order:", orderData)

      const response = await fetch("/api/save-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const responseData = await response.json()
      console.log("[v0] Order response:", responseData)

      if (responseData.twilioErrorDetails) {
        console.log("[v0] Twilio error details:", responseData.twilioErrorDetails)
      }

      if (!response.ok) {
        throw new Error(`Failed to save order: ${JSON.stringify(responseData)}`)
      }

      setNotificationSent(responseData.notificationSent || false)
      setNotificationError(responseData.notificationError || null)
      setTwilioErrorDetails(responseData.twilioErrorDetails || null)
      setOrderSubmitted(true)
    } catch (error) {
      console.error("[v0] Error submitting order:", error)
      alert(`There was an error saving your order: ${error}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center bg-white border-0 shadow-2xl rounded-3xl">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl mb-4 text-foreground font-bold">Thank You!</h1>
            <p className="text-foreground/70 leading-relaxed text-lg mb-6">
              Thank you for submitting your order, we will get in contact for your delivery.
            </p>
            {notificationSent ? (
              <div className="bg-success/10 border-2 border-success/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-success font-semibold">✓ SMS notification sent successfully</p>
              </div>
            ) : (
              <div className="bg-warning/10 border-2 border-warning/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-warning font-semibold">⚠ SMS notification not sent</p>
                {notificationError && <p className="text-xs text-warning/80 mt-2 break-words">{notificationError}</p>}
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setOrderSubmitted(false)
              setCustomerName("")
              setCountryCode("+1")
              setPhoneNumber("")
              setOrderItems({})
              setNotificationSent(false)
              setNotificationError(null)
              setTwilioErrorDetails(null)
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg rounded-2xl shadow-lg"
          >
            Place Another Order
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30 pb-40">
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-6 py-2">
          <div className="flex flex-col items-center text-center">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={220} height={220} className="object-contain" />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-white shadow-md border-b border-primary/10">
        <div className="max-w-2xl mx-auto px-4 py-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {Object.keys(menuItems).map((category) => (
              <button
                key={category}
                onClick={() => scrollToSection(category)}
                className="px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all duration-200 whitespace-nowrap shadow-sm"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="bg-white border-0 rounded-3xl shadow-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4 text-foreground">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 h-12 rounded-2xl text-sm shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Phone Number</label>
              <PhoneInput
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setCountryCode}
                onPhoneNumberChange={setPhoneNumber}
              />
            </div>
          </div>
        </div>

        {Object.entries(menuItems).map(([category, items]) => (
          <div
            key={category}
            className="mb-4"
            ref={(el) => {
              sectionRefs.current[category] = el
            }}
          >
            <div className="bg-white border-0 rounded-3xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection(category)}
                className="w-full bg-gradient-to-r from-primary via-primary/95 to-primary/90 p-4 flex items-center justify-between hover:from-primary/95 hover:via-primary/90 hover:to-primary/85 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{category}</h2>
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="text-white">
                  {expandedSections[category] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedSections[category] ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="p-4">
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between py-3 hover:bg-primary/5 px-3 -mx-3 rounded-2xl transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-foreground font-bold text-base">{item.name}</p>
                            <InfoTooltip description={item.description || ""} itemName={item.name} price={item.price} />
                          </div>
                          <p className="text-lg font-bold text-[color:var(--teal)] mt-0.5">${item.price}</p>
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-xs text-purple-600 font-semibold mt-1">+ Extras available</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.name, -1)}
                            disabled={!orderItems[item.name]}
                            className="h-10 w-10 p-0 bg-primary/10 text-primary border-0 hover:bg-primary/20 disabled:opacity-30 disabled:bg-muted rounded-full font-bold shadow-sm"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-foreground text-base">
                            {orderItems[item.name]?.quantity || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddItem(item)}
                            className="h-10 w-10 p-0 bg-primary text-white border-0 hover:bg-primary/90 rounded-full font-bold shadow-md"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center py-4">
          <p className="text-sm text-foreground/60 italic font-medium">
            Nuestros empaques son de 1 libra y sirven aproximadamente 2 porciones.
          </p>
        </div>

        <div className="bg-white border-0 rounded-3xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-center text-foreground">Contact Us</h2>
          <div className="space-y-3">
            <a
              href="tel:+16315780700"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Phone</p>
                <p className="text-base font-bold text-primary">+1 631 578 0700</p>
              </div>
            </a>

            <a
              href="mailto:geraguillent@gmail.com"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Email</p>
                <p className="text-base font-bold text-primary">geraguillent@gmail.com</p>
              </div>
            </a>

            <a
              href="https://instagram.com/gera.cooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.668.07-4.948.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Instagram</p>
                <p className="text-base font-bold text-primary">@gera.cooks</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary p-6 z-[100] shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white/90 tracking-wide mb-1">Total Items: {getTotalItems()}</p>
                <p className="text-4xl font-bold text-white">${getTotalPrice()}</p>
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-white text-primary font-bold hover:bg-white/95 shadow-xl px-10 py-7 text-lg rounded-2xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!selectedItemForExtras} onOpenChange={(open) => !open && setSelectedItemForExtras(null)}>
        <DialogContent className="border-2 border-purple-300 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Extras to {selectedItemForExtras?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select optional extras for this item:</p>
            {selectedItemForExtras?.extras?.map((extra) => (
              <div key={extra.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={extra.id}
                  checked={tempExtras.includes(extra.id)}
                  onCheckedChange={(checked) => {
                    setTempExtras((prev) => (checked ? [...prev, extra.id] : prev.filter((id) => id !== extra.id)))
                  }}
                />
                <Label htmlFor={extra.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{extra.name}</span>
                    <span className="text-teal-400 font-bold">+${extra.price}</span>
                  </div>
                </Label>
              </div>
            ))}
            <Button
              onClick={confirmExtras}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl"
            >
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
