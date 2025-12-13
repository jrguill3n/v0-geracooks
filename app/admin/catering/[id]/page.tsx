import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { CateringForm } from "../catering-form"
import { ConvertToOrderButton } from "../convert-to-order-button"
import Link from "next/link"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
// </CHANGE>

export default async function EditCateringPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: quote, error } = await supabase.from("catering_quotes").select("*").eq("id", params.id).single()

  if (error || !quote) {
    return (
      <>
        <AdminNav title="Quote Not Found" subtitle="This quote could not be found" />
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-yellow-900 mb-2">Quote Not Found</h2>
            <p className="text-yellow-700 mb-6">
              The catering quote you're looking for doesn't exist or has been deleted.
            </p>
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
  // </CHANGE>

  const { data: items } = await supabase
    .from("catering_quote_items")
    .select("*")
    .eq("quote_id", params.id)
    .order("created_at", { ascending: true })

  const formattedItems = (items || []).map((item) => ({
    id: item.id,
    label: item.name,
    price: Number(item.line_total),
  }))

  return (
    <>
      <AdminNav title="Edit Catering Quote" subtitle={`Quote for ${quote.customer_name}`} />

      {quote.converted_order_id ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Converted to Order</p>
                <p className="text-sm text-green-700">
                  {new Date(quote.converted_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Link
              href={`/admin?orderId=${quote.converted_order_id}`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              View Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <ConvertToOrderButton quoteId={quote.id} status={quote.status} customerName={quote.customer_name} />
        </div>
      )}

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
          converted_order_id: quote.converted_order_id,
          converted_at: quote.converted_at,
        }}
        initialItems={formattedItems}
      />
    </>
  )
}
