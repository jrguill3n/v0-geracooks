"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShoppingCart, AlertTriangle } from "lucide-react"
import { convertQuoteToOrder } from "./actions"
import { toast } from "sonner"

interface ConvertToOrderButtonProps {
  quoteId: string
  status: string
  customerName: string
}

export function ConvertToOrderButton({ quoteId, status, customerName }: ConvertToOrderButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log("[v0] ConvertToOrderButton status:", status, "for quote:", quoteId)
  }, [status, quoteId])

  const isAccepted = status === "accepted"

  console.log("[v0] Convert button render - status:", status, "isAccepted:", isAccepted)

  const handleConvert = async () => {
    setLoading(true)
    setShowConfirm(false)

    console.log("[v0] Converting quote:", quoteId, "with status:", status)
    const result = await convertQuoteToOrder(quoteId)

    setLoading(false)

    if (result.error) {
      console.error("[v0] Conversion error:", result.error)
      toast.error(result.error)
    } else if (result.orderId) {
      console.log("[v0] Conversion successful! Order ID:", result.orderId)
      toast.success("Order created successfully!", {
        description: `Quote for ${customerName} has been converted to an order`,
        action: {
          label: "View Order",
          onClick: () => router.push(`/admin?orderId=${result.orderId}`),
        },
      })
      router.refresh()
    }
  }

  if (!isAccepted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-yellow-900">Conversion Not Available</p>
          <p className="text-sm text-yellow-700">
            Solo disponible cuando el estado esté en "Accepted" (actualmente: {status})
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-purple-900">Ready to Convert</p>
          <p className="text-sm text-purple-700">This accepted quote can be converted into an order</p>
        </div>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 font-semibold"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {loading ? "Converting..." : "Convert to Order"}
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Quote to Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new order for {customerName} with all the items from this quote. The quote will be
              marked as converted and cannot be converted again.
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} className="bg-purple-600 hover:bg-purple-700">
              Yes, Convert to Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
