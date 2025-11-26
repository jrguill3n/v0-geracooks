"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface EditOrderModalProps {
  orderId: string
  customerName: string
  items: OrderItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MENU_ITEMS = {
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

    const menuItem = MENU_ITEMS[selectedCategory as keyof typeof MENU_ITEMS].find((item) => item.name === selectedItem)
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

  const getTotalPrice = () => {
    return editedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateOrderItems(orderId, editedItems)
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
            <div className="flex gap-3 mb-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(MENU_ITEMS).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
                    MENU_ITEMS[selectedCategory as keyof typeof MENU_ITEMS].map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name} - ${item.price}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button onClick={addNewItem} disabled={!selectedItem} className="bg-teal-500 hover:bg-teal-600">
                Add
              </Button>
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
