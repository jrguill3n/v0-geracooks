import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscription } = body

    const supabase = await createClient()

    // Store subscription in database
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        created_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (error) {
      console.error("[API] Error storing subscription:", error)
      return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in subscribe-push:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
