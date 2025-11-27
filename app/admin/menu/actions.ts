"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addSection(formData: FormData) {
  try {
    const supabase = await createClient()
    const name = formData.get("name") as string
    const display_order = Number.parseInt(formData.get("display_order") as string)

    const { error } = await supabase.from("menu_sections").insert({
      name,
      display_order,
    })

    if (error) throw error

    revalidatePath("/admin/menu")
    return { success: true }
  } catch (error) {
    console.error("Error adding section:", error)
    return { success: false, error: "Failed to add section" }
  }
}

export async function updateSection(formData: FormData) {
  try {
    const supabase = await createClient()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const display_order = Number.parseInt(formData.get("display_order") as string)

    const { error } = await supabase.from("menu_sections").update({ name, display_order }).eq("id", id)

    if (error) throw error

    revalidatePath("/admin/menu")
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
    const supabase = await createClient()
    const section_id = formData.get("section_id") as string
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const display_order = Number.parseInt(formData.get("display_order") as string)

    const { error } = await supabase.from("menu_items").insert({
      section_id,
      name,
      price,
      display_order,
    })

    if (error) throw error

    revalidatePath("/admin/menu")
    return { success: true }
  } catch (error) {
    console.error("Error adding item:", error)
    return { success: false, error: "Failed to add item" }
  }
}

export async function updateItem(formData: FormData) {
  try {
    const supabase = await createClient()
    const id = formData.get("id") as string
    const name = formData.get("name") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const display_order = Number.parseInt(formData.get("display_order") as string)

    const { error } = await supabase.from("menu_items").update({ name, price, display_order }).eq("id", id)

    if (error) throw error

    revalidatePath("/admin/menu")
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
