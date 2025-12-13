"use client"

import type React from "react"

import { useState } from "react"
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
    initialItems.length > 0 ? initialItems : [{ name: "", description: "", unitPrice: 0, qty: 1, lineTotal: 0 }],
  )

  const [tax, setTax] = useState(initialQuote?.tax || 0)
  const [deliveryFee, setDeliveryFee] = useState(initialQuote?.delivery_fee || 0)
  const [discount, setDiscount] = useState(initialQuote?.discount || 0)

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + tax + deliveryFee - discount
  }

  const updateItem = (index: number, field: keyof CateringQuoteItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-calculate line total
    if (field === "unitPrice" || field === "qty") {
      newItems[index].lineTotal = newItems[index].unitPrice * newItems[index].qty
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { name: "", description: "", unitPrice: 0, qty: 1, lineTotal: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!customerName || !phone) {
      setError("Customer name and phone are required")
      setLoading(false)
      return
    }

    if (items.length === 0 || items.some((item) => !item.name || item.qty < 1)) {
      setError("At least one valid item is required")
      setLoading(false)
      return
    }

    const quote: CateringQuote = {
      customer_name: customerName,
      phone,
      notes,
      status,
      subtotal: calculateSubtotal(),
      tax,
      delivery_fee: deliveryFee,
      discount,
      total: calculateTotal(),
    }

    const result = initialQuote?.id
      ? await updateCateringQuote(initialQuote.id, quote, items)
      : await createCateringQuote(quote, items)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/admin/catering")
    }
  }

  const handleWhatsApp = () => {
    let message = `Hola ${customerName}! 👋\n\n`
    message += `Aquí está tu cotización de catering:\n\n`
    message += `📋 *Detalles*\n`
    message += `─────────────────\n\n`

    items.forEach((item) => {
      message += `• ${item.qty}x ${item.name} - $${item.lineTotal.toFixed(2)}\n`
      if (item.description) {
        message += `  ${item.description}\n`
      }
    })

    message += `\n─────────────────\n`
    message += `💰 *Total: $${calculateTotal().toFixed(2)}*\n\n`
    message += `Por favor confirma si te interesa esta cotización. ¡Gracias! 🙏`

    const cleanPhone = phone.replace(/\D/g, "")
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank")

    // Update status to sent if it's draft
    if (initialQuote?.id && status === "draft") {
      updateQuoteStatus(initialQuote.id, "sent")
      setStatus("sent")
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>}

        {/* Customer Section - Reuse existing structure */}
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
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Item Name *</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        placeholder="e.g., Empanadas"
                        required
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="e.g., Chicken and cheese"
                      />
                    </div>
                    <div>
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(index, "qty", Number.parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="mt-6 border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-right font-semibold text-lg text-primary">
                  Line Total: ${item.lineTotal.toFixed(2)}
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
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Delivery Fee</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-primary border-t pt-3">
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
              disabled={!customerName || !phone}
              className="bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </Button>
          )}
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : initialQuote ? "Update Quote" : "Create Quote"}
          </Button>
        </div>
      </form>
    </div>
  )
}
