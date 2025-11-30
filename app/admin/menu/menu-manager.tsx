"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import {
  addSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem,
  reorderSections,
  reorderItems,
  addExtra,
  deleteExtra,
} from "./actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

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
  description?: string
}

interface MenuItemExtra {
  id: string
  menu_item_id: string
  name: string
  price: number
  display_order: number
}

function SortableSection({
  section,
  children,
  onEdit,
  onDelete,
}: { section: MenuSection; children: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card ref={setNodeRef} style={style} className="p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{section.name}</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="text-teal-600 border-teal-300 hover:bg-teal-50 bg-transparent"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
          >
            Delete
          </Button>
        </div>
      </div>
      {children}
    </Card>
  )
}

function SortableItem({
  item,
  onEdit,
  onDelete,
  onManageExtras,
}: {
  item: MenuItem
  onEdit: () => void
  onDelete: () => void
  onManageExtras: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-3"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 break-words">{item.name}</p>
          <p className="text-sm text-teal-400 font-bold">${Number(item.price).toFixed(2)}</p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1 break-words">{item.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onManageExtras}
          className="text-purple-600 border-purple-300 hover:bg-purple-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
        >
          Extras
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-teal-600 border-teal-300 hover:bg-teal-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export function MenuManager({
  sections: initialSections,
  items: initialItems,
  extras: initialExtras,
}: {
  sections: MenuSection[]
  items: MenuItem[]
  extras: MenuItemExtra[]
}) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [items, setItems] = useState(initialItems)
  const [extras, setExtras] = useState(initialExtras)
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [isAddingItemOpen, setIsAddingItemOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [managingExtrasForItem, setManagingExtrasForItem] = useState<MenuItem | null>(null)
  const [isAddingExtra, setIsAddingExtra] = useState(false)
  const [selectedSectionForItem, setSelectedSectionForItem] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const itemsBySection = items.reduce(
    (acc, item) => {
      if (!acc[item.section_id]) acc[item.section_id] = []
      acc[item.section_id].push(item)
      return acc
    },
    {} as Record<string, MenuItem[]>,
  )

  const extrasByItem = extras.reduce(
    (acc, extra) => {
      if (!acc[extra.menu_item_id]) acc[extra.menu_item_id] = []
      acc[extra.menu_item_id].push(extra)
      return acc
    },
    {} as Record<string, MenuItemExtra[]>,
  )

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id)
      const newIndex = sections.findIndex((s) => s.id === over.id)

      const newSections = arrayMove(sections, oldIndex, newIndex)
      setSections(newSections)

      const updates = newSections.map((section, index) => ({
        id: section.id,
        display_order: index + 1,
      }))

      const result = await reorderSections(updates)
      if (!result.success) {
        toast.error("Failed to save section order")
        setSections(sections)
      }
    }
  }

  const handleItemDragEnd = async (sectionId: string, event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const sectionItems = itemsBySection[sectionId] || []
      const oldIndex = sectionItems.findIndex((i) => i.id === active.id)
      const newIndex = sectionItems.findIndex((i) => i.id === over.id)

      const newItems = arrayMove(sectionItems, oldIndex, newIndex)

      setItems((prevItems) => {
        const otherItems = prevItems.filter((i) => i.section_id !== sectionId)
        return [...otherItems, ...newItems]
      })

      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index + 1,
      }))

      const result = await reorderItems(updates)
      if (!result.success) {
        toast.error("Failed to save item order")
        setItems(initialItems)
      }
    }
  }

  useEffect(() => {
    setSections(initialSections)
  }, [initialSections])

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    setExtras(initialExtras)
  }, [initialExtras])

  const handleAddSection = async (formData: FormData) => {
    setIsSubmitting(true)
    console.log("[v0] Adding section with data:", Object.fromEntries(formData))

    const result = await addSection(formData)

    console.log("[v0] Add section result:", result)

    if (result.success) {
      toast.success("Section added successfully!", {
        description: "The new section has been created.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsAddingSectionOpen(false)
      router.refresh()
    } else {
      toast.error("Failed to add section", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleUpdateSection = async (formData: FormData) => {
    setIsSubmitting(true)
    const id = formData.get("id") as string
    const name = formData.get("name") as string

    setSections(sections.map((s) => (s.id === id ? { ...s, name } : s)))

    const result = await updateSection(formData)
    if (result.success) {
      toast.success("Section updated successfully!", {
        description: "Changes have been saved.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setEditingSection(null)
    } else {
      setSections(initialSections)
      toast.error("Failed to update section", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure? This will delete all items in this section.")) return
    const previousSections = sections
    setSections(sections.filter((s) => s.id !== sectionId))
    setItems(items.filter((i) => i.section_id !== sectionId))

    const loadingToast = toast.loading("Deleting section...")
    const result = await deleteSection(sectionId)
    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success("Section deleted successfully!", {
        duration: 3000,
      })
    } else {
      setSections(previousSections)
      setItems(initialItems)
      toast.error("Failed to delete section", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
  }

  const handleAddItem = async (formData: FormData) => {
    setIsSubmitting(true)
    const result = await addItem(formData)
    if (result.success) {
      toast.success("Item added successfully!", {
        description: "The new item has been created.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsAddingItemOpen(false)
      setSelectedSectionForItem("")
      router.refresh()
    } else {
      toast.error("Failed to add item", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleUpdateItem = async (formData: FormData) => {
    setIsSubmitting(true)
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string

    setItems(items.map((item) => (item.id === id ? { ...item, name, price, description } : item)))

    const result = await updateItem(formData)
    if (result.success) {
      toast.success("Item updated successfully!", {
        description: "Changes have been saved.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setEditingItem(null)
    } else {
      setItems(initialItems)
      toast.error("Failed to update item", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    const previousItems = items
    setItems(items.filter((i) => i.id !== itemId))

    const loadingToast = toast.loading("Deleting item...")
    const result = await deleteItem(itemId)
    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success("Item deleted successfully!", {
        duration: 3000,
      })
    } else {
      setItems(previousItems)
      toast.error("Failed to delete item", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
  }

  const handleAddExtra = async (formData: FormData) => {
    setIsSubmitting(true)
    const result = await addExtra(formData)
    if (result.success) {
      toast.success("Extra added successfully!")
      await new Promise((resolve) => setTimeout(resolve, 500))
      setIsAddingExtra(false)
      router.refresh()
    } else {
      toast.error("Failed to add extra", { description: result.error })
    }
    setIsSubmitting(false)
  }

  const handleDeleteExtra = async (extraId: string) => {
    if (!confirm("Are you sure you want to delete this extra?")) return

    const previousExtras = extras
    setExtras(extras.filter((e) => e.id !== extraId))

    const result = await deleteExtra(extraId)
    if (result.success) {
      toast.success("Extra deleted successfully!")
    } else {
      setExtras(previousExtras)
      toast.error("Failed to delete extra")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Menu Sections</h2>
        <Dialog open={isAddingSectionOpen} onOpenChange={setIsAddingSectionOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white font-semibold w-full sm:w-auto">
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-teal-300">
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>Create a new menu section (category)</DialogDescription>
            </DialogHeader>
            <form action={handleAddSection} className="space-y-4">
              <div>
                <Label htmlFor="section-name">Section Name</Label>
                <Input id="section-name" name="name" placeholder="e.g., PESCADO" required disabled={isSubmitting} />
              </div>
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Section"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-2 border-teal-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{section.name}</h3>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(section)}
                      className="text-teal-600 border-teal-300 hover:bg-teal-50 bg-transparent text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleItemDragEnd(section.id, e)}
                >
                  <SortableContext
                    items={(itemsBySection[section.id] || []).map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(itemsBySection[section.id] || []).map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onEdit={() => setEditingItem(item)}
                          onDelete={() => handleDeleteItem(item.id)}
                          onManageExtras={() => setManagingExtrasForItem(item)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <Dialog
                  open={isAddingItemOpen && selectedSectionForItem === section.id}
                  onOpenChange={(open) => {
                    if (isSubmitting) return
                    setIsAddingItemOpen(open)
                    if (open) setSelectedSectionForItem(section.id)
                    else setSelectedSectionForItem("")
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white w-full sm:w-auto mt-3">
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-2 border-teal-300 max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="break-words">
                        Add Item to {sections.find((s) => s.id === selectedSectionForItem)?.name}
                      </DialogTitle>
                    </DialogHeader>
                    <form action={handleAddItem} className="space-y-4">
                      <input type="hidden" name="section_id" value={section.id} />
                      <div>
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input
                          id="item-name"
                          name="name"
                          placeholder="e.g., Grilled Salmon"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-price">Price ($)</Label>
                        <Input
                          id="item-price"
                          name="price"
                          type="number"
                          step="0.01"
                          placeholder="12.99"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-description">Description (optional)</Label>
                        <textarea
                          id="item-description"
                          name="description"
                          placeholder="A brief description of this dish..."
                          className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add Item"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={!!managingExtrasForItem} onOpenChange={(open) => !open && setManagingExtrasForItem(null)}>
        <DialogContent className="border-2 border-purple-300 max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="break-words">Manage Extras for {managingExtrasForItem?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-600">Add optional extras that customers can select with this item</p>
              <Button
                size="sm"
                onClick={() => setIsAddingExtra(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto"
              >
                Add Extra
              </Button>
            </div>

            {managingExtrasForItem && extrasByItem[managingExtrasForItem.id]?.length > 0 ? (
              <div className="space-y-2">
                {extrasByItem[managingExtrasForItem.id].map((extra) => (
                  <div
                    key={extra.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold break-words">{extra.name}</p>
                      <p className="text-sm text-teal-400 font-bold">
                        {extra.price > 0 ? `+$${Number(extra.price).toFixed(2)}` : "Free"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExtra(extra.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">No extras added yet</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingExtra} onOpenChange={(open) => !open && setIsAddingExtra(false)}>
        <DialogContent className="border-2 border-purple-300 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add Extra to {managingExtrasForItem?.name}</DialogTitle>
          </DialogHeader>
          <form action={handleAddExtra} className="space-y-4">
            <input type="hidden" name="menu_item_id" value={managingExtrasForItem?.id} />
            <div>
              <Label htmlFor="extra-name">Extra Name</Label>
              <Input
                id="extra-name"
                name="name"
                placeholder="e.g., Spicy Rock Shrimp"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="extra-price">Extra Price ($)</Label>
              <Input
                id="extra-price"
                name="price"
                type="number"
                step="0.01"
                placeholder="25.00"
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Extra"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSection} onOpenChange={() => !isSubmitting && setEditingSection(null)}>
        <DialogContent className="border-2 border-teal-300 mx-4">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <form action={handleUpdateSection} className="space-y-4">
            <input type="hidden" name="id" value={editingSection?.id} />
            <div>
              <Label htmlFor="edit-section-name">Section Name</Label>
              <Input
                id="edit-section-name"
                name="name"
                defaultValue={editingSection?.name}
                required
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Section"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={() => !isSubmitting && setEditingItem(null)}>
        <DialogContent className="border-2 border-teal-300 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <form action={handleUpdateItem} className="space-y-4">
            <input type="hidden" name="id" value={editingItem?.id} />
            <div>
              <Label htmlFor="edit-item-name">Item Name</Label>
              <Input
                id="edit-item-name"
                name="name"
                defaultValue={editingItem?.name}
                required
                disabled={isSubmitting}
              />
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
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-item-description">Description (optional)</Label>
              <textarea
                id="edit-item-description"
                name="description"
                defaultValue={editingItem?.description || ""}
                placeholder="A brief description of this dish..."
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
