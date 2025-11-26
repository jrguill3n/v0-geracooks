"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag } from "lucide-react"

const countryCodes = [
  { code: "+1", country: "US" },
  { code: "+52", country: "MX" },
  { code: "+54", country: "AR" },
  { code: "+61", country: "AU" },
  { code: "+55", country: "BR" },
  { code: "+1", country: "CA" },
  { code: "+86", country: "CN" },
  { code: "+57", country: "CO" },
  { code: "+506", country: "CR" },
  { code: "+53", country: "CU" },
  { code: "+593", country: "EC" },
  { code: "+503", country: "SV" },
  { code: "+33", country: "FR" },
  { code: "+49", country: "DE" },
  { code: "+502", country: "GT" },
  { code: "+504", country: "HN" },
  { code: "+91", country: "IN" },
  { code: "+39", country: "IT" },
  { code: "+81", country: "JP" },
  { code: "+505", country: "NI" },
  { code: "+507", country: "PA" },
  { code: "+51", country: "PE" },
  { code: "+34", country: "ES" },
  { code: "+44", country: "GB" },
  { code: "+598", country: "UY" },
  { code: "+58", country: "VE" },
]

const menuItems = {
  POLLO: [
    { name: "Stir fry c/vegetales", price: 13 },
    { name: "Tinga", price: 12 },
    { name: "Mole", price: 12 },
    { name: "Pollinita", price: 13 },
    { name: "Crema de chipotle", price: 14 },
    { name: "Crema de poblano y elote", price: 14 },
    { name: "Deshebrado 12 oz", price: 10 },
    { name: "Salsa verde c/ papas", price: 12 },
  ],
  RES: [
    { name: "Bolognesa", price: 15 },
    { name: "Yakimeshi", price: 12 },
    { name: "Picadillo verde", price: 14 },
    { name: "Picadillo fit", price: 15 },
    { name: "Deshebrada 12 oz", price: 16 },
    { name: "Deshebrada c/ papa", price: 15 },
    { name: "Burritos desheb/papa (4)", price: 20 },
    { name: "Cortadillo c/ poblano", price: 16 },
  ],
  PAVO: [
    { name: "Picadillo", price: 13 },
    { name: "Albóndigas al chipotle", price: 15 },
  ],
  CERDO: [
    { name: "Carnitas healthy", price: 16 },
    { name: "Cochinita pibil", price: 16 },
    { name: "Chicharrón salsa verde", price: 13 },
  ],
  VEGANO: [
    { name: "Arroz rojo c/elote", price: 6 },
    { name: "Arroz cilantro limón", price: 6 },
    { name: "Arroz integral", price: 6 },
    { name: "Calabacitas a la mexicana", price: 9 },
    { name: "Calabacitas con elote", price: 9 },
    { name: "Fideo seco", price: 6 },
    { name: "Lentejas c/vegetales", price: 9 },
  ],
  VEGETARIANO: [
    { name: "Puré de papa", price: 7 },
    { name: "Puré de camote", price: 9 },
    { name: "Quinoa c/vegetales", price: 6 },
  ],
}

export default function OrderPage() {
  const [customerName, setCustomerName] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [customerPhone, setCustomerPhone] = useState("")
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

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    return cleaned.length >= 10
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerPhone || getTotalItems() === 0) {
      alert("Please fill in all fields and select at least one item")
      return
    }

    if (!validatePhoneNumber(customerPhone)) {
      alert("Please enter a valid phone number (at least 10 digits)")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        customerName,
        customerPhone: `${countryCode} ${customerPhone}`,
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

      let message = `*New Order from GERA COOKS*%0A%0A`
      message += `*Customer:* ${customerName}%0A`
      message += `*Phone:* ${countryCode} ${customerPhone}%0A%0A`
      message += `*Order:*%0A`

      Object.entries(orderItems).forEach(([itemName, quantity]) => {
        const item = Object.values(menuItems)
          .flat()
          .find((i) => i.name === itemName)
        if (item) {
          message += `• ${quantity}x ${itemName} - $${item.price * quantity}%0A`
        }
      })

      message += `%0A*Total: $${getTotalPrice()}*`

      const whatsappUrl = `https://wa.me/16315780700?text=${message}`
      window.open(whatsappUrl, "_blank")

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
              setCustomerPhone("")
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
    <div className="min-h-screen bg-cream pb-40">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border-b-2 border-orange-300 sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="font-display text-5xl font-extrabold mb-3 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
              GERA COOKS
            </h1>
            <p className="text-sm font-semibold text-orange-700 mb-3">Cel 631-578-0700</p>
            <p className="text-xs text-muted-foreground">
              Nuestros empaques son de 1 libra y sirven aproximadamente 2 porciones.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white border-2 border-purple-300 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="font-display text-2xl font-bold mb-5 text-gray-800">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white border-2 border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-24 px-3 py-2 bg-white border-2 border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 font-medium"
                >
                  {countryCodes.map((item, index) => (
                    <option key={`${item.code}-${item.country}-${index}`} value={item.code}>
                      {item.country} {item.code}
                    </option>
                  ))}
                </select>
                <Input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="6316205887"
                  className="flex-1 bg-white border-2 border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        {Object.entries(menuItems).map(([category, items]) => (
          <div key={category} className="mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 p-6 border-b-2 border-purple-200">
                <h2 className="font-display text-2xl font-bold text-gray-800">{category}</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-3 hover:bg-purple-50 px-3 -mx-3 rounded-md transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="text-gray-800 font-semibold">{item.name}</p>
                        <p className="text-sm font-medium text-purple-600">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, -1)}
                          disabled={!orderItems[item.name]}
                          className="h-8 w-8 p-0 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold text-gray-800">{orderItems[item.name] || 0}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, 1)}
                          className="h-8 w-8 p-0 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
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
      </div>

      {/* Fixed Bottom Bar */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 border-t-2 border-purple-600 p-4 z-[100] shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-primary-foreground/90">Total Items: {getTotalItems()}</p>
                <p className="text-2xl font-display font-bold text-primary-foreground">Total: ${getTotalPrice()}</p>
              </div>
              <Button
                onClick={handleSubmit}
                size="lg"
                className="bg-white text-purple-700 font-bold text-base px-8 shadow-lg hover:shadow-xl hover:scale-105 transition-all hover:bg-purple-50"
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
