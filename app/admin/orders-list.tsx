"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusSelect } from "./status-select"
import { OrderFilters } from "./order-filters"

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  total_price: number
  status: string
  created_at: string
}

interface OrderItem {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface FilterTag {
  type: "status" | "phone"
  value: string
  label: string
}

interface OrdersListProps {
  orders: Order[]
  itemsByOrder: Record<string, OrderItem[]>
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`

  const months = Math.floor(days / 30)
  return `${months} month${months > 1 ? "s" : ""} ago`
}

export function OrdersList({ orders, itemsByOrder }: OrdersListProps) {
  const [filters, setFilters] = useState<FilterTag[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    // If no filters, show all
    if (filters.length === 0) return true

    // Check each filter
    for (const filter of filters) {
      if (filter.type === "status") {
        if (order.status !== filter.value) return false
      }
      if (filter.type === "phone") {
        if (!order.customer_phone.includes(filter.value)) return false
      }
    }

    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="font-serif text-xl sm:text-2xl text-foreground">Recent Orders</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      <OrderFilters onFiltersChange={setFilters} />

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-6 text-center bg-background border-elegant">
          <p className="text-sm text-muted-foreground">
            {filters.length > 0 ? "No orders match your filters" : "No orders yet"}
          </p>
        </Card>
      ) : (
        filteredOrders.map((order: Order) => {
          const items = itemsByOrder[order.id] || []
          return (
            <Card key={order.id} className="p-4 bg-background border-elegant">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-serif text-lg sm:text-xl text-foreground truncate">{order.customer_name}</h3>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.customer_phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(new Date(order.created_at))}</p>
                  <div className="mt-2">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-xl sm:text-2xl font-serif text-foreground">
                    ${Number(order.total_price).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-elegant pt-3 mt-3">
                <p className="text-xs sm:text-sm font-medium text-foreground mb-2">Order Items:</p>
                <div className="space-y-1.5">
                  {items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                      <span className="text-foreground truncate">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="text-muted-foreground shrink-0">${Number(item.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })
      )}
    </div>
  )
}
