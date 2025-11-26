"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusSelect } from "./status-select"
import { DeleteOrderButton } from "./delete-order-button"
import { useState } from "react"

interface Order {
  id: string
  customer_name: string
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
  totalOrders: number
  currentPage: number
  pageSize: number
  statusFilter: string
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

export function OrdersList({
  orders,
  itemsByOrder,
  totalOrders,
  currentPage,
  pageSize,
  statusFilter,
}: OrdersListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalOrders / pageSize)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/admin?${params.toString()}`)
  }

  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageSize", newSize)
    params.set("page", "1") // Reset to first page
    router.push(`/admin?${params.toString()}`)
  }

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    params.set("page", "1") // Reset to first page
    router.push(`/admin?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.set("page", "1")
    router.push(`/admin?${params.toString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-300"
      case "packed":
        return "bg-blue-50 text-blue-700 border-blue-300"
      case "delivered":
        return "bg-teal-50 text-teal-700 border-teal-300"
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 border border-gray-200 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>•</span>
            <span>{totalOrders} total</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Filter by status:</label>
            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-sm">
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 whitespace-nowrap">Per page:</label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {statusFilter && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="text-sm text-gray-600">Active filters:</span>
            <Badge className={`gap-1.5 text-sm px-3 py-1 font-semibold ${getStatusColor(statusFilter)}`}>
              Status: {statusFilter}
              <button onClick={clearFilters} className="ml-1 hover:opacity-70">
                ×
              </button>
            </Badge>
          </div>
        )}
      </Card>

      {orders.length === 0 ? (
        <Card className="p-8 text-center border border-gray-200 bg-white">
          <p className="text-sm text-gray-600">{statusFilter ? "No orders match your filters" : "No orders yet"}</p>
        </Card>
      ) : (
        orders.map((order: Order) => {
          const items = itemsByOrder[order.id] || []
          const isDeleting = deletingOrderId === order.id

          return (
            <Card
              key={order.id}
              className={`p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md bg-white transition-all duration-300 ${
                isDeleting ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-900">{order.customer_name}</h3>
                    <Badge className={`text-xs px-2.5 py-1 border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{formatTimeAgo(new Date(order.created_at))}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                    <DeleteOrderButton
                      orderId={order.id}
                      customerName={order.customer_name}
                      onDeleteStart={() => setDeletingOrderId(order.id)}
                    />
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-3xl font-bold text-gray-900">${Number(order.total_price).toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-sm font-semibold mb-3 text-gray-700">Order Items:</p>
                <div className="space-y-2">
                  {items.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm gap-3 py-2.5 px-3 bg-gray-50 rounded-md"
                    >
                      <span className="truncate text-gray-900">
                        <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-700">
                        ${Number(item.total_price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalOrders)} of{" "}
            {totalOrders} orders
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-9 px-3"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-3"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="h-9 w-9 p-0 text-sm"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 px-3"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 px-3"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
