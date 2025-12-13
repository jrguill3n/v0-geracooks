import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { CateringForm } from "../catering-form"
import { notFound } from "next/navigation"

export default async function EditCateringPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: quote, error } = await supabase.from("catering_quotes").select("*").eq("id", params.id).single()

  if (error || !quote) {
    notFound()
  }

  const { data: items } = await supabase
    .from("catering_quote_items")
    .select("*")
    .eq("quote_id", params.id)
    .order("created_at", { ascending: true })

  const formattedItems = (items || []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    unitPrice: Number(item.unit_price),
    qty: item.qty,
    lineTotal: Number(item.line_total),
  }))

  return (
    <>
      <AdminNav title="Edit Catering Quote" subtitle={`Quote for ${quote.customer_name}`} />
      <CateringForm
        initialQuote={{
          id: quote.id,
          customer_name: quote.customer_name,
          phone: quote.phone,
          notes: quote.notes,
          status: quote.status,
          subtotal: Number(quote.subtotal),
          tax: Number(quote.tax),
          delivery_fee: Number(quote.delivery_fee),
          discount: Number(quote.discount),
          total: Number(quote.total),
        }}
        initialItems={formattedItems}
      />
    </>
  )
}
