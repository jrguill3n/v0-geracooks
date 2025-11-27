"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addSection, updateSection, deleteSection, addItem, updateItem, deleteItem } from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface MenuSection {
  id: string
  name: string
  display_order: number
}

interface MenuItem {
  id: string
  section_id: string
  name: string
  price: number
  display_order: number
}

export function MenuManager({ sections, items }: { sections: MenuSection[]; items: MenuItem[] }) {
  const router = useRouter()
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [isAddingItemOpen, setIsAddingItemOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [selectedSectionForItem, setSelectedSectionForItem] = useState<string>("")

  const itemsBySection = items.reduce(
    (acc, item) => {
      if (!acc[item.section_id]) acc[item.section_id] = []
      acc[item.section_id].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  const handleAddSection = async (formData: FormData) => {
    const result = await addSection(formData)
    if (result.success) {
      toast.success("Section added successfully")
      setIsAddingSectionOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to add section")
    }
  }

  const handleUpdateSection = async (formData: FormData) => {
    const result = await updateSection(formData)
    if (result.success) {
      toast.success("Section updated successfully")
      setEditingSection(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update section")
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure? This will delete all items in this section.")) return
    const result = await deleteSection(sectionId)
    if (result.success) {
      toast.success("Section deleted successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete section")
    }
  }

  const handleAddItem = async (formData: FormData) => {
    const result = await addItem(formData)
    if (result.success) {
      toast.success("Item added successfully")
      setIsAddingItemOpen(false)
      setSelectedSectionForItem("")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to add item")
    }
  }

  const handleUpdateItem = async (formData: FormData) => {
    const result = await updateItem(formData)
    if (result.success) {
      toast.success("Item updated successfully")
      setEditingItem(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update item")
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    const result = await deleteItem(itemId)
    if (result.success) {
      toast.success("Item deleted successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete item")
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Section Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Sections</h2>
        <Dialog open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold">Add Section</Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-teal-300">
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>Create a new menu section (category)</DialogDescription>
            </DialogHeader>
            <form action={handleAddSection} className="space-y-4">
              <div>
                <Label htmlFor="section-name">Section Name</Label>
                <Input id="section-name" name="name" placeholder="e.g., PESCADO" required />
              </div>
              <div>
                <Label htmlFor="section-order">Display Order</Label>
                <Input
                  id="section-order"
                  name="display_order"
                  type="number"
                  defaultValue={sections.length + 1}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
                Add Section
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sections and Items */}
      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.id} className="p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{section.name}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection(section)}
                  className="text-teal-600 border-teal-300 hover:bg-teal-50"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Delete
                </Button>
                <Dialog
                  open={isAddingItemOpen && selectedSectionForItem === section.id}
                  onOpenChange={(open) => {
                    setIsAddingItemOpen(open)
                    if (open) setSelectedSectionForItem(section.id)
                    else setSelectedSectionForItem("")
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-teal-300">
                    <DialogHeader>
                      <DialogTitle>Add Item to {section.name}</DialogTitle>
                    </DialogHeader>
                    <form action={handleAddItem} className="space-y-4">
                      <input type="hidden" name="section_id" value={section.id} />
                      <div>
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input id="item-name" name="name" placeholder="e.g., Grilled Salmon" required />
                      </div>
                      <div>
                        <Label htmlFor="item-price">Price ($)</Label>
                        <Input id="item-price" name="price" type="number" step="0.01" placeholder="12.99" required />
                      </div>
                      <div>
                        <Label htmlFor="item-order">Display Order</Label>
                        <Input
                          id="item-order"
                          name="display_order"
                          type="number"
                          defaultValue={(itemsBySection[section.id]?.length || 0) + 1}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
                        Add Item
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {itemsBySection[section.id]?.length ? (
                itemsBySection[section.id].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-teal-400 font-bold">${Number(item.price).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="text-teal-600 border-teal-300 hover:bg-teal-50"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No items in this section</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="border-2 border-teal-300">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <form action={handleUpdateSection} className="space-y-4">
            <input type="hidden" name="id" value={editingSection?.id} />
            <div>
              <Label htmlFor="edit-section-name">Section Name</Label>
              <Input id="edit-section-name" name="name" defaultValue={editingSection?.name} required />
            </div>
            <div>
              <Label htmlFor="edit-section-order">Display Order</Label>
              <Input
                id="edit-section-order"
                name="display_order"
                type="number"
                defaultValue={editingSection?.display_order}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
              Update Section
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="border-2 border-teal-300">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form action={handleUpdateItem} className="space-y-4">
            <input type="hidden" name="id" value={editingItem?.id} />
            <div>
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input id="edit-item-name" name="name" defaultValue={editingItem?.name} required />
            </div>
            <div>
              <Label htmlFor="edit-item-price">Price ($)</Label>
              <Input
                id="edit-item-price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={editingItem?.price}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-item-order">Display Order</Label>
              <Input
                id="edit-item-order"
                name="display_order"
                type="number"
                defaultValue={editingItem?.display_order}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600">
              Update Item
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
