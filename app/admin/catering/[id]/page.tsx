import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { CateringForm } from "../catering-form"
import { ConvertToOrderButton } from "../convert-to-order-button"
import Link from "next/link"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function EditCateringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log("[v0] Loading catering quote with ID:", id)

  const supabase = await createClient()

  const { data: quote, error } = await supabase.from("catering_quotes").select("*").eq("id", id).single()

  console.log("[v0] Quote lookup result:", {
    found: !!quote,
    status: quote?.status,
    quote_type: quote?.quote_type,
    error: error?.message,
  })

  if (error || !quote) {
    console.error("[v0] Quote not found. ID:", id, "Error:", error)
    return (
      <>
        <AdminNav title="Quote Not Found" subtitle="This quote could not be found" />
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">Quote Not Found</h2>
            <p className="text-yellow-700 mb-2">
              The catering quote you're looking for doesn't exist or has been deleted.
            </p>
            <p className="text-xs text-yellow-600 mb-6 font-mono">ID: {id}</p>
            <Link href="/admin/catering">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Catering List
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const quoteStatus = quote.status || "draft"
  if (!quote.status) {
    console.warn("[v0] Warning: Quote status is null/undefined, defaulting to 'draft'")
  }

  const { data: items } = await supabase
    .from("catering_quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("created_at", { ascending: true })

  const pricedItems = (items || [])
    .filter((item) => !item.item_type || item.item_type === "priced")
    .map((item) => ({
      id: item.id,
      label: item.name,
      price: Number(item.line_total),
      item_type: "priced" as const,
    }))

  const includedItems = (items || [])
    .filter((item) => item.item_type === "included")
    .map((item) => ({
      id: item.id,
      label: item.name,
      price: 0,
      item_type: "included" as const,
    }))

  const allItems = [...pricedItems, ...includedItems]

  console.log(
    "[v0] Successfully loaded quote:",
    quote.id,
    "Status:",
    quoteStatus,
    "with",
    pricedItems.length,
    "priced items and",
    includedItems.length,
    "included items",
  )

  return (
    <>
      <AdminNav title="Edit Catering Quote" subtitle={`Quote for ${quote.customer_name}`} />

      {quote.converted_order_id && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Order Created Automatically</p>
                <p className="text-sm text-green-700">
                  {quote.converted_at
                    ? new Date(quote.converted_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Recently"}
                </p>
              </div>
            </div>
            <Link
              href={`/admin`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              View Order →
            </Link>
          </div>
        </div>
      )}

      {!quote.converted_order_id && quoteStatus !== "approved" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <ConvertToOrderButton quoteId={quote.id} status={quoteStatus} customerName={quote.customer_name} />
        </div>
      )}

      <CateringForm
        initialQuote={{
          id: quote.id,
          customer_name: quote.customer_name,
          phone: quote.phone,
          notes: quote.notes,
          status: quoteStatus,
          quote_type: quote.quote_type || "items",
          people_count: quote.people_count,
          price_per_person: quote.price_per_person ? Number(quote.price_per_person) : 0,
          subtotal: Number(quote.subtotal),
          tax: Number(quote.tax),
          delivery_fee: Number(quote.delivery_fee),
          discount: Number(quote.discount),
          total: Number(quote.total),
          converted_order_id: quote.converted_order_id,
          converted_at: quote.converted_at,
        }}
        initialItems={allItems}
      />
    </>
  )
}
