"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, MessageCircle, Edit, Copy, Trash2 } from "lucide-react"
import { deleteCateringQuote, duplicateCateringQuote, updateQuoteStatus } from "./actions"
import { useRouter } from "next/navigation"

interface Quote {
  id: string
  customer_name: string
  phone: string
  total: number
  status: string
  created_at: string
}

export function CateringList({ initialQuotes }: { initialQuotes: Quote[] }) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return

    const result = await deleteCateringQuote(id)
    if (result.success) {
      setQuotes(quotes.filter((q) => q.id !== id))
    }
  }

  const handleDuplicate = async (id: string) => {
    const result = await duplicateCateringQuote(id)
    if (result.success && result.id) {
      router.push(`/admin/catering/${result.id}`)
    }
  }

  const generateWhatsAppLink = (quote: Quote, items: any[]) => {
    let message = `Hola ${quote.customer_name}! 👋\n\n`
    message += `Aquí está tu cotización de catering:\n\n`
    message += `📋 *Detalles*\n`
    message += `─────────────────\n\n`

    items.forEach((item) => {
      message += `• ${item.qty}x ${item.name} - $${Number(item.line_total).toFixed(2)}\n`
      if (item.description) {
        message += `  ${item.description}\n`
      }
    })

    message += `\n─────────────────\n`
    message += `💰 *Total: $${Number(quote.total).toFixed(2)}*\n\n`
    message += `Por favor confirma si te interesa esta cotización. ¡Gracias! 🙏`

    const phone = quote.phone.replace(/\D/g, "")
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${phone}?text=${encodedMessage}`
  }

  const handleWhatsApp = async (quote: Quote) => {
    // Fetch items for this quote
    const response = await fetch(`/api/catering/${quote.id}`)
    const data = await response.json()

    const whatsappLink = generateWhatsAppLink(quote, data.items || [])
    window.open(whatsappLink, "_blank")

    // Update status to sent if it's draft
    if (quote.status === "draft") {
      await updateQuoteStatus(quote.id, "sent")
      setQuotes(quotes.map((q) => (q.id === quote.id ? { ...q, status: "sent" } : q)))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Catering Quotes</h2>
        <Link href="/admin/catering/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Quote
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No catering quotes yet. Create your first one!
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ${Number(quote.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(quote.status)}`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleWhatsApp(quote)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Link href={`/admin/catering/${quote.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-teal-500 text-teal-600 hover:bg-teal-50 bg-transparent"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(quote.id)}
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(quote.id)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
