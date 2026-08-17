"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { updateOrderItems } from "./actions"
import { toast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  section: string
}

interface EditOrderModalProps {
  orderId: string
  customerName: string
  items: OrderItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditOrderModal({ orderId, customerName, items, open, onOpenChange }: EditOrderModalProps) {
  const router = useRouter()
  // Quantity is `number | ""` so the input can be temporarily empty while the user
  // is retyping a value (e.g. selecting the digits and deleting them) without the
  // item being removed from the order.
  const [editedItems, setEditedItems] = useState<
    Array<{ id?: string; item_name: string; quantity: number | ""; unit_price: number }>
  >(
    items.map((item) => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  )
  const [quantityErrors, setQuantityErrors] = useState<Record<number, boolean>>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [customItemName, setCustomItemName] = useState("")
  const [customItemPrice, setCustomItemPrice] = useState("")
  const [customItemQuantity, setCustomItemQuantity] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuSections, setMenuSections] = useState<string[]>([])
  const [loadingMenu, setLoadingMenu] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      if (!open) return

      setLoadingMenu(true)
      try {
        const response = await fetch("/api/menu")
        if (response.ok) {
          const data = await response.json()
          setMenuItems(data)

          // Extract unique sections
          const sections = [...new Set(data.map((item: MenuItem) => item.section))]
          setMenuSections(sections)
        }
      } catch (error) {
        console.error("[v0] Error fetching menu:", error)
      } finally {
        setLoadingMenu(false)
      }
    }

    fetchMenu()
  }, [open])

  const removeItem = (index: number) => {
    // Explicit removal only happens here (the Remove/Delete button), never as a
    // side effect of editing the quantity field.
    setEditedItems((prev) => prev.filter((_, i) => i !== index))
    setQuantityErrors((prev) => {
      if (!(index in prev)) return prev
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([key, val]) => {
        const i = Number(key)
        if (i < index) next[i] = val
        else if (i > index) next[i - 1] = val
        // skip the removed index
      })
      return next
    })
  }

  const updateItemQuantity = (index: number, value: string) => {
    // Keep the item visible while the user is typing, even if the field is
    // temporarily empty or not yet a valid number (e.g. selecting the old
    // value and deleting it before typing a new one).
    if (value === "") {
      setEditedItems((prev) => {
        const newItems = [...prev]
        newItems[index] = { ...newItems[index], quantity: "" }
        return newItems
      })
    } else {
      const parsed = Number.parseInt(value, 10)
      setEditedItems((prev) => {
        const newItems = [...prev]
        newItems[index] = { ...newItems[index], quantity: Number.isNaN(parsed) ? "" : parsed }
        return newItems
      })
    }

    // Clear any previously shown validation error as soon as the user edits the field again.
    setQuantityErrors((prev) => {
      if (!prev[index]) return prev
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const isQuantityInvalid = (quantity: number | "") =>
    quantity === "" || typeof quantity !== "number" || Number.isNaN(quantity) || quantity < 1

  const handleQuantityBlur = (index: number) => {
    setEditedItems((current) => {
      const item = current[index]
      if (!item) return current

      setQuantityErrors((prev) => {
        const invalid = isQuantityInvalid(item.quantity)
        if (invalid === Boolean(prev[index])) return prev
        if (invalid) return { ...prev, [index]: true }
        const next = { ...prev }
        delete next[index]
        return next
      })

      return current
    })
  }

  const addNewItem = () => {
    if (!selectedItem || !selectedCategory) return

    const menuItem = menuItems.find((item) => item.name === selectedItem && item.section === selectedCategory)
    if (!menuItem) return

    // Check if item already exists
    const existingIndex = editedItems.findIndex((item) => item.item_name === selectedItem)
    if (existingIndex >= 0) {
      // Increase quantity of existing item
      setEditedItems((prev) => {
        const newItems = [...prev]
        const currentQuantity = newItems[existingIndex].quantity
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: (typeof currentQuantity === "number" && !Number.isNaN(currentQuantity) ? currentQuantity : 0) + 1,
        }
        return newItems
      })
      setQuantityErrors((prev) => {
        if (!prev[existingIndex]) return prev
        const next = { ...prev }
        delete next[existingIndex]
        return next
      })
    } else {
      // Add new item
      setEditedItems((prev) => [
        ...prev,
        {
          item_name: menuItem.name,
          quantity: 1,
          unit_price: menuItem.price,
        },
      ])
    }

    setSelectedItem("")
    setSelectedCategory("")
  }

  const addCustomItem = () => {
    const name = customItemName.trim()
    const price = Number.parseFloat(customItemPrice)
    const quantity = Number.parseInt(customItemQuantity)

    if (!name) {
      toast({
        title: "Invalid Input",
        description: "Please enter an item name",
        variant: "destructive",
      })
      return
    }

    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      })
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid quantity (at least 1)",
        variant: "destructive",
      })
      return
    }

    setEditedItems((prev) => [
      ...prev,
      {
        item_name: name,
        quantity: quantity,
        unit_price: price,
      },
    ])

    setCustomItemName("")
    setCustomItemPrice("")
    setCustomItemQuantity("")

    toast({
      title: "Custom Item Added",
      description: `${name} has been added to the order`,
    })
  }

  const getTotalPrice = () => {
    return editedItems.reduce(
      (sum, item) => sum + (typeof item.quantity === "number" ? item.quantity : 0) * item.unit_price,
      0,
    )
  }

  const handleSave = async () => {
    // Validate every quantity before saving. Invalid quantities are surfaced inline
    // instead of silently dropping the item or submitting bad data.
    const errors: Record<number, boolean> = {}
    editedItems.forEach((item, index) => {
      if (isQuantityInvalid(item.quantity)) {
        errors[index] = true
      }
    })

    if (Object.keys(errors).length > 0) {
      setQuantityErrors(errors)
      toast({
        title: "Cantidad inválida",
        description: "Ingresa una cantidad válida",
        variant: "destructive",
      })
      return
    }

    // Normalize to plain integers for the payload; unit_price/name/category are untouched.
    const itemsToSave = editedItems.map((item) => ({
      ...item,
      quantity: Math.trunc(item.quantity as number),
    }))

    setIsSaving(true)
    try {
      console.log("[v0] Saving order with items:", itemsToSave)
      const result = await updateOrderItems(orderId, itemsToSave)
      console.log("[v0] Save result:", result)
      if (result.success) {
        toast({
          title: "Success",
          description: "Order updated successfully",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error in handleSave:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-16px)] sm:max-w-2xl max-h-[90dvh] overflow-y-auto px-3 sm:px-6 border-2 border-teal-400">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Edit Order</DialogTitle>
          <DialogDescription className="text-gray-600">
            Customer: <span className="font-semibold">{customerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Items */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-900">Order Items</h3>
            {editedItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No items in order</p>
            ) : (
              <div className="space-y-2">
                {editedItems.map((item, index) => (
                  <div
                    key={index}
                    className="min-w-0 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <p className="min-w-0 flex-1 font-semibold text-gray-900 break-words">{item.item_name}</p>
                      <span className="shrink-0 font-bold text-gray-900 text-right">
                        ${((typeof item.quantity === "number" ? item.quantity : 0) * item.unit_price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 mt-2 min-w-0">
                      <p className="min-w-0 flex-1 text-sm text-gray-600">${item.unit_price} each</p>
                      <div className="flex items-start gap-2 shrink-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${index}`} className="text-sm text-gray-600">
                              Qty:
                            </Label>
                            <Input
                              id={`qty-${index}`}
                              type="number"
                              min="1"
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, e.target.value)}
                              onBlur={() => handleQuantityBlur(index)}
                              aria-invalid={quantityErrors[index] || undefined}
                              className={`w-[4.5rem] sm:w-20 text-center ${quantityErrors[index] ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            />
                          </div>
                          {quantityErrors[index] && (
                            <p className="text-xs text-red-600">Ingresa una cantidad válida</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItem(index)}
                          className="h-11 w-11 sm:h-8 sm:w-8 shrink-0 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Item */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-bold mb-3 text-gray-900">Add Item from Menu</h3>
            {loadingMenu ? (
              <p className="text-sm text-gray-500">Loading menu...</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuSections.map((section) => (
                      <SelectItem key={section} value={section}>
                        {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedItem} onValueChange={setSelectedItem} disabled={!selectedCategory}>
                  <SelectTrigger className="w-full sm:flex-1">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory &&
                      menuItems
                        .filter((item) => item.section === selectedCategory)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name} - ${item.price}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={addNewItem}
                  disabled={!selectedItem}
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Add Custom Item */}
          <div className="border-t border-gray-200 pt-4 bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-purple-900">Add Custom Item</h3>
            <p className="text-sm text-gray-600 mb-3">For special orders not in the menu</p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="customName" className="text-sm font-medium text-gray-700">
                    Item Name
                  </Label>
                  <Input
                    id="customName"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="e.g., Special Birthday Cake"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customQuantity" className="text-sm font-medium text-gray-700">
                    Quantity
                  </Label>
                  <Input
                    id="customQuantity"
                    type="number"
                    min="1"
                    value={customItemQuantity}
                    onChange={(e) => setCustomItemQuantity(e.target.value)}
                    placeholder=""
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="customPrice" className="text-sm font-medium text-gray-700">
                    Price ($)
                  </Label>
                  <Input
                    id="customPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addCustomItem} className="bg-purple-600 hover:bg-purple-700 w-full">
                    Add Custom Item
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Total:</span>
            <span className="text-3xl font-bold text-teal-600">${getTotalPrice().toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || editedItems.length === 0}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
