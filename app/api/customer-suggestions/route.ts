import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""

    const supabase = await createClient()

    // Search customers by name or phone
    const { data: customers, error } = await supabase
      .from("customers")
      .select("name, country_code, phone_number")
      .or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error("[v0] Error fetching customer suggestions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("[v0] Error in customer suggestions API:", error)
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 })
  }
}
