import { NextResponse } from "next/server"

// Placeholder – notifications and persistence will be wired later.
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log("[catering-quote] Received quote request:", JSON.stringify(payload, null, 2))

    // TODO: save to DB, send WhatsApp / push notification to business owner

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[catering-quote] Error processing quote:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
