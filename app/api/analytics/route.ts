import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Analytics API called")
    const supabase = createServiceClient()

    console.log("[v0] Fetching orders data...")
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total_price,
        created_at,
        status,
        customer_name,
        customer_id
      `)
      .order("created_at", { ascending: true })

    if (ordersError) {
      console.error("[v0] Orders query error:", JSON.stringify(ordersError, null, 2))
      return NextResponse.json(
        {
          error: "Failed to fetch orders",
          details: ordersError.message,
          code: ordersError.code,
        },
        { status: 500 },
      )
    }
    console.log("[v0] Orders fetched:", orders?.length || 0)

    console.log("[v0] Fetching order items data...")
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*")
      .order("created_at", { ascending: true })

    if (orderItemsError) {
      console.error("[v0] Order items query error:", JSON.stringify(orderItemsError, null, 2))
    }
    console.log("[v0] Order items fetched:", orderItems?.length || 0)

    console.log("[v0] Fetching historical sales data...")
    // Get historical sales data (may not exist yet)
    const { data: historicalSales, error: historicalError } = await supabase
      .from("historical_sales")
      .select("year, month, revenue")
      .order("year", { ascending: true })
      .order("month", { ascending: true })

    // Don't throw if historical_sales table doesn't exist yet
    if (historicalError) {
      console.error("[v0] Historical sales query error:", JSON.stringify(historicalError, null, 2))
    } else {
      console.log("[v0] Historical sales fetched:", historicalSales?.length || 0)
    }

    console.log("[v0] Fetching customers data...")
    const { data: customers, error: customersError } = await supabase.from("customers").select("*")

    if (customersError) {
      console.error("[v0] Customers query error:", JSON.stringify(customersError, null, 2))
      return NextResponse.json(
        {
          error: "Failed to fetch customers",
          details: customersError.message,
          code: customersError.code,
        },
        { status: 500 },
      )
    }
    console.log("[v0] Customers fetched:", customers?.length || 0)

    console.log("[v0] Analytics data fetched successfully")
    return NextResponse.json({
      orders: orders || [],
      orderItems: orderItems || [],
      historicalSales: historicalSales || [],
      customers: customers || [],
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error details:", errorMessage)
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
