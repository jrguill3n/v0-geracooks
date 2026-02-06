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
        status: "new",
        payment_status: "unpaid",
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Error creating order:", orderError)
      throw orderError
    }

    const { data: menuItemsData } = await supabase.from("menu_items").select("id, name, price, menu_sections(name)")

    const { data: extrasData } = await supabase.from("menu_item_extras").select("*")

    const priceMap = new Map(menuItemsData?.map((item) => [item.name, Number(item.price)]) || [])
    const sectionMap = new Map(menuItemsData?.map((item) => [item.name, item.menu_sections?.name || "Other"]) || [])
    const itemIdMap = new Map(menuItemsData?.map((item) => [item.name, item.id]) || [])

    const orderItemsData = Object.entries(orderItems).map(([itemName, orderItem]) => {
      const { quantity, extras } = orderItem as { quantity: number; extras: string[] }
      const unitPrice = priceMap.get(itemName) || 0
      const section = sectionMap.get(itemName) || "Other"
      const itemId = itemIdMap.get(itemName)

      // Calculate extras price
      let extrasPrice = 0
      const selectedExtras: Array<{ name: string; price: number }> = []

      if (extras && extras.length > 0 && itemId) {
        extras.forEach((extraId) => {
          const extra = extrasData?.find((e) => e.id === extraId && e.menu_item_id === itemId)
          if (extra) {
            extrasPrice += Number(extra.price)
            selectedExtras.push({ name: extra.name, price: Number(extra.price) })
          }
        })
      }

      const totalUnitPrice = unitPrice + extrasPrice
      const itemTotal = totalUnitPrice * quantity

      return {
        order_id: order.id,
        item_name: itemName,
        quantity,
        unit_price: totalUnitPrice,
        total_price: itemTotal,
        section,
        extras: selectedExtras, // Store extras as JSONB
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

    if (itemsError) {
      console.error("[v0] Error creating order items:", itemsError)
      throw itemsError
    }

    try {
      await fetch(`${request.headers.get("origin")}/api/send-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerName,
          total: totalPrice,
        }),
      })
    } catch (pushError) {
      console.error("[v0] Error sending push notification:", pushError)
      // Don't fail the order if push fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
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
