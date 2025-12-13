"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface CateringQuoteItem {
  id?: string
  label: string
  price: number
  item_type?: "priced" | "included" // Added item_type field
}

export interface CateringQuote {
  id?: string
  customer_name: string
  phone: string
  notes?: string
  status: "draft" | "sent" | "accepted" | "cancelled"
  quote_type?: "items" | "per_person"
  people_count?: number | null
  price_per_person?: number | null
  subtotal: number
  tax: number
  delivery_fee: number
  discount: number
  total: number
  created_at?: string
  updated_at?: string
  converted_order_id?: string
  converted_at?: string
}

export async function createCateringQuote(quote: CateringQuote, items: CateringQuoteItem[]) {
  try {
    const supabase = await createClient()

    console.log("[catering] create - starting with:", {
      customer: quote.customer_name,
      phone: quote.phone,
      status: quote.status,
      quoteType: quote.quote_type,
      itemCount: items.length,
      total: quote.total,
    })

    const { data: quoteData, error: quoteError } = await supabase
      .from("catering_quotes")
      .insert({
        customer_name: quote.customer_name,
        phone: quote.phone,
        notes: quote.notes,
        status: quote.status,
        quote_type: quote.quote_type || "items",
        people_count: quote.people_count,
        price_per_person: quote.price_per_person,
        subtotal: quote.subtotal,
        tax: quote.tax,
        delivery_fee: quote.delivery_fee,
        discount: quote.discount,
        total: quote.total,
      })
      .select()
      .single()

    if (quoteError) {
      console.error("[catering] create error - quote insert failed:", quoteError.message, quoteError)
      return { error: `Failed to create quote: ${quoteError.message}` }
    }

    console.log("[catering] create - quote created, ID:", quoteData.id, "Status:", quoteData.status)

    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        quote_id: quoteData.id,
        name: item.label,
        qty: 1,
        unit_price: item.price,
        line_total: item.price,
        item_type: item.item_type || "priced",
      }))

      const { error: itemsError } = await supabase.from("catering_quote_items").insert(itemsToInsert)

      if (itemsError) {
        console.error("[catering] create error - items insert failed:", itemsError.message, itemsError)
        return { error: `Quote created but failed to add items: ${itemsError.message}` }
      }
    }

    revalidatePath("/admin/catering")
    revalidatePath(`/admin/catering/${quoteData.id}`)
    console.log("[catering] create - success, revalidated paths")

    return { success: true, id: quoteData.id }
  } catch (error) {
    console.error(
      "[catering] create error - unexpected exception:",
      error instanceof Error ? error.message : "Unknown",
      error instanceof Error ? error.stack : "",
      error,
    )
    return { error: `Unexpected error creating quote: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function updateCateringQuote(id: string, quote: CateringQuote, items: CateringQuoteItem[]) {
  try {
    const supabase = await createClient()

    console.log("[catering] update - starting, ID:", id, "Status:", quote.status)

    const { error: quoteError } = await supabase
      .from("catering_quotes")
      .update({
        customer_name: quote.customer_name,
        phone: quote.phone,
        notes: quote.notes,
        status: quote.status,
        quote_type: quote.quote_type || "items",
        people_count: quote.people_count,
        price_per_person: quote.price_per_person,
        subtotal: quote.subtotal,
        tax: quote.tax,
        delivery_fee: quote.delivery_fee,
        discount: quote.discount,
        total: quote.total,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (quoteError) {
      console.error("[catering] update error - quote update failed:", quoteError.message, quoteError)
      return { error: `Failed to update quote: ${quoteError.message}` }
    }

    await supabase.from("catering_quote_items").delete().eq("quote_id", id)

    if (items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        quote_id: id,
        name: item.label,
        qty: 1,
        unit_price: item.price,
        line_total: item.price,
        item_type: item.item_type || "priced",
      }))

      const { error: itemsError } = await supabase.from("catering_quote_items").insert(itemsToInsert)

      if (itemsError) {
        console.error("[catering] update error - items insert failed:", itemsError.message, itemsError)
        return { error: `Quote updated but failed to add items: ${itemsError.message}` }
      }
    }

    const { data: updatedQuote } = await supabase.from("catering_quotes").select("status").eq("id", id).single()

    console.log("[catering] update - success, ID:", id, "Status in DB:", updatedQuote?.status)

    revalidatePath("/admin/catering")
    revalidatePath(`/admin/catering/${id}`)
    return { success: true }
  } catch (error) {
    console.error(
      "[catering] update error - unexpected exception:",
      error instanceof Error ? error.message : "Unknown",
      error instanceof Error ? error.stack : "",
      error,
    )
    return { error: `Unexpected error updating quote: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

export async function deleteCateringQuote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("catering_quotes").delete().eq("id", id)

  if (error) {
    console.error("Error deleting quote:", error)
    return { error: error.message }
  }

  revalidatePath("/admin/catering")
  return { success: true }
}

export async function duplicateCateringQuote(id: string) {
  const supabase = await createClient()

  const { data: quote, error: quoteError } = await supabase.from("catering_quotes").select("*").eq("id", id).single()

  if (quoteError) {
    return { error: quoteError.message }
  }

  const { data: items, error: itemsError } = await supabase.from("catering_quote_items").select("*").eq("quote_id", id)

  if (itemsError) {
    return { error: itemsError.message }
  }

  const { data: newQuote, error: newQuoteError } = await supabase
    .from("catering_quotes")
    .insert({
      customer_name: quote.customer_name,
      phone: quote.phone,
      notes: quote.notes,
      status: "draft",
      quote_type: quote.quote_type,
      people_count: quote.people_count,
      price_per_person: quote.price_per_person,
      subtotal: quote.subtotal,
      tax: quote.tax,
      delivery_fee: quote.delivery_fee,
      discount: quote.discount,
      total: quote.total,
    })
    .select()
    .single()

  if (newQuoteError) {
    return { error: newQuoteError.message }
  }

  if (items && items.length > 0) {
    const newItems = items.map((item) => ({
      quote_id: newQuote.id,
      name: item.name,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.line_total,
      item_type: item.item_type || "priced", // Preserve item_type
    }))

    await supabase.from("catering_quote_items").insert(newItems)
  }

  revalidatePath("/admin/catering")
  return { success: true, id: newQuote.id }
}

export async function updateQuoteStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("catering_quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/catering")
  revalidatePath(`/admin/catering/${id}`)
  return { success: true }
}

export async function convertQuoteToOrder(quoteId: string) {
  const supabase = await createClient()

  const { data: existingQuote } = await supabase
    .from("catering_quotes")
    .select("converted_order_id, status")
    .eq("id", quoteId)
    .single()

  if (existingQuote?.converted_order_id) {
    return { error: "Esta cotización ya fue convertida a orden", orderId: existingQuote.converted_order_id }
  }

  if (existingQuote?.status !== "accepted") {
    return { error: "Solo se pueden convertir cotizaciones aceptadas" }
  }

  const { data: quote, error: quoteError } = await supabase
    .from("catering_quotes")
    .select("*")
    .eq("id", quoteId)
    .single()

  if (quoteError || !quote) {
    return { error: "No se pudo encontrar la cotización" }
  }

  let orderItemsData: any[] = []

  if (quote.quote_type === "per_person") {
    const { data: includedItems } = await supabase
      .from("catering_quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .eq("item_type", "included")

    // Create single line item for per person quotes
    const itemName =
      includedItems && includedItems.length > 0
        ? `Catering - ${quote.people_count} personas (incluye: ${includedItems.map((i) => i.name).join(", ")})`
        : `Catering - ${quote.people_count} personas`

    orderItemsData.push({
      item_name: itemName,
      quantity: 1,
      unit_price: quote.subtotal,
      total_price: quote.subtotal,
      section: "Catering",
      extras: null,
    })
  } else {
    const { data: items, error: itemsError } = await supabase
      .from("catering_quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .eq("item_type", "priced")

    if (itemsError) {
      return { error: "No se pudieron cargar los items" }
    }

    orderItemsData =
      items?.map((item) => ({
        item_name: item.name,
        quantity: 1,
        unit_price: item.line_total,
        total_price: item.line_total,
        section: "Catering",
        extras: null,
      })) || []
  }

  let customerId: string

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("phone", quote.phone)
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
    if (existingCustomer.name !== quote.customer_name) {
      await supabase
        .from("customers")
        .update({ name: quote.customer_name, updated_at: new Date().toISOString() })
        .eq("id", customerId)
    }
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ phone: quote.phone, name: quote.customer_name })
      .select()
      .single()

    if (customerError) {
      return { error: "Error al crear cliente" }
    }
    customerId = newCustomer.id
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      customer_name: quote.customer_name,
      phone: quote.phone,
      total_price: quote.total,
      status: "pending",
    })
    .select()
    .single()

  if (orderError) {
    console.error("[catering] convert error - order insert failed:", orderError.message, orderError)
    return { error: "Error al crear la orden" }
  }

  // Add order ID to all items
  orderItemsData = orderItemsData.map((item) => ({ ...item, order_id: order.id }))

  // Add adjustment line if there are additional charges
  const adjustment = (quote.tax || 0) + (quote.delivery_fee || 0) - (quote.discount || 0)
  if (adjustment !== 0) {
    orderItemsData.push({
      order_id: order.id,
      item_name: "Ajustes (impuestos, envío, descuento)",
      quantity: 1,
      unit_price: adjustment,
      total_price: adjustment,
      section: "Catering",
      extras: null,
    })
  }

  const { error: itemsInsertError } = await supabase.from("order_items").insert(orderItemsData)

  if (itemsInsertError) {
    console.error("[catering] convert error - order items insert failed:", itemsInsertError.message, itemsInsertError)
    await supabase.from("orders").delete().eq("id", order.id)
    return { error: "Error al crear items de la orden" }
  }

  const { error: updateError } = await supabase
    .from("catering_quotes")
    .update({
      converted_order_id: order.id,
      converted_at: new Date().toISOString(),
    })
    .eq("id", quoteId)

  if (updateError) {
    console.error("[catering] convert error - quote update failed:", updateError.message, updateError)
  }

  revalidatePath("/admin/catering")
  revalidatePath(`/admin/catering/${quoteId}`)
  revalidatePath("/admin")

  return { success: true, orderId: order.id }
}
