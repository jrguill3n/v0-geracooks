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
        return { bg: "rgba(245, 158, 11, 0.1)", text: "var(--admin-accent-orange)", border: "rgba(245, 158, 11, 0.3)" }
      case "packed":
        return { bg: "rgba(59, 130, 246, 0.1)", text: "var(--admin-accent-blue)", border: "rgba(59, 130, 246, 0.3)" }
      case "delivered":
        return { bg: "rgba(16, 185, 129, 0.1)", text: "var(--admin-accent-green)", border: "rgba(16, 185, 129, 0.3)" }
      case "cancelled":
        return { bg: "rgba(239, 68, 68, 0.1)", text: "var(--admin-accent-red)", border: "rgba(239, 68, 68, 0.3)" }
      default:
        return { bg: "rgba(160, 160, 160, 0.1)", text: "var(--admin-text-muted)", border: "rgba(160, 160, 160, 0.3)" }
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col gap-4 p-5 rounded-lg border"
        style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--admin-text)" }}>
            Recent Orders
          </h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>•</span>
            <span>{totalOrders} total orders</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap" style={{ color: "var(--admin-text-muted)" }}>
              Filter by status:
            </label>
            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger
                className="w-[140px] h-9 text-sm border"
                style={{
                  background: "var(--admin-bg)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {statusFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-9 text-sm hover:bg-white/10"
                style={{ color: "var(--admin-text-muted)" }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm whitespace-nowrap" style={{ color: "var(--admin-text-muted)" }}>
              Per page:
            </label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger
                className="w-[100px] h-9 text-sm border"
                style={{
                  background: "var(--admin-bg)",
                  borderColor: "var(--admin-border)",
                  color: "var(--admin-text)",
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}>
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
            <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
              Active filters:
            </span>
            <Badge
              className="gap-1.5 text-sm px-3 py-1 rounded-md border font-medium"
              style={{
                background: getStatusColor(statusFilter).bg,
                color: getStatusColor(statusFilter).text,
                borderColor: getStatusColor(statusFilter).border,
              }}
            >
              Status: {statusFilter}
              <button
                onClick={clearFilters}
                className="ml-1 hover:opacity-70 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </Badge>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <Card
          className="p-8 text-center border"
          style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {statusFilter ? "No orders match your filters" : "No orders yet"}
          </p>
        </Card>
      ) : (
        orders.map((order: Order) => {
          const items = itemsByOrder[order.id] || []
          const statusColors = getStatusColor(order.status)

          return (
            <Card
              key={order.id}
              className="p-5 border hover:border-opacity-60 transition-all"
              style={{ background: "var(--admin-card)", borderColor: "var(--admin-border)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold truncate" style={{ color: "var(--admin-text)" }}>
                      {order.customer_name}
                    </h3>
                    <Badge
                      className="text-sm px-3 py-1 rounded-md border font-medium"
                      style={{
                        background: statusColors.bg,
                        color: statusColors.text,
                        borderColor: statusColors.border,
                      }}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm truncate mb-1" style={{ color: "var(--admin-text-muted)" }}>
                    {order.customer_phone}
                  </p>
                  <p className="text-xs mb-3" style={{ color: "var(--admin-text-muted)" }}>
                    {formatTimeAgo(new Date(order.created_at))}
                  </p>
                  <div className="mt-2">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--admin-accent-green)" }}>
                    ${Number(order.total_price).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4 mt-4" style={{ borderColor: "var(--admin-border)" }}>
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
                  Order Items:
                </p>
                <div className="space-y-2">
                  {items.map((item: OrderItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm gap-3 py-2 px-3 rounded-md"
                      style={{ background: "var(--admin-bg)" }}
                    >
                      <span className="truncate" style={{ color: "var(--admin-text)" }}>
                        <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                      </span>
                      <span className="shrink-0 font-medium" style={{ color: "var(--admin-text-muted)" }}>
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
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalOrders)} of{" "}
            {totalOrders} orders
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="h-9 px-3 border hover:bg-white/10"
              style={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 px-3 border hover:bg-white/10"
              style={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
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
                    className="h-9 w-9 p-0 text-sm border hover:bg-white/10"
                    style={
                      currentPage === pageNum
                        ? {
                            background: "var(--admin-accent-blue)",
                            borderColor: "var(--admin-accent-blue)",
                            color: "white",
                          }
                        : {
                            borderColor: "var(--admin-border)",
                            color: "var(--admin-text)",
                          }
                    }
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
              className="h-9 px-3 border hover:bg-white/10"
              style={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 px-3 border hover:bg-white/10"
              style={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
