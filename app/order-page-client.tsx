"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"

interface OrderPageClientProps {
  menuItems: Record<string, Array<{ name: string; price: number }>>
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
      <div className="min-h-screen bg-gradient-to-br from-cream via-white to-secondary flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center bg-white border-2 border-primary/20 shadow-2xl rounded-2xl">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-serif text-4xl mb-4 text-foreground font-bold tracking-tight">Thank You!</h1>
            <p className="text-foreground/70 leading-relaxed text-lg mb-6">
              Thank you for submitting your order, we will get in contact for your delivery.
            </p>
            {notificationSent ? (
              <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 mb-6">
                <p className="text-sm text-primary font-semibold">
                  ✓ {notificationType} notification sent successfully
                </p>
              </div>
            ) : (
              <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4 mb-6">
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-lg"
          >
            Place Another Order
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-secondary pb-40">
      <div className="bg-white border-b-2 border-primary/10 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={180} height={180} className="object-contain mb-4" />
            <p className="text-base font-bold text-primary tracking-wide">631-578-0700</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white border-2 border-primary/10 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-serif text-2xl font-bold mb-6 text-foreground tracking-tight">Your Information</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground/80 tracking-wide">Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border-2 border-input focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 rounded-xl text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground/80 tracking-wide">Phone Number</label>
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
          <div key={category} className="mb-8">
            <div className="bg-white border-2 border-primary/10 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b-2 border-primary/10 p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground tracking-tight">{category}</h2>
              </div>
              <div className="p-6">
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-4 hover:bg-primary/5 px-4 -mx-4 rounded-xl transition-all duration-200"
                    >
                      <div className="flex-1">
                        <p className="text-foreground font-semibold text-lg">{item.name}</p>
                        <p className="text-xl font-bold text-primary mt-1">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, -1)}
                          disabled={!orderItems[item.name]}
                          className="h-11 w-11 p-0 bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary/20 disabled:opacity-30 disabled:bg-muted rounded-xl font-bold"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="w-10 text-center font-bold text-foreground text-lg">
                          {orderItems[item.name] || 0}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, 1)}
                          className="h-11 w-11 p-0 bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 rounded-xl font-bold shadow-md"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center py-6">
          <p className="text-base text-foreground/60 italic font-medium">
            Nuestros empaques son de 1 libra y sirven aproximadamente 2 porciones.
          </p>
        </div>
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary border-t-2 border-primary/20 p-6 z-[100] shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-0">
              <div>
                <p className="text-sm font-bold text-primary-foreground/90 tracking-wide mb-1">
                  Total Items: {getTotalItems()}
                </p>
                <p className="font-serif text-4xl font-bold text-primary-foreground tracking-tight">
                  ${getTotalPrice()}
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-white text-primary font-bold hover:bg-primary-foreground/95 shadow-xl px-10 py-7 text-lg rounded-xl border-2 border-primary-foreground/10"
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
