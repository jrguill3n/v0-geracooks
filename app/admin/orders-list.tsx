"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusSelect } from "./status-select"
import { DeleteOrderButton } from "./delete-order-button"
import { EditOrderModal } from "./edit-order-modal"
import { useState } from "react"
import { Pencil, MessageCircle } from "lucide-react"
import { getOrderItemCount, formatItemCount } from "@/lib/get-order-item-count"

interface Order {
  id: string
  customer_name: string
  phone: string
  total_price: number
  status: string
  payment_status?: string
  created_at: string
  customers?: {
    phone: string
    nickname: string
  }
  source?: string
  catering_quote_id?: string
}

interface OrderItem {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  section?: string // Add section field
  extras?: Array<{ name: string; price: number }> // Add extras field to display selected extras
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
  phoneFilter: string
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
  phoneFilter,
}: OrdersListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalOrders / pageSize)
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<{ id: string; name: string; items: OrderItem[] } | null>(null)
  const [phoneSearch, setPhoneSearch] = useState(phoneFilter)
  const [showCateringOnly, setShowCateringOnly] = useState(false)

  const filteredOrders = showCateringOnly ? orders.filter((order: any) => order.source === "catering") : orders

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

  const handlePhoneSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (phoneSearch.trim()) {
      params.set("phone", phoneSearch.trim())
    } else {
      params.delete("phone")
    }
    params.set("page", "1")
    router.push(`/admin?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("status")
    params.delete("phone")
    params.set("page", "1")
    setPhoneSearch("")
    setShowCateringOnly(false)
    router.push(`/admin?${params.toString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-amber-50 text-amber-700 border-amber-300"
      case "packed":
        return "bg-blue-50 text-blue-700 border-blue-300"
      case "completed":
        return "bg-teal-50 text-teal-700 border-teal-300"
      case "cancelled":
        return "bg-gray-100 text-gray-700 border-gray-300"
      default:
        return "bg-gray-50 text-gray-600 border-gray-200"
    }
  }

  const getPaymentColor = (paymentStatus: string) => {
    return paymentStatus === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
      : "bg-red-50 text-red-700 border-red-300"
  }

  const generateWhatsAppLink = (order: Order, items: OrderItem[]) => {
    const itemsBySection: Record<string, OrderItem[]> = {}
    items.forEach((item: OrderItem) => {
      const section = item.section || "Other"
      if (!itemsBySection[section]) {
        itemsBySection[section] = []
      }
      itemsBySection[section].push(item)
    })

    let message = `Hello ${order.customer_name}! 👋\n\n`
    message += `Here's your order confirmation:\n\n`
    message += `📋 *Order Details*\n`
    message += `─────────────────\n\n`

    Object.entries(itemsBySection).forEach(([section, sectionItems]) => {
      message += `*${section.toUpperCase()}*\n`
      sectionItems.forEach((item: OrderItem) => {
        message += `• ${item.quantity}x ${item.item_name} - $${Number(item.total_price).toFixed(2)}\n`
        if (item.extras && item.extras.length > 0) {
          item.extras.forEach((extra) => {
            message += `  + ${extra.name} - $${Number(extra.price).toFixed(2)}\n`
          })
        }
      })
      message += `\n`
    })

    message += `─────────────────\n`
    message += `💰 *Total: $${Number(order.total_price).toFixed(2)}*\n\n`
    message += `We'll contact you soon to confirm delivery details. Thank you for your order! 🙏`

    const phone = (order.customers?.phone || order.phone || "").replace(/\D/g, "")
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${phone}?text=${encodedMessage}`
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Orders</h2>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>•</span>
            <span>{totalOrders} total</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Status filter row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Filter by status:</label>
            <div className="flex items-center gap-2 flex-1">
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {statusFilter && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs sm:text-sm">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Phone search row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Search by phone:</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                placeholder="Enter phone number"
                className="h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 min-w-0"
              />
              <Button
                onClick={handlePhoneSearch}
                size="sm"
                className="h-9 bg-teal-500 hover:bg-teal-600 text-white shrink-0"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Per page selector row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <label className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Per page:</label>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-full sm:w-[100px] h-9 text-sm">
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

          {/* Catering filter toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cateringFilter"
              checked={showCateringOnly}
              onChange={(e) => setShowCateringOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="cateringFilter" className="text-sm text-gray-700 cursor-pointer select-none">
              Show Catering only
            </label>
          </div>
        </div>

        {(statusFilter || phoneFilter || showCateringOnly) && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className="text-sm text-gray-600">Active filters:</span>
            {statusFilter && (
              <Badge className={`gap-1.5 text-sm px-3 py-1 font-semibold ${getStatusColor(statusFilter)}`}>
                Status: {statusFilter}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete("status")
                    params.set("page", "1")
                    router.push(`/admin?${params.toString()}`)
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  ×
                </button>
              </Badge>
            )}
            {phoneFilter && (
              <Badge className="gap-1.5 text-sm px-3 py-1 font-semibold bg-teal-50 text-teal-700 border-teal-300">
                Phone: {phoneFilter}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete("phone")
                    params.set("page", "1")
                    setPhoneSearch("")
                    router.push(`/admin?${params.toString()}`)
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  ×
                </button>
              </Badge>
            )}
            {showCateringOnly && (
              <Badge className="gap-1.5 text-sm px-3 py-1 font-semibold bg-purple-100 text-purple-700 border-purple-300">
                Catering
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set("page", "1")
                    setShowCateringOnly(false)
                    router.push(`/admin?${params.toString()}`)
                  }}
                  className="ml-1 hover:opacity-70"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {filteredOrders.length === 0 ? (
        <Card className="p-8 text-center border border-gray-200 bg-white">
          <p className="text-sm text-gray-600">
            {showCateringOnly
              ? "No catering orders found"
              : statusFilter || phoneFilter
                ? "No orders match your filters"
                : "No orders yet"}
          </p>
        </Card>
      ) : (
        filteredOrders.map((order: any) => {
          const items = itemsByOrder[order.id] || []
          const isDeleting = deletingOrderId === order.id
          const customerNickname = order.customers?.nickname
          const isCateringOrder = order.source === "catering"

          const itemsBySection: Record<string, OrderItem[]> = {}
          items.forEach((item: OrderItem) => {
            const section = item.section || "Other"
            if (!itemsBySection[section]) {
              itemsBySection[section] = []
            }
            itemsBySection[section].push(item)
          })

          return (
            <Card
              key={order.id}
              className={`p-4 sm:p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 overflow-hidden ${
                isDeleting ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"
              } ${isCateringOrder ? "bg-purple-50/30" : "bg-white"}`}
            >
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        {order.customer_name}
                        {customerNickname && <span className="text-teal-600 ml-2">({customerNickname})</span>}
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          {formatItemCount(getOrderItemCount(items))}
                        </span>
                      </h3>
                      <Badge className={`text-xs px-2.5 py-1 border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                      <Badge className={`text-xs px-2.5 py-1 border ${getPaymentColor(order.payment_status || "unpaid")}`}>
                        {order.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                      {isCateringOrder && (
                        <Badge className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 border-purple-300">
                          Catering
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 mb-1 break-all">
                      📞 {order.customers?.phone || order.phone || "No phone"}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">{formatTimeAgo(new Date(order.created_at))}</p>
                    {order.catering_quote_id && (
                      <a
                        href={`/admin/catering/${order.catering_quote_id}`}
                        className="text-xs text-purple-600 hover:text-purple-800 underline"
                      >
                        View Catering Quote →
                      </a>
                    )}
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      ${Number(order.total_price).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusSelect orderId={order.id} currentStatus={order.status} currentPaymentStatus={order.payment_status || "unpaid"} />
                  <Button
                    size="sm"
                    onClick={() => {
                      const whatsappLink = generateWhatsAppLink(order, items)
                      window.open(whatsappLink, "_blank")
                    }}
                    className="h-9 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                    disabled={!order.customers?.phone && !order.phone}
                    title="Send order to customer via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingOrder({ id: order.id, name: order.customer_name, items })}
                    className="h-9 text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-sm"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DeleteOrderButton
                    orderId={order.id}
                    customerName={order.customer_name}
                    onDeleteStart={() => setDeletingOrderId(order.id)}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-sm sm:text-base font-semibold mb-3 text-gray-700">
                  Order Items{" "}
                  <span className="font-normal text-gray-400">{formatItemCount(getOrderItemCount(items))}</span>:
                </p>
                <div className="space-y-4">
                  {Object.entries(itemsBySection).map(([section, sectionItems]) => (
                    <div key={section}>
                      <h4 className="text-sm sm:text-base font-bold text-primary uppercase mb-2 tracking-wide">
                        {section}
                      </h4>
                      <div className="space-y-2">
                        {sectionItems.map((item: OrderItem) => (
                          <div key={item.id} className="bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between text-base sm:text-lg gap-2 sm:gap-3 py-2.5 sm:py-3 px-3 sm:px-4">
                              <span className="truncate text-gray-900 min-w-0">
                                <span className="font-semibold">{item.quantity}x</span> {item.item_name}
                              </span>
                              <span className="shrink-0 font-semibold text-gray-700">
                                ${Number(item.total_price).toFixed(2)}
                              </span>
                            </div>
                            {item.extras && item.extras.length > 0 && (
                              <div className="px-3 sm:px-4 pb-2.5 sm:pb-3 space-y-1">
                                {item.extras.map((extra, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-sm text-purple-700 pl-4"
                                  >
                                    <span className="flex items-center gap-1">
                                      <span className="text-purple-400">+</span>
                                      <span>{extra.name}</span>
                                    </span>
                                    <span className="font-medium">${Number(extra.price).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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

      {editingOrder && (
        <EditOrderModal
          orderId={editingOrder.id}
          customerName={editingOrder.name}
          items={editingOrder.items}
          open={!!editingOrder}
          onOpenChange={(open) => !open && setEditingOrder(null)}
        />
      )}
    </div>
  )
}
