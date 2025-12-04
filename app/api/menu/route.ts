import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch all menu items with their sections
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("id, name, price, section")
      .order("section")
      .order("display_order")

    if (error) {
      console.error("[v0] Error fetching menu items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(items || [])
  } catch (error) {
    console.error("[v0] Unexpected error fetching menu:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
