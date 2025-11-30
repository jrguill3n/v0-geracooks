import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current orders data
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total,
        created_at,
        status,
        customer:customers(name, phone),
        order_items(
          quantity,
          price_at_purchase,
          menu_item:menu_items(name, section:menu_sections(name))
        )
      `)
      .order("created_at", { ascending: true })

    if (ordersError) throw ordersError

    // Get historical sales data
    const { data: historicalSales, error: historicalError } = await supabase
      .from("historical_sales")
      .select("*")
      .order("year", { ascending: true })
      .order("month", { ascending: true })

    if (historicalError) throw historicalError

    // Get customer data
    const { data: customers, error: customersError } = await supabase.from("customers").select(`
        id,
        name,
        phone,
        orders(id, total, created_at)
      `)

    if (customersError) throw customersError

    return NextResponse.json({
      orders: orders || [],
      historicalSales: historicalSales || [],
      customers: customers || [],
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
