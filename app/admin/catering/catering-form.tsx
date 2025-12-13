"use client"

import type React from "react"
import { toast } from "sonner"
import { PhoneInput } from "@/components/phone-input"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, MessageSquare } from "lucide-react"
import {
  createCateringQuote,
  updateCateringQuote,
  type CateringQuote,
  type CateringQuoteItem,
  updateQuoteStatus,
} from "./actions"
import { SegmentedControl } from "@/components/ui/segmented-control"

interface CateringFormProps {
  initialQuote?: CateringQuote
  initialItems?: CateringQuoteItem[]
}

export function CateringForm({ initialQuote, initialItems = [] }: CateringFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const [customerName, setCustomerName] = useState(initialQuote?.customer_name || "")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [notes, setNotes] = useState(initialQuote?.notes || "")
  const [status, setStatus] = useState(initialQuote?.status || "draft")

  const [quoteType, setQuoteType] = useState<"items" | "per_person">(initialQuote?.quote_type || "items")
  const [peopleCount, setPeopleCount] = useState<number>(initialQuote?.people_count || 0)
  const [pricePerPerson, setPricePerPerson] = useState<number>(initialQuote?.price_per_person || 0)

  const [items, setItems] = useState<CateringQuoteItem[]>(
    initialItems.filter((item) => !item.item_type || item.item_type === "priced").length > 0
      ? initialItems.filter((item) => !item.item_type || item.item_type === "priced")
      : [{ label: "", price: 0 }],
  )

  const [includedItems, setIncludedItems] = useState<CateringQuoteItem[]>(
    initialItems.filter((item) => item.item_type === "included").length > 0
      ? initialItems.filter((item) => item.item_type === "included")
      : [],
  )

  const [tax, setTax] = useState(initialQuote?.tax || 0)
  const [deliveryFee, setDeliveryFee] = useState(initialQuote?.delivery_fee || 0)
  const [discount, setDiscount] = useState(initialQuote?.discount || 0)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (initialQuote?.status) {
      console.log("[v0] Syncing status from props:", initialQuote.status)
      setStatus(initialQuote.status)
    }
  }, [initialQuote?.status])

  useEffect(() => {
    if (initialQuote?.phone) {
      // Parse phone: "+1234567890" -> countryCode: "+1", phoneNumber: "234567890"
      const match = initialQuote.phone.match(/^(\+\d+)(.*)$/)
      if (match) {
        setCountryCode(match[1])
        setPhoneNumber(match[2].replace(/\D/g, ""))
      } else {
        // No country code, just digits
        setPhoneNumber(initialQuote.phone.replace(/\D/g, ""))
      }
    }
  }, [initialQuote?.phone])

  const calculateSubtotal = () => {
    if (quoteType === "per_person") {
      return peopleCount * pricePerPerson
    }
    return items.reduce((sum, item) => {
      const price = typeof item.price === "number" && !Number.isNaN(item.price) ? item.price : 0
      return sum + price
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + tax + deliveryFee - discount
  }

  const fetchSuggestions = async (query: string, index: number, isIncluded?: boolean) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(null)
      return
    }

    try {
      const response = await fetch(`/api/catering/label-suggestions?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
      setShowSuggestions(isIncluded ? `included-${index}` : index)
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

  const handleKeyDown = (e: React.KeyboardEvent, index: number, isIncluded?: boolean) => {
    if (showSuggestions === (isIncluded ? `included-${index}` : index) && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === "Enter" && activeSuggestionIndex >= 0) {
        e.preventDefault()
        if (isIncluded) {
          updateIncludedItem(index, "label", suggestions[activeSuggestionIndex])
        } else {
          selectSuggestion(index, suggestions[activeSuggestionIndex])
        }
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

  const addIncludedItem = () => {
    setIncludedItems([...includedItems, { label: "", price: 0, item_type: "included" }])
  }

  const updateIncludedItem = (index: number, field: keyof CateringQuoteItem, value: any) => {
    const newItems = [...includedItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setIncludedItems(newItems)
  }

  const removeIncludedItem = (index: number) => {
    setIncludedItems(includedItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submitted")

    setErrors([])
    setIsLoading(true)

    try {
      // Validation
      const validationErrors: string[] = []

      if (!customerName.trim()) {
        validationErrors.push("Customer name is required")
      }

      const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "")
      if (!cleanedPhoneNumber) {
        validationErrors.push("Customer phone is required")
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

      if (quoteType === "per_person") {
        if (!peopleCount || peopleCount < 1) {
          validationErrors.push("Number of people must be at least 1")
        }

        if (pricePerPerson < 0) {
          validationErrors.push("Price per person cannot be negative")
        }

        includedItems.forEach((item, index) => {
          if (!item.label.trim()) {
            validationErrors.push(`Included Item ${index + 1}: Description is required`)
          }
        })
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setIsLoading(false)
        return
      }

      const fullPhone = countryCode + cleanedPhoneNumber

      const subtotal = calculateSubtotal()
      const total = calculateTotal()

      const payload = {
        customer_name: customerName,
        phone: fullPhone,
        notes,
        status,
        quote_type: quoteType,
        people_count: quoteType === "per_person" ? peopleCount : null,
        price_per_person: quoteType === "per_person" ? pricePerPerson : null,
        items: quoteType === "items" ? items : [],
        included_items: quoteType === "per_person" ? includedItems : [],
        subtotal,
        tax,
        delivery_fee: deliveryFee,
        discount,
        total,
      }

      console.log("[v0] Submitting payload:", payload)

      let result
      if (initialQuote?.id) {
        console.log("[v0] Updating existing quote:", initialQuote.id, "with status:", status)
        result = await updateCateringQuote(initialQuote.id, payload)
      } else {
        console.log("[v0] Creating new quote with status:", status)
        result = await createCateringQuote(payload)
      }

      setIsLoading(false)

      if (result.error) {
        console.error("[v0] Save error:", result.error)
        setErrors([result.error])
        toast.error("Error saving quote")
        return
      }

      console.log("[v0] Save successful!", result)

      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
      if (initialQuote?.id) {
        toast.success("Quote updated successfully", {
          description: `Status: ${statusLabel}`,
        })
        console.log("[v0] Refreshing page after update")
        router.refresh() // Refresh to get latest data including status
      } else {
        toast.success("Quote created successfully", {
          description: `Status: ${statusLabel}`,
        })
        if (!result.id) {
          console.error("[v0] No ID returned from create, redirecting to list")
          router.push("/admin/catering")
        } else {
          console.log("[v0] Redirecting to:", `/admin/catering/${result.id}`)
          router.push(`/admin/catering/${result.id}`)
        }
      }
    } catch (error) {
      console.error("[v0] Error during form submission:", error)
      setIsLoading(false)
      toast.error("An error occurred while submitting the form")
    }
  }

  const handleWhatsApp = () => {
    let message = `Hola ${customerName}! 👋\n\n`
    message += `Aquí está tu cotización de catering:\n\n`
    message += `📋 *Detalles*\n`
    message += `─────────────────\n\n`

    if (quoteType === "per_person") {
      message += `👥 Personas: ${peopleCount}\n`
      message += `💵 Precio por persona: $${pricePerPerson.toFixed(2)}\n`
      message += `💰 Subtotal: $${calculateSubtotal().toFixed(2)}\n\n`
    } else {
      items.forEach((item) => {
        message += `• ${item.label} - $${item.price.toFixed(2)}\n`
      })
      message += `\n💰 Subtotal: $${calculateSubtotal().toFixed(2)}\n`
    }

    if (tax > 0) message += `📊 Impuesto: $${tax.toFixed(2)}\n`
    if (deliveryFee > 0) message += `🚚 Envío: $${deliveryFee.toFixed(2)}\n`
    if (discount > 0) message += `🎉 Descuento: -$${discount.toFixed(2)}\n`

    message += `\n─────────────────\n`
    message += `💰 *Total: $${calculateTotal().toFixed(2)}*\n\n`
    message += `Por favor confirma si te interesa esta cotización. ¡Gracias! 🙏`

    const cleanPhone = phoneNumber.replace(/\D/g, "")
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
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-semibold mb-1">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {errors.map((err, i) => (
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
              <PhoneInput
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setCountryCode}
                onPhoneNumberChange={setPhoneNumber}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Quote Type *</Label>
              <p className="text-sm text-gray-500 mb-3">Elige cómo se calcula este catering</p>
            </div>
            <SegmentedControl
              value={quoteType}
              onValueChange={(value) => setQuoteType(value as "items" | "per_person")}
              options={[
                { value: "items", label: "Items" },
                { value: "per_person", label: "Per Person" },
              ]}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {quoteType === "items" ? (
          // Items Section
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
                      <Label className="text-sm font-medium">Price *</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.price === 0 ? "0" : item.price || ""}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                            const numValue = val === "" ? 0 : Number.parseFloat(val) || 0
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
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Per Person Pricing</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="peopleCount">Number of People *</Label>
                  <Input
                    id="peopleCount"
                    type="text"
                    inputMode="numeric"
                    value={peopleCount || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || /^\d+$/.test(val)) {
                        setPeopleCount(val === "" ? 0 : Number.parseInt(val, 10))
                      }
                    }}
                    placeholder="e.g., 50"
                    required
                    className="text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerPerson">Price per Person *</Label>
                  <Input
                    id="pricePerPerson"
                    type="text"
                    inputMode="decimal"
                    value={pricePerPerson === 0 ? "0" : pricePerPerson || ""}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                        setPricePerPerson(val === "" ? 0 : Number.parseFloat(val) || 0)
                      }
                    }}
                    placeholder="0.00"
                    required
                    className="text-lg"
                  />
                </div>
              </div>
              {peopleCount > 0 && pricePerPerson > 0 && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <span className="font-semibold">{peopleCount} personas</span> ×{" "}
                    <span className="font-semibold">${pricePerPerson.toFixed(2)}</span> ={" "}
                    <span className="text-lg font-bold">${calculateSubtotal().toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Included Items</h3>
                  <p className="text-sm text-gray-500">Items incluidos en el precio por persona (opcionales)</p>
                </div>
                <Button
                  type="button"
                  onClick={addIncludedItem}
                  size="sm"
                  variant="outline"
                  className="border-teal-500 text-teal-600 hover:bg-teal-50 bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Included Item
                </Button>
              </div>

              {includedItems.length > 0 ? (
                <div className="space-y-3">
                  {includedItems.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors bg-teal-50/30"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 relative">
                          <Label className="text-sm font-medium">Item Description *</Label>
                          <Input
                            value={item.label}
                            onChange={(e) => updateIncludedItem(index, "label", e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, true)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="e.g., Agua, Refrescos, Cubiertos desechables"
                            required
                            className="mt-1 bg-white"
                          />
                          {showSuggestions === `included-${index}` && suggestions.length > 0 && (
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
                                    updateIncludedItem(index, "label", suggestion)
                                    setShowSuggestions(null)
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-teal-50 cursor-pointer transition-colors ${
                                    activeSuggestionIndex === suggestionIndex ? "bg-teal-100" : ""
                                  }`}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                          <span className="text-sm text-teal-600 font-medium">Incluido</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeIncludedItem(index)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay items incluidos. Haz clic en "Add Included Item" para agregar.</p>
                </div>
              )}
            </div>
          </>
        )}

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
              disabled={!customerName || !phoneNumber || isLoading}
              className="bg-green-600 hover:bg-green-700 font-semibold"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 font-semibold">
            {isLoading ? "Saving..." : initialQuote ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </form>
    </div>
  )
}
