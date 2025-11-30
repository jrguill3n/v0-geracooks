"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface CustomerFormData {
  name: string
  phone: string
  nickname: string
  notes: string
}

export async function updateCustomer(customerId: string, data: CustomerFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("customers")
    .update({
      name: data.name.trim(),
      phone: data.phone.trim(),
      nickname: data.nickname.trim() || null,
      notes: data.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)

  if (error) {
    console.error("[v0] Error updating customer:", error)
    throw new Error("Failed to update customer")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/customers")
}

export async function createCustomer(data: CustomerFormData) {
  const supabase = await createClient()

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      name: data.name.trim(),
      phone: data.phone.trim(),
      nickname: data.nickname.trim() || null,
      notes: data.notes.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating customer:", error)
    throw new Error("Failed to create customer")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/customers")

  return { ...newCustomer, orders: [{ count: 0 }] }
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("customers").delete().eq("id", customerId)

  if (error) {
    console.error("[v0] Error deleting customer:", error)
    throw new Error("Failed to delete customer")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/customers")
}
