import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lastOrderId } = body

    const supabase = await createClient()

    // Get the latest order
    const { data: latestOrder, error } = await supabase
      .from("orders")
      .select("id, customer_name, total_price, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !latestOrder) {
      return NextResponse.json({
        hasNewOrders: false,
        latestOrderId: lastOrderId,
      })
    }

    // Check if this is a new order
    const hasNewOrders = lastOrderId ? latestOrder.id !== lastOrderId : false

    return NextResponse.json({
      hasNewOrders,
      latestOrderId: latestOrder.id,
      customerName: latestOrder.customer_name,
      total: latestOrder.total_price,
    })
  } catch (error) {
    console.error("[API] Error checking new orders:", error)
    return NextResponse.json({ hasNewOrders: false }, { status: 500 })
  }
}
