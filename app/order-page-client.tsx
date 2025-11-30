"use client"

import { useRef } from "react"
import { useState } from "react"
import type React from "react"
import Image from "next/image"
import { InfoTooltip } from "@/components/info-tooltip"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingBag, ChevronDown, ChevronUp, Check } from "lucide-react"

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

const OrderPageClient = ({ menuItems }: OrderPageClientProps) => {
  const [customerName, setCustomerName] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)
  const [notificationType, setNotificationType] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  const [expandedItemExtras, setExpandedItemExtras] = useState<Record<string, boolean>>({})
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string[]>>({})

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

  const handleAddItem = (itemName: string) => {
    const extras = selectedExtras[itemName] || []
    updateQuantity(itemName, 1, extras)
  }

  const updateQuantity = (itemName: string, change: number, newExtras?: string[]) => {
    setOrderItems((prev) => {
      const currentItem = prev[itemName]
      const newQuantity = (currentItem?.quantity || 0) + change

      if (newQuantity <= 0) {
        const { [itemName]: _, ...rest } = prev
        setSelectedExtras((prevExtras) => {
          const { [itemName]: _, ...restExtras } = prevExtras
          return restExtras
        })
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

  const toggleItemExtras = (itemName: string) => {
    setExpandedItemExtras((prev) => ({ ...prev, [itemName]: !prev[itemName] }))
  }

  const toggleExtra = (itemName: string, extraId: string) => {
    setSelectedExtras((prev) => {
      const current = prev[itemName] || []
      const updated = current.includes(extraId) ? current.filter((id) => id !== extraId) : [...current, extraId]
      return { ...prev, [itemName]: updated }
    })
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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

      <div className="max-w-4xl mx-auto px-3 pb-32 space-y-3">
        {Object.entries(menuItems).map(([category, items]) => (
          <div key={category} ref={(el) => (sectionRefs.current[category] = el)}>
            <button
              onClick={() => toggleSection(category)}
              className="w-full flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border-2 border-purple-100 hover:border-purple-300 transition-all mb-2"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-semibold">
                  {items.length}
                </span>
              </div>
              {expandedSections[category] ? (
                <ChevronUp className="h-5 w-5 text-purple-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-purple-600" />
              )}
            </button>

            {expandedSections[category] && (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.name} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-base">{item.name}</h3>
                            {item.description && (
                              <InfoTooltip description={item.description} itemName={item.name} price={item.price} />
                            )}
                          </div>
                          <p className="text-lg font-bold text-teal-400">${Number(item.price).toFixed(2)}</p>
                          {item.extras && item.extras.length > 0 && (
                            <button
                              onClick={() => toggleItemExtras(item.name)}
                              className="mt-2 text-xs text-purple-600 font-semibold flex items-center gap-1 hover:text-purple-700"
                            >
                              {expandedItemExtras[item.name] ? "Hide" : "Show"} options ({item.extras.length})
                              {expandedItemExtras[item.name] ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {orderItems[item.name] ? (
                            <>
                              <button
                                onClick={() => updateQuantity(item.name, -1)}
                                className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold hover:bg-purple-200 transition-colors"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-gray-900">
                                {orderItems[item.name].quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.name, 1, selectedExtras[item.name])}
                                className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold hover:bg-purple-600 transition-colors"
                              >
                                +
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleAddItem(item.name)}
                              className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold hover:bg-purple-600 transition-colors"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedItemExtras[item.name] && item.extras && item.extras.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          {item.extras.map((extra) => {
                            const isSelected = (selectedExtras[item.name] || []).includes(extra.id)
                            const isFree = Number(extra.price) === 0

                            return (
                              <button
                                key={extra.id}
                                onClick={() => toggleExtra(item.name, extra.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-200 bg-white hover:border-purple-200"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      isSelected ? "border-purple-500 bg-purple-500" : "border-gray-300"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${isSelected ? "text-purple-900" : "text-gray-700"}`}
                                  >
                                    {extra.name}
                                  </span>
                                </div>
                                <span className={`text-sm font-bold ${isFree ? "text-gray-500" : "text-teal-400"}`}>
                                  {isFree ? "Free" : `+$${Number(extra.price).toFixed(2)}`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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
    </div>
  )
}

export { OrderPageClient }
export default OrderPageClient
