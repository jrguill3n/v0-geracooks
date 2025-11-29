"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addSection(formData: FormData) {
  try {
    console.log("[v0] addSection called")
    const supabase = await createClient()
    const name = formData.get("name") as string

    console.log("[v0] Section name:", name)

    const { count, error: countError } = await supabase
      .from("menu_sections")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("[v0] Error getting count:", countError)
      throw countError
    }

    const display_order = (count || 0) + 1
    console.log("[v0] Calculated display_order:", display_order)

    const { data, error } = await supabase
      .from("menu_sections")
      .insert({
        name,
        display_order,
      })
      .select()

    console.log("[v0] Insert result - data:", data, "error:", error)

    if (error) {
      console.error("[v0] Insert error details:", JSON.stringify(error, null, 2))
      throw error
    }

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error adding section:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add section" }
  }
}

export async function updateSection(formData: FormData) {
  try {
    const supabase = await createClient()
    const id = formData.get("id") as string
    const name = formData.get("name") as string

    const { error } = await supabase.from("menu_sections").update({ name }).eq("id", id)

    if (error) throw error

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating section:", error)
    return { success: false, error: "Failed to update section" }
  }
}

export async function deleteSection(sectionId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("menu_sections").delete().eq("id", sectionId)

    if (error) throw error

    revalidatePath("/admin/menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting section:", error)
    return { success: false, error: "Failed to delete section" }
  }
}

export async function addItem(formData: FormData) {
  try {
    console.log("[v0] addItem called")
    const supabase = await createClient()
    const section_id = formData.get("section_id") as string
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string

    console.log("[v0] Item data:", { section_id, name, price, description })

    const { count, error: countError } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })
      .eq("section_id", section_id)

    if (countError) {
      console.error("[v0] Error getting item count:", countError)
      throw countError
    }

    const display_order = (count || 0) + 1
    console.log("[v0] Calculated item display_order:", display_order)

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        section_id,
        name,
        price,
        description,
        display_order,
      })
      .select()

    console.log("[v0] Item insert result - data:", data, "error:", error)

    if (error) {
      console.error("[v0] Item insert error details:", JSON.stringify(error, null, 2))
      throw error
    }

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error adding item:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to add item" }
  }
}

export async function updateItem(formData: FormData) {
  try {
    const supabase = await createClient()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string

    const { error } = await supabase.from("menu_items").update({ name, price, description }).eq("id", id)

    if (error) throw error

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating item:", error)
    return { success: false, error: "Failed to update item" }
  }
}

export async function deleteItem(itemId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("menu_items").delete().eq("id", itemId)

    if (error) throw error

    revalidatePath("/admin/menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting item:", error)
    return { success: false, error: "Failed to delete item" }
  }
}

export async function reorderSections(updates: Array<{ id: string; display_order: number }>) {
  try {
    const supabase = await createClient()

    for (const update of updates) {
      const { error } = await supabase
        .from("menu_sections")
        .update({ display_order: update.display_order })
        .eq("id", update.id)

      if (error) throw error
    }

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error reordering sections:", error)
    return { success: false, error: "Failed to reorder sections" }
  }
}

export async function reorderItems(updates: Array<{ id: string; display_order: number }>) {
  try {
    const supabase = await createClient()

    for (const update of updates) {
      const { error } = await supabase
        .from("menu_items")
        .update({ display_order: update.display_order })
        .eq("id", update.id)

      if (error) throw error
    }

    revalidatePath("/admin/menu")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error reordering items:", error)
    return { success: false, error: "Failed to reorder items" }
  }
}
