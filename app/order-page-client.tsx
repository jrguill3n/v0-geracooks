"use client"

import type React from "react"
import Image from "next/image"
import { InfoTooltip } from "@/components/info-tooltip"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"

interface OrderPageClientProps {
  menuItems: Record<string, Array<{ name: string; price: number; description?: string }>>
}

export function OrderPageClient({ menuItems }: OrderPageClientProps) {
  const [customerName, setCustomerName] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [orderItems, setOrderItems] = useState<Record<string, number>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)
  const [notificationType, setNotificationType] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

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

  const updateQuantity = (itemName: string, change: number) => {
    setOrderItems((prev) => {
      const newQuantity = (prev[itemName] || 0) + change
      if (newQuantity <= 0) {
        const { [itemName]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemName]: newQuantity }
    })
  }

  const getTotalItems = () => {
    return Object.values(orderItems).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    let total = 0
    Object.entries(orderItems).forEach(([itemName, quantity]) => {
      const item = Object.values(menuItems)
        .flat()
        .find((i) => i.name === itemName)
      if (item) {
        total += item.price * quantity
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

      if (!response.ok) {
        throw new Error(`Failed to save order: ${JSON.stringify(responseData)}`)
      }

      setNotificationSent(responseData.notificationSent || false)
      setNotificationType(responseData.notificationType || null)
      setNotificationError(responseData.notificationError || null)
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
                <p className="text-sm text-success font-semibold">
                  ✓ {notificationType} notification sent successfully
                </p>
              </div>
            ) : (
              <div className="bg-warning/10 border-2 border-warning/30 rounded-2xl p-4 mb-6">
                <p className="text-sm text-warning font-semibold">⚠ Notification not sent</p>
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
              setNotificationType(null)
              setNotificationError(null)
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
      <div className="bg-gradient-to-br from-primary/5 via-white to-secondary/30">
        <div className="max-w-2xl mx-auto px-6 py-6">
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
                            {orderItems[item.name] || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.name, 1)}
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
    </div>
  )
}
