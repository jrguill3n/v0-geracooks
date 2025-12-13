import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServiceClient()

  const { data: items, error } = await supabase
    .from("catering_quote_items")
    .select("*")
    .eq("quote_id", params.id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items })
}
