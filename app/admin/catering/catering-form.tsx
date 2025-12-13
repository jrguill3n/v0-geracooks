"use client"

import type React from "react"
import { toast } from "@/hooks/use-toast"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, MessageCircle, Save } from "lucide-react"
import {
  createCateringQuote,
  updateCateringQuote,
  type CateringQuote,
  type CateringQuoteItem,
  updateQuoteStatus,
} from "./actions"
import { PhoneInput } from "@/components/phone-input"

interface CateringFormProps {
  initialQuote?: CateringQuote
  initialItems?: CateringQuoteItem[]
}

export function CateringForm({ initialQuote, initialItems = [] }: CateringFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [customerName, setCustomerName] = useState(initialQuote?.customer_name || "")
  const [phone, setPhone] = useState(initialQuote?.phone || "")
  const [notes, setNotes] = useState(initialQuote?.notes || "")
  const [status, setStatus] = useState(initialQuote?.status || "draft")

  const [items, setItems] = useState<CateringQuoteItem[]>(
    initialItems.length > 0 ? initialItems : [{ label: "", price: 0 }],
  )

  const [tax, setTax] = useState(initialQuote?.tax || 0)
  const [deliveryFee, setDeliveryFee] = useState(initialQuote?.delivery_fee || 0)
  const [discount, setDiscount] = useState(initialQuote?.discount || 0)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = typeof item.price === "number" && !Number.isNaN(item.price) ? item.price : 0
      return sum + price
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + tax + deliveryFee - discount
  }

  const fetchSuggestions = async (query: string, index: number) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(null)
      return
    }

    try {
      const response = await fetch(`/api/catering/label-suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(index)
      setActiveSuggestionIndex(-1)
    } catch (error) {
      console.error("[v0] Error fetching suggestions:", error)
      setSuggestions([])
    }
  }

  const updateItem = (index: number, field: keyof CateringQuoteItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)

    if (field === "label") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value, index)
      }, 300)
    }
  }

  const selectSuggestion = (index: number, suggestion: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], label: suggestion }
    setItems(newItems)
    setSuggestions([])
    setShowSuggestions(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (showSuggestions === index && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
        e.preventDefault()
        selectSuggestion(index, suggestions[activeSuggestionIndex])
      } else if (e.key === "Escape") {
        setSuggestions([])
        setShowSuggestions(null)
      }
    }
  }

  const addItem = () => {
    setItems([...items, { label: "", price: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
      if (showSuggestions === index) {
        setSuggestions([])
        setShowSuggestions(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submit triggered")
    console.log("[v0] Current items:", items)

    setLoading(true)
    setError("")

    const validationErrors: string[] = []

    if (!customerName.trim()) {
      validationErrors.push("Customer name is required")
    }

    if (!phone.trim()) {
      validationErrors.push("Customer phone is required")
    }

    if (items.length === 0) {
      validationErrors.push("At least one item is required")
    }

    items.forEach((item, index) => {
      if (!item.label.trim()) {
        validationErrors.push(`Item ${index + 1}: Description is required`)
      }

      const price = typeof item.price === "number" ? item.price : Number.parseFloat(String(item.price))

      if (Number.isNaN(price)) {
        validationErrors.push(`Item ${index + 1}: Invalid price`)
      } else if (price < 0) {
        validationErrors.push(`Item ${index + 1}: Price cannot be negative`)
      }
    })

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(". ")
      setError(errorMessage)
      setLoading(false)
      console.log("[v0] Validation failed:", validationErrors)
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    const quote: CateringQuote = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      status,
      subtotal: calculateSubtotal(),
      tax,
      delivery_fee: deliveryFee,
      discount,
      total: calculateTotal(),
    }

    try {
      console.log("[v0] Submitting quote:", quote)
      console.log("[v0] Items:", items)
      console.log("[v0] Is update?", !!initialQuote?.id)

      const result = initialQuote?.id
        ? await updateCateringQuote(initialQuote.id, quote, items)
        : await createCateringQuote(quote, items)

      console.log("[v0] Server result:", result)

      if (result.error) {
        setError(result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        setLoading(false)
      } else {
        toast({
          title: "Success",
          description: initialQuote ? "Quote updated successfully" : "Quote created successfully",
        })

        if (result.id && !initialQuote) {
          console.log("[v0] Redirecting to:", `/admin/catering/${result.id}`)
          router.push(`/admin/catering/${result.id}`)
        } else {
          console.log("[v0] Refreshing page")
          router.refresh()
        }
      }
    } catch (error) {
      console.error("[v0] Error saving quote:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    let message = `Hola ${customerName}! 👋\n\n`
    message += `Aquí está tu cotización de catering:\n\n`
    message += `📋 *Detalles*\n`
    message += `─────────────────\n\n`

    items.forEach((item) => {
      message += `• ${item.label} - $${item.price.toFixed(2)}\n`
    })

    message += `\n─────────────────\n`
    message += `💰 *Total: $${calculateTotal().toFixed(2)}*\n\n`
    message += `Por favor confirma si te interesa esta cotización. ¡Gracias! 🙏`

    const cleanPhone = phone.replace(/\D/g, "")
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank")

    if (initialQuote?.id && status === "draft") {
      updateQuoteStatus(initialQuote.id, "sent")
      setStatus("sent")
    }
  }

  useEffect(() => {
    const handleClickOutside = () => {
      setSuggestions([])
      setShowSuggestions(null)
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-semibold mb-1">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {error
                .split(". ")
                .filter((e) => e)
                .map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
            </ul>
          </div>
        )}

        {/* Customer Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <PhoneInput value={phone} onChange={setPhone} required />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Items</h3>
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-1 relative">
                    <Label className="text-sm font-medium">Item Description *</Label>
                    <Input
                      value={item.label}
                      onChange={(e) => updateItem(index, "label", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="e.g., 50 Empanadas de pollo y queso"
                      required
                      className="mt-1"
                    />
                    {showSuggestions === index && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                          Sugerencias
                        </div>
                        {suggestions.map((suggestion, suggestionIndex) => (
                          <button
                            key={suggestionIndex}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              selectSuggestion(index, suggestion)
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-purple-50 cursor-pointer transition-colors ${
                              activeSuggestionIndex === suggestionIndex ? "bg-purple-100" : ""
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-32">
                    <Label className="text-sm font-medium">Price * (min $0)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.price === 0 ? "0" : item.price || ""}
                      onChange={(e) => {
                        const val = e.target.value
                        // Allow empty, numbers, and decimals
                        if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                          // Parse to number, treating empty as 0
                          const numValue = val === "" ? 0 : Number.parseFloat(val) || 0
                          console.log("[v0] Price input:", val, "-> parsed:", numValue)
                          updateItem(index, "price", numValue)
                        }
                      }}
                      required
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="mt-6 border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Totals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-lg">
              <span>Subtotal:</span>
              <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tax</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={tax || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setTax(val === "" ? 0 : Number.parseFloat(val) || 0)
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Delivery Fee</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={deliveryFee || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setDeliveryFee(val === "" ? 0 : Number.parseFloat(val) || 0)
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Discount</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={discount || ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                      setDiscount(val === "" ? 0 : Number.parseFloat(val) || 0)
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-purple-600 border-t pt-3 mt-2">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Other Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or special requests..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {initialQuote && (
            <Button
              type="button"
              onClick={handleWhatsApp}
              disabled={!customerName || !phone || loading}
              className="bg-green-600 hover:bg-green-700 font-semibold"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>
          )}
          <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 font-semibold">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : initialQuote ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </form>
    </div>
  )
}
