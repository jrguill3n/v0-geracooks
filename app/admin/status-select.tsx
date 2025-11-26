"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus } from "./actions"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

interface StatusSelectProps {
  orderId: string
  currentStatus: string
}

export function StatusSelect({ orderId, currentStatus }: StatusSelectProps) {
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

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
      <SelectTrigger
        className="w-[150px] h-9 text-sm border"
        style={{ background: "var(--admin-bg)", borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="packed">Packed</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  )
}
