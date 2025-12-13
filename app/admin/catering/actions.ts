"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface CateringQuoteItem {
  id?: string
  name: string
  description?: string
  unitPrice: number
  qty: number
  lineTotal: number
}

export interface CateringQuote {
  id?: string
  customer_name: string
  phone: string
  notes?: string
  status: "draft" | "sent" | "accepted" | "cancelled"
  subtotal: number
  tax: number
  delivery_fee: number
  discount: number
  total: number
  created_at?: string
  updated_at?: string
}

export async function createCateringQuote(quote: CateringQuote, items: CateringQuoteItem[]) {
  const supabase = await createClient()

  // Insert quote
  const { data: quoteData, error: quoteError } = await supabase
    .from("catering_quotes")
    .insert({
      customer_name: quote.customer_name,
      phone: quote.phone,
      notes: quote.notes,
      status: quote.status,
      subtotal: quote.subtotal,
      tax: quote.tax,
      delivery_fee: quote.delivery_fee,
      discount: quote.discount,
      total: quote.total,
    })
    .select()
    .single()

  if (quoteError) {
    console.error("Error creating quote:", quoteError)
    return { error: quoteError.message }
  }

  // Insert items
  const itemsToInsert = items.map((item) => ({
    quote_id: quoteData.id,
    name: item.name,
    description: item.description,
    unit_price: item.unitPrice,
    qty: item.qty,
    line_total: item.lineTotal,
  }))

  const { error: itemsError } = await supabase.from("catering_quote_items").insert(itemsToInsert)

  if (itemsError) {
    console.error("Error creating items:", itemsError)
    return { error: itemsError.message }
  }

  revalidatePath("/admin/catering")
  return { success: true, id: quoteData.id }
}

export async function updateCateringQuote(id: string, quote: CateringQuote, items: CateringQuoteItem[]) {
  const supabase = await createClient()

  // Update quote
  const { error: quoteError } = await supabase
    .from("catering_quotes")
    .update({
      customer_name: quote.customer_name,
      phone: quote.phone,
      notes: quote.notes,
      status: quote.status,
      subtotal: quote.subtotal,
      tax: quote.tax,
      delivery_fee: quote.delivery_fee,
      discount: quote.discount,
      total: quote.total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (quoteError) {
    console.error("Error updating quote:", quoteError)
    return { error: quoteError.message }
  }

  // Delete existing items
  await supabase.from("catering_quote_items").delete().eq("quote_id", id)

  // Insert new items
  const itemsToInsert = items.map((item) => ({
    quote_id: id,
    name: item.name,
    description: item.description,
    unit_price: item.unitPrice,
    qty: item.qty,
    line_total: item.lineTotal,
  }))

  const { error: itemsError } = await supabase.from("catering_quote_items").insert(itemsToInsert)

  if (itemsError) {
    console.error("Error creating items:", itemsError)
    return { error: itemsError.message }
  }

  revalidatePath("/admin/catering")
  revalidatePath(`/admin/catering/${id}`)
  return { success: true }
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

  // Fetch existing quote
  const { data: quote, error: quoteError } = await supabase.from("catering_quotes").select("*").eq("id", id).single()

  if (quoteError) {
    return { error: quoteError.message }
  }

  // Fetch items
  const { data: items, error: itemsError } = await supabase.from("catering_quote_items").select("*").eq("quote_id", id)

  if (itemsError) {
    return { error: itemsError.message }
  }

  // Create duplicate
  const { data: newQuote, error: newQuoteError } = await supabase
    .from("catering_quotes")
    .insert({
      customer_name: quote.customer_name,
      phone: quote.phone,
      notes: quote.notes,
      status: "draft",
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

  // Duplicate items
  if (items && items.length > 0) {
    const newItems = items.map((item) => ({
      quote_id: newQuote.id,
      name: item.name,
      description: item.description,
      unit_price: item.unit_price,
      qty: item.qty,
      line_total: item.line_total,
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
