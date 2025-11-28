import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { customerName, phone, orderItems, totalPrice } = await request.json()

    const supabase = await createClient()

    let customerId: string

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, name, nickname")
      .eq("phone", phone)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
      // Update name if it changed
      if (existingCustomer.name !== customerName) {
        await supabase
          .from("customers")
          .update({ name: customerName, updated_at: new Date().toISOString() })
          .eq("id", customerId)
      }
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ phone, name: customerName })
        .select()
        .single()

      if (customerError) {
        console.error("[v0] Error creating customer:", customerError)
        throw customerError
      }
      customerId = newCustomer.id
    }

    // Create order linked to customer
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
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

    const { data: menuItemsData } = await supabase.from("menu_items").select("name, price, menu_sections(name)")

    const priceMap = new Map(menuItemsData?.map((item) => [item.name, Number(item.price)]) || [])
    const sectionMap = new Map(menuItemsData?.map((item) => [item.name, item.menu_sections?.name || "Other"]) || [])

    const orderItemsData = Object.entries(orderItems).map(([itemName, quantity]) => {
      const unitPrice = priceMap.get(itemName) || 0
      const itemTotal = unitPrice * (quantity as number)
      const section = sectionMap.get(itemName) || "Other"

      return {
        order_id: order.id,
        item_name: itemName,
        quantity: quantity as number,
        unit_price: unitPrice,
        total_price: itemTotal,
        section: section, // Store section with order item
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

    if (itemsError) {
      console.error("[v0] Error creating order items:", itemsError)
      throw itemsError
    }

    let notificationSent = false
    let notificationError = null
    let notificationType = null

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM
      const twilioSmsFrom = process.env.TWILIO_SMS_FROM || twilioWhatsAppFrom

      if (!accountSid || !authToken || !twilioWhatsAppFrom) {
        const missingVars = []
        if (!accountSid) missingVars.push("TWILIO_ACCOUNT_SID")
        if (!authToken) missingVars.push("TWILIO_AUTH_TOKEN")
        if (!twilioWhatsAppFrom) missingVars.push("TWILIO_WHATSAPP_FROM")
        notificationError = `Missing Twilio environment variables: ${missingVars.join(", ")}`
        console.error("[v0]", notificationError)
      } else {
        const itemsBySection: Record<string, Array<{ name: string; quantity: number; price: number }>> = {}

        orderItemsData.forEach((item) => {
          if (!itemsBySection[item.section]) {
            itemsBySection[item.section] = []
          }
          itemsBySection[item.section].push({
            name: item.item_name,
            quantity: item.quantity,
            price: item.total_price,
          })
        })

        let message = `🔔 New Order from GERA COOKS\n\n`
        message += `Customer: ${customerName}\n`
        message += `Phone: ${phone}\n`
        message += `Order #${order.id}\n\n`

        Object.entries(itemsBySection).forEach(([section, items]) => {
          message += `📋 ${section.toUpperCase()}\n`
          items.forEach((item) => {
            message += `  • ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}\n`
          })
          message += `\n`
        })

        message += `Total: $${totalPrice}`

        // Try WhatsApp first
        try {
          console.log("[v0] Attempting WhatsApp notification...")
          const fromNumber = twilioWhatsAppFrom?.startsWith("whatsapp:")
            ? twilioWhatsAppFrom
            : `whatsapp:${twilioWhatsAppFrom}`
          const toNumber = "whatsapp:+16315780700"

          const whatsappResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              },
              body: new URLSearchParams({
                From: fromNumber,
                To: toNumber,
                Body: message,
              }),
            },
          )

          const whatsappData = await whatsappResponse.json()

          if (whatsappResponse.ok) {
            notificationSent = true
            notificationType = "WhatsApp"
            console.log("[v0] WhatsApp notification sent successfully! SID:", whatsappData.sid)
          } else {
            console.log("[v0] WhatsApp failed, trying SMS fallback...")
            throw new Error(whatsappData.message || "WhatsApp failed")
          }
        } catch (whatsappError) {
          // Fallback to SMS
          console.log("[v0] WhatsApp error:", whatsappError)
          console.log("[v0] Attempting SMS notification as fallback...")

          const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              From: twilioSmsFrom!,
              To: "+16315780700",
              Body: message,
            }),
          })

          const smsData = await smsResponse.json()

          if (!smsResponse.ok) {
            notificationError = `SMS API error (${smsResponse.status}): ${smsData.message || JSON.stringify(smsData)}`
            console.error("[v0]", notificationError)
          } else {
            notificationSent = true
            notificationType = "SMS"
            console.log("[v0] SMS notification sent successfully! SID:", smsData.sid)
          }
        }
      }
    } catch (error) {
      notificationError = error instanceof Error ? error.message : String(error)
      console.error("[v0] Error sending notification:", error)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      notificationSent,
      notificationType,
      notificationError,
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
