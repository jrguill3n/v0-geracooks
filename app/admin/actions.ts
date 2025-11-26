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

export async function deleteOrder(orderId: string) {
  try {
    console.log("[v0] Server action: deleting order", orderId)
    const supabase = await createClient()

    // First delete order items (foreign key constraint)
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)

    if (itemsError) {
      console.error("[v0] Error deleting order items:", itemsError)
      return { success: false, error: itemsError.message }
    }

    // Then delete the order
    const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)

    if (orderError) {
      console.error("[v0] Error deleting order:", orderError)
      return { success: false, error: orderError.message }
    }

    console.log("[v0] Successfully deleted order and its items")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting order:", error)
    return { success: false, error: "Failed to delete order" }
  }
}
