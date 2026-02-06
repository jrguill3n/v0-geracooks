"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateOrderStatus, updatePaymentStatus } from "./actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign } from "lucide-react"

interface StatusSelectProps {
  orderId: string
  currentStatus: string
  currentPaymentStatus?: string
}

export function StatusSelect({ orderId, currentStatus, currentPaymentStatus = "unpaid" }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleStatusChange = (newStatus: string) => {
    console.log("[v0] Updating order", orderId, "to status:", newStatus)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus)
      console.log("[v0] Update result:", result)
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to update status:", result.error)
        alert(`Failed to update status: ${result.error}`)
      }
    })
  }

  const handlePaymentToggle = (checked: boolean) => {
    const newPaymentStatus = checked ? "paid" : "unpaid"
    console.log("[v0] Updating order", orderId, "to payment_status:", newPaymentStatus)
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, newPaymentStatus)
      console.log("[v0] Payment update result:", result)
      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to update payment status:", result.error)
        alert(`Failed to update payment status: ${result.error}`)
      }
    })
  }

  const isPaid = currentPaymentStatus === "paid"

  return (
    <div className="flex items-center gap-3">
      <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
        <SelectTrigger className="w-[150px] h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="packed">Packed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <DollarSign className={`h-4 w-4 ${isPaid ? "text-emerald-600" : "text-gray-300"}`} />
        <Switch
          checked={isPaid}
          onCheckedChange={handlePaymentToggle}
          disabled={isPending}
          className="data-[state=checked]:bg-emerald-500"
          aria-label="Toggle payment status"
        />
      </div>
    </div>
  )
}
