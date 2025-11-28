"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag } from "lucide-react"

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
      const orderData = {
        customerName,
        phone: countryCode + phoneNumber,
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
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center bg-background border-elegant">
          <div className="mb-6">
            <div className="w-16 h-16 bg-accent rounded-full mx-auto flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="font-serif text-3xl mb-4 text-foreground">Thank You!</h1>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Thank you for submitting your order, we will get in contact for your delivery.
            </p>
            {notificationSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800 font-medium">
                  ✓ {notificationType} notification sent successfully
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium">⚠ Notification not sent</p>
                {notificationError && (
                  <p className="text-xs text-yellow-700 mt-2 break-words">Error: {notificationError}</p>
                )}
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
            className="w-full bg-primary text-primary-foreground"
          >
            Place Another Order
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex flex-col items-center text-center">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={160} height={160} className="object-contain mb-3" />
            <p className="text-sm font-semibold text-gray-700">631-578-0700</p>
          </div>
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-36 px-3 py-2 bg-white border border-gray-300 rounded-md focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium text-gray-900"
                >
                  <option value="+1">+1 (US)</option>
                  <option value="+52">+52 (Mexico)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (Australia)</option>
                  <option value="+43">+43 (Austria)</option>
                  <option value="+32">+32 (Belgium)</option>
                  <option value="+55">+55 (Brazil)</option>
                  <option value="+1">+1 (Canada)</option>
                  <option value="+56">+56 (Chile)</option>
                  <option value="+86">+86 (China)</option>
                  <option value="+57">+57 (Colombia)</option>
                  <option value="+506">+506 (Costa Rica)</option>
                  <option value="+45">+45 (Denmark)</option>
                  <option value="+593">+593 (Ecuador)</option>
                  <option value="+20">+20 (Egypt)</option>
                  <option value="+503">+503 (El Salvador)</option>
                  <option value="+358">+358 (Finland)</option>
                  <option value="+33">+33 (France)</option>
                  <option value="+49">+49 (Germany)</option>
                  <option value="+30">+30 (Greece)</option>
                  <option value="+502">+502 (Guatemala)</option>
                  <option value="+504">+504 (Honduras)</option>
                  <option value="+852">+852 (Hong Kong)</option>
                  <option value="+91">+91 (India)</option>
                  <option value="+62">+62 (Indonesia)</option>
                  <option value="+353">+353 (Ireland)</option>
                  <option value="+972">+972 (Israel)</option>
                  <option value="+39">+39 (Italy)</option>
                  <option value="+81">+81 (Japan)</option>
                  <option value="+254">+254 (Kenya)</option>
                  <option value="+60">+60 (Malaysia)</option>
                  <option value="+31">+31 (Netherlands)</option>
                  <option value="+64">+64 (New Zealand)</option>
                  <option value="+505">+505 (Nicaragua)</option>
                  <option value="+47">+47 (Norway)</option>
                  <option value="+507">+507 (Panama)</option>
                  <option value="+51">+51 (Peru)</option>
                  <option value="+63">+63 (Philippines)</option>
                  <option value="+48">+48 (Poland)</option>
                  <option value="+351">+351 (Portugal)</option>
                  <option value="+1">+1 (Puerto Rico)</option>
                  <option value="+40">+40 (Romania)</option>
                  <option value="+7">+7 (Russia)</option>
                  <option value="+966">+966 (Saudi Arabia)</option>
                  <option value="+65">+65 (Singapore)</option>
                  <option value="+27">+27 (South Africa)</option>
                  <option value="+82">+82 (South Korea)</option>
                  <option value="+34">+34 (Spain)</option>
                  <option value="+46">+46 (Sweden)</option>
                  <option value="+41">+41 (Switzerland)</option>
                  <option value="+886">+886 (Taiwan)</option>
                  <option value="+66">+66 (Thailand)</option>
                  <option value="+90">+90 (Turkey)</option>
                  <option value="+971">+971 (UAE)</option>
                  <option value="+598">+598 (Uruguay)</option>
                  <option value="+58">+58 (Venezuela)</option>
                  <option value="+84">+84 (Vietnam)</option>
                </select>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 bg-white border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Select country code and enter phone number</p>
            </div>
          </div>
        </div>

        {Object.entries(menuItems).map(([category, items]) => (
          <div key={category} className="mb-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-teal-100 to-blue-100 border-b border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-900">{category}</h2>
              </div>
              <div className="p-4">
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-3 hover:bg-gray-50 px-3 -mx-3 rounded-md transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{item.name}</p>
                        <p className="text-base font-bold text-teal-400">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, -1)}
                          disabled={!orderItems[item.name]}
                          className="h-9 w-9 p-0 bg-teal-300 text-white border-teal-400 hover:bg-teal-400 disabled:opacity-30 disabled:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-gray-900">{orderItems[item.name] || 0}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, 1)}
                          className="h-9 w-9 p-0 bg-teal-300 text-white border-teal-400 hover:bg-teal-400"
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
        ))}

        <div className="text-center py-4">
          <p className="text-sm text-gray-600 italic">
            Nuestros empaques son de 1 libra y sirven aproximadamente 2 porciones.
          </p>
        </div>
      </div>

      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-teal-600 border-t border-teal-700 p-4 z-[100] shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white/90">Total Items: {getTotalItems()}</p>
                <p className="text-2xl font-bold text-white">${getTotalPrice()}</p>
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-white text-teal-600 font-bold hover:bg-gray-100 shadow-md px-8"
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
