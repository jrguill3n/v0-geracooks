"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, X } from "lucide-react"
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
  const [editedItems, setEditedItems] = useState<
    Array<{ id?: string; item_name: string; quantity: number; unit_price: number }>
  >(
    items.map((item) => ({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
  )
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [customItemName, setCustomItemName] = useState("")
  const [customItemPrice, setCustomItemPrice] = useState("")
  const [customItemQuantity, setCustomItemQuantity] = useState("1")
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

  const updateQuantity = (index: number, change: number) => {
    setEditedItems((prev) => {
      const newItems = [...prev]
      const newQuantity = newItems[index].quantity + change
      if (newQuantity <= 0) {
        return newItems.filter((_, i) => i !== index)
      }
      newItems[index] = { ...newItems[index], quantity: newQuantity }
      return newItems
    })
  }

  const removeItem = (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index))
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
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newItems[existingIndex].quantity + 1 }
        return newItems
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

    if (!name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid item name, price, and quantity",
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

    // Reset custom item fields
    setCustomItemName("")
    setCustomItemPrice("")
    setCustomItemQuantity("1")

    toast({
      title: "Custom Item Added",
      description: `${name} has been added to the order`,
    })
  }

  const getTotalPrice = () => {
    return editedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log("[v0] Saving order with items:", editedItems)
      const result = await updateOrderItems(orderId, editedItems)
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-teal-400">
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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.item_name}</p>
                      <p className="text-sm text-gray-600">${item.unit_price} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(index, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(index, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <span className="ml-3 font-bold text-gray-900 w-20 text-right">
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </span>
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
              <div className="flex gap-3 mb-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
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
                  <SelectTrigger className="flex-1">
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

                <Button onClick={addNewItem} disabled={!selectedItem} className="bg-teal-500 hover:bg-teal-600">
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
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
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
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
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
