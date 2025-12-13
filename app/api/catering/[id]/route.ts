import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("[v0] API: Fetching items for quote ID:", id)

  const supabase = await createServiceClient()

  const { data: items, error } = await supabase
    .from("catering_quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[v0] API: Error fetching items:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("[v0] API: Found", items?.length || 0, "items for quote", id)
  return NextResponse.json({ items })
}
// </CHANGE>
