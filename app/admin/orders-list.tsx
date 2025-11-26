"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Recent Orders</h2>
        <p className="text-sm text-muted-foreground">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      <OrderFilters onFiltersChange={setFilters} />

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center bg-background border-elegant">
          <p className="text-muted-foreground">
            {filters.length > 0 ? "No orders match your filters" : "No orders yet"}
          </p>
        </Card>
      ) : (
        filteredOrders.map((order: Order) => {
          const items = itemsByOrder[order.id] || []
          return (
            <Card key={order.id} className="p-6 bg-background border-elegant">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-xl text-foreground">{order.customer_name}</h3>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                  <div className="mt-3">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-2xl font-serif text-foreground">${Number(order.total_price).toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-elegant pt-4 mt-4">
                <p className="text-sm font-medium text-foreground mb-3">Order Items:</p>
                <div className="space-y-2">
                  {items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {item.quantity}x {item.item_name}
                      </span>
                      <span className="text-muted-foreground">${Number(item.total_price).toFixed(2)}</span>
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
