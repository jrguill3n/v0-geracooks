"use client"

import type React from "react"

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
import {
  addSection,
  updateSection,
  deleteSection,
  addItem,
  updateItem,
  deleteItem,
  reorderSections,
  reorderItems,
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

function SortableItem({ item, onEdit, onDelete }: { item: MenuItem; onEdit: () => void; onDelete: () => void }) {
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
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="flex items-center gap-2 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-sm text-teal-400 font-bold">${Number(item.price).toFixed(2)}</p>
        </div>
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
  )
}

export function MenuManager({
  sections: initialSections,
  items: initialItems,
}: { sections: MenuSection[]; items: MenuItem[] }) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [items, setItems] = useState(initialItems)
  const [isAddingSectionOpen, setIsAddingSectionOpen] = useState(false)
  const [isAddingItemOpen, setIsAddingItemOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
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
    const result = await updateSection(formData)
    if (result.success) {
      toast.success("Section updated successfully!", {
        description: "Changes have been saved.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setEditingSection(null)
      router.refresh()
    } else {
      toast.error("Failed to update section", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Are you sure? This will delete all items in this section.")) return
    const loadingToast = toast.loading("Deleting section...")
    const result = await deleteSection(sectionId)
    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success("Section deleted successfully!", {
        duration: 3000,
      })
      router.refresh()
    } else {
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
    const result = await updateItem(formData)
    if (result.success) {
      toast.success("Item updated successfully!", {
        description: "Changes have been saved.",
        duration: 3000,
      })
      await new Promise((resolve) => setTimeout(resolve, 500))
      setEditingItem(null)
      router.refresh()
    } else {
      toast.error("Failed to update item", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    const loadingToast = toast.loading("Deleting item...")
    const result = await deleteItem(itemId)
    toast.dismiss(loadingToast)

    if (result.success) {
      toast.success("Item deleted successfully!", {
        duration: 3000,
      })
      router.refresh()
    } else {
      toast.error("Failed to delete item", {
        description: result.error || "An error occurred",
        duration: 4000,
      })
    }
  }

  return (
    <div className="space-y-6">
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
              <SortableSection
                key={section.id}
                section={section}
                onEdit={() => setEditingSection(section)}
                onDelete={() => handleDeleteSection(section.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">Drag sections to reorder</p>
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
                        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Item"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleItemDragEnd(section.id, event)}
                >
                  <SortableContext
                    items={(itemsBySection[section.id] || []).map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {itemsBySection[section.id]?.length ? (
                        itemsBySection[section.id].map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onEdit={() => setEditingItem(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                          />
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No items in this section</p>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={!!editingSection} onOpenChange={() => !isSubmitting && setEditingSection(null)}>
        <DialogContent className="border-2 border-teal-300">
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
        <DialogContent className="border-2 border-teal-300">
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
            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
