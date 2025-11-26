"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusSelect } from "./status-select"

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
        return "bg-yellow-100 text-yellow-800"
      case "packed":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="font-serif text-xl sm:text-2xl text-foreground">Recent Orders</h2>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>•</span>
            <span>{totalOrders} total orders</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Filter by status:</label>
            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs sm:text-sm">
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
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Per page:</label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[100px] h-8 text-xs sm:text-sm">
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              Status: {statusFilter}
              <button
                onClick={clearFilters}
                className="ml-1 hover:bg-foreground/20 rounded-full w-3.5 h-3.5 flex items-center justify-center"
              >
                ×
              </button>
            </Badge>
          </div>
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="p-6 text-center bg-background border-elegant">
          <p className="text-sm text-muted-foreground">
            {statusFilter ? "No orders match your filters" : "No orders yet"}
          </p>
        </Card>
      ) : (
        orders.map((order: Order) => {
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

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalOrders)} of{" "}
            {totalOrders} orders
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-3"
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-2 sm:px-3"
            >
              Previous
            </Button>

            {/* Page numbers */}
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
                    className="h-8 w-8 p-0 text-xs sm:text-sm"
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
              className="h-8 px-2 sm:px-3"
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 px-2 sm:px-3"
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
