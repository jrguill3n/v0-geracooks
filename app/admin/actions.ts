"use server"

import { redirect } from "next/navigation"
import { clearAuthCookie } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function logoutAction() {
  await clearAuthCookie()
  redirect("/admin/login")
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

  if (error) {
    console.error("Error updating order status:", error)
    throw new Error("Failed to update order status")
  }

  revalidatePath("/admin")
  return { success: true }
}
