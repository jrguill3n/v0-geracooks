import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: items, error } = await supabase
      .from("menu_items")
      .select(`
        id,
        name,
        price,
        display_order,
        menu_sections!inner (
          name
        )
      `)
      .order("display_order")

    if (error) {
      console.error("[v0] Error fetching menu items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedItems =
      items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        section: item.menu_sections?.name || "Unknown",
      })) || []

    console.log("[v0] Fetched menu items:", transformedItems.length)
    return NextResponse.json(transformedItems)
  } catch (error) {
    console.error("[v0] Unexpected error fetching menu:", error)
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
  }
}
