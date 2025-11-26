"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus } from "./actions"
import { useTransition } from "react"

interface StatusSelectProps {
  orderId: string
  currentStatus: string
}

export function StatusSelect({ orderId, currentStatus }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
    })
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
      <SelectTrigger className="w-[140px] border-elegant">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="delivered">Delivered</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
      </SelectContent>
    </Select>
  )
}
