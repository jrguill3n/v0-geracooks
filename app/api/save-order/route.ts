import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { customerName, phone, orderItems, totalPrice } = await request.json()

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        phone: phone,
        total_price: totalPrice,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Error creating order:", orderError)
      throw orderError
    }

    // Get menu items to calculate prices
    const { data: menuItemsData } = await supabase.from("menu_items").select("*")
    const priceMap = new Map(menuItemsData?.map((item) => [item.name, Number(item.price)]) || [])

    const orderItemsData = Object.entries(orderItems).map(([itemName, quantity]) => {
      const unitPrice = priceMap.get(itemName) || 0
      const itemTotal = unitPrice * (quantity as number)

      return {
        order_id: order.id,
        item_name: itemName,
        quantity: quantity as number,
        unit_price: unitPrice,
        total_price: itemTotal,
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

    if (itemsError) {
      console.error("[v0] Error creating order items:", itemsError)
      throw itemsError
    }

    let whatsappSent = false
    let whatsappError = null

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM
      const twilioWhatsAppTo = "whatsapp:+16315780700"

      console.log("[v0] Twilio Config Check:", {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasWhatsAppFrom: !!twilioWhatsAppFrom,
        whatsAppFrom: twilioWhatsAppFrom,
        whatsAppTo: twilioWhatsAppTo,
      })

      if (!accountSid || !authToken || !twilioWhatsAppFrom) {
        const missingVars = []
        if (!accountSid) missingVars.push("TWILIO_ACCOUNT_SID")
        if (!authToken) missingVars.push("TWILIO_AUTH_TOKEN")
        if (!twilioWhatsAppFrom) missingVars.push("TWILIO_WHATSAPP_FROM")
        whatsappError = `Missing Twilio environment variables: ${missingVars.join(", ")}`
        console.error("[v0]", whatsappError)
      } else {
        let message = `🔔 *New Order from GERA COOKS*\n\n`
        message += `👤 Customer: *${customerName}*\n`
        message += `📞 Phone: *${phone}*\n`
        message += `📋 Order #${order.id}\n\n`
        message += `*Items:*\n`

        Object.entries(orderItems).forEach(([itemName, quantity]) => {
          const unitPrice = priceMap.get(itemName) || 0
          message += `• ${quantity}x ${itemName} - $${unitPrice * (quantity as number)}\n`
        })

        message += `\n💰 *Total: $${totalPrice}*`

        console.log("[v0] Sending WhatsApp message...")

        const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: twilioWhatsAppFrom,
            To: twilioWhatsAppTo,
            Body: message,
          }),
        })

        const responseData = await twilioResponse.json()
        console.log("[v0] Twilio Response Status:", twilioResponse.status)
        console.log("[v0] Twilio Response Data:", responseData)

        if (!twilioResponse.ok) {
          whatsappError = `Twilio API error (${twilioResponse.status}): ${responseData.message || JSON.stringify(responseData)}`
          console.error("[v0]", whatsappError)
        } else {
          whatsappSent = true
          console.log("[v0] WhatsApp notification sent successfully! Message SID:", responseData.sid)
        }
      }
    } catch (twilioError) {
      whatsappError = twilioError instanceof Error ? twilioError.message : String(twilioError)
      console.error("[v0] Error sending WhatsApp notification:", twilioError)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      whatsappSent,
      whatsappError,
    })
  } catch (error) {
    console.error("[v0] Error saving order:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
