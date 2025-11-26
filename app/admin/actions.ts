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
    console.log("[v0] Server action: updating order", orderId, "to status:", newStatus)
    const supabase = await createClient()

    const { data, error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId).select()

    if (error) {
      console.error("[v0] Error updating order status:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Successfully updated order:", data)
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}
