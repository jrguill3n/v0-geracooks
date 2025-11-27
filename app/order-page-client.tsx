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
  const [orderItems, setOrderItems] = useState<Record<string, number>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent, method: "whatsapp" | "sms") => {
    e.preventDefault()

    if (!customerName || getTotalItems() === 0) {
      alert("Please fill in your name and select at least one item")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        customerName,
        orderItems,
        totalPrice: getTotalPrice(),
      }

      const response = await fetch("/api/save-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(`Failed to save order: ${JSON.stringify(responseData)}`)
      }

      let message = `New Order from GERA COOKS\n\n`
      message += `Customer: ${customerName}\n\n`
      message += `Order:\n`

      Object.entries(orderItems).forEach(([itemName, quantity]) => {
        const item = Object.values(menuItems)
          .flat()
          .find((i) => i.name === itemName)
        if (item) {
          message += `• ${quantity}x ${itemName} - $${item.price * quantity}\n`
        }
      })

      message += `\nTotal: $${getTotalPrice()}`

      if (method === "whatsapp") {
        const whatsappMessage = encodeURIComponent(message)
        const phoneNumber = "16315780700"
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${whatsappMessage}`
        window.location.href = whatsappUrl
      } else {
        const smsMessage = encodeURIComponent(message)
        const smsUrl = `sms:+16315780700${/iPhone|iPad|iPod/.test(navigator.userAgent) ? "&" : "?"}body=${smsMessage}`
        window.location.href = smsUrl
      }

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
            <p className="text-foreground/80 leading-relaxed">
              Thank you for submitting your order, we will get in contact for your delivery.
            </p>
          </div>
          <Button
            onClick={() => {
              setOrderSubmitted(false)
              setCustomerName("")
              setOrderItems({})
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
              <div className="flex gap-3">
                <Button
                  onClick={(e) => handleSubmit(e, "whatsapp")}
                  size="lg"
                  className="bg-white text-teal-600 font-bold hover:bg-gray-100 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "..." : "WhatsApp"}
                </Button>
                <Button
                  onClick={(e) => handleSubmit(e, "sms")}
                  size="lg"
                  className="bg-teal-700 text-white font-bold hover:bg-teal-800 border-2 border-white shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "..." : "SMS"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
