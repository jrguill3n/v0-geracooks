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
    // Only allow valid statuses
    const validStatuses = ["new", "in_progress", "packed", "delivered"]
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid status" }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId).select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update order status" }
  }
}

export async function updatePaymentStatus(orderId: string, newPaymentStatus: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("orders")
      .update({ payment_status: newPaymentStatus })
      .eq("id", orderId)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update payment status" }
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

export async function updateOrderItems(
  orderId: string,
  items: Array<{ id?: string; item_name: string; quantity: number; unit_price: number }>,
) {
  try {
    console.log("[v0] Server action: updating order items for", orderId)
    const supabase = await createClient()

    // Delete all existing order items
    const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", orderId)

    if (deleteError) {
      console.error("[v0] Error deleting order items:", deleteError)
      return { success: false, error: deleteError.message }
    }

    // Insert new order items
    const newItems = items.map((item) => ({
      order_id: orderId,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.quantity * item.unit_price,
    }))

    const { error: insertError } = await supabase.from("order_items").insert(newItems)

    if (insertError) {
      console.error("[v0] Error inserting order items:", insertError)
      return { success: false, error: insertError.message }
    }

    // Update order total price
    const totalPrice = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const { error: updateError } = await supabase.from("orders").update({ total_price: totalPrice }).eq("id", orderId)

    if (updateError) {
      console.error("[v0] Error updating order total:", updateError)
      return { success: false, error: updateError.message }
    }

    console.log("[v0] Successfully updated order items")
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error updating order items:", error)
    return { success: false, error: "Failed to update order items" }
  }
}
