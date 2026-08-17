import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`id, total_price, created_at, status, customer_name, customer_id`)
      .order("created_at", { ascending: true })

    if (ordersError) {
      return NextResponse.json(
        { error: "Failed to fetch orders", details: ordersError.message, code: ordersError.code },
        { status: 500 },
      )
    }

    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*")
      .order("created_at", { ascending: true })

    if (orderItemsError) {
      console.error("Order items query error:", orderItemsError.message)
    }

    const { data: historicalSales, error: historicalError } = await supabase
      .from("historical_sales")
      .select("year, month, revenue")
      .order("year", { ascending: true })
      .order("month", { ascending: true })

    if (historicalError) {
      console.error("Historical sales query error:", historicalError.message)
    }

    const { data: customers, error: customersError } = await supabase.from("customers").select("*")

    if (customersError) {
      return NextResponse.json(
        { error: "Failed to fetch customers", details: customersError.message, code: customersError.code },
        { status: 500 },
      )
    }

    return NextResponse.json({
      orders: orders || [],
      orderItems: orderItems || [],
      historicalSales: historicalSales || [],
      customers: customers || [],
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: errorMessage },
      { status: 500 },
    )
  }
}
