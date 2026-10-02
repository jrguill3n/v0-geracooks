import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = body?.subscription
    console.log("[API] subscribe-push received", {
      hasSubscription: Boolean(subscription),
      endpoint: subscription?.endpoint,
      hasKeys: Boolean(subscription?.keys?.p256dh && subscription?.keys?.auth),
    })

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid push subscription payload" }, { status: 400 })
    }

    // This table intentionally has no public RLS policies. Keep writes server-side
    // with the service role rather than making push credentials publicly writable.
    const supabase = await createServiceClient()
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        created_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )

    if (error) {
      console.error("[API] Error storing subscription", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ error: "Failed to store subscription", details: error.message }, { status: 500 })
    }

    console.log("[API] Push subscription saved", { endpoint: subscription.endpoint })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error in subscribe-push", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
