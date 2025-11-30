import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// VAPID keys - Generate using: npx web-push generate-vapid-keys
// Store these in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@geracooks.com"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, customerName, total } = body

    const supabase = await createClient()

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("*")

    if (error || !subscriptions || subscriptions.length === 0) {
      console.log("[API] No push subscriptions found")
      return NextResponse.json({ success: false, message: "No subscriptions" })
    }

    // Send push notification to all subscriptions
    const payload = JSON.stringify({
      title: "New Order Received!",
      body: `Order #${orderId.slice(0, 8)} from ${customerName}\nTotal: $${total}`,
      url: "/admin",
      orderId,
    })

    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload,
        )
        return { success: true, endpoint: sub.endpoint }
      } catch (error: any) {
        console.error("[API] Error sending to subscription:", error)

        // If subscription is invalid, delete it
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
        }

        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(promises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: subscriptions.length,
      results,
    })
  } catch (error) {
    console.error("[API] Error in send-push:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
