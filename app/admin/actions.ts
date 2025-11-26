"use server"

import { redirect } from "next/navigation"
import { clearAuthCookie } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function logoutAction() {
  await clearAuthCookie()
  redirect("/admin/login")
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

    if (error) {
      console.error("Error updating order status:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error updating order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}
