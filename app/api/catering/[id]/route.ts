import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.log("[v0] API: Skipping non-UUID ID:", id)
    return NextResponse.json({ error: "Invalid quote ID format" }, { status: 400 })
  }

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
