import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { OrdersList } from "./orders-list"
import { AdminNav } from "@/components/admin-nav"
import { PWAInstaller } from "@/components/pwa-installer"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { OrdersSummaryCards } from "./orders-summary-cards"
import { getSectionName } from "@/lib/get-section-name"

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  total_price: number
  status: string
  created_at: string
  customers: {
    phone: string
    nickname: string
  }
}

interface OrderItem {
  id: string
  order_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
  section: string
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; status?: string; phone?: string; payment?: string }>
}) {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const params = await searchParams
  const currentPage = Number.parseInt(params.page || "1")
  const pageSize = Number.parseInt(params.pageSize || "20")
  const statusFilter = params.status || ""
  const phoneFilter = params.phone || ""
  const paymentFilter = params.payment || ""

  const supabase = await createClient()

  let countQuery = supabase.from("orders").select("*, customers!inner(phone, nickname)", { count: "exact", head: true })

  if (statusFilter) {
    countQuery = countQuery.eq("status", statusFilter)
  }

  if (phoneFilter) {
    countQuery = countQuery.ilike("customers.phone", `%${phoneFilter}%`)
  }

  if (paymentFilter) {
    countQuery = countQuery.eq("payment_status", paymentFilter)
  }

  let ordersQuery = supabase
    .from("orders")
    .select("*, customers(phone, nickname)")
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (statusFilter) {
    ordersQuery = ordersQuery.eq("status", statusFilter)
  }

  if (phoneFilter) {
    ordersQuery = ordersQuery.ilike("customers.phone", `%${phoneFilter}%`)
  }

  if (paymentFilter) {
    ordersQuery = ordersQuery.eq("payment_status", paymentFilter)
  }

  // The summary cards only need the current year (week/month/year buckets),
  // so bound the stats query instead of pulling the entire orders table.
  const statsYearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const statsQuery = supabase
    .from("orders")
    .select("id, total_price, created_at")
    .gte("created_at", statsYearStart)

  // The menu_items table is small and its section mapping doesn't depend on the
  // orders result, so fetch it in the same parallel batch instead of waiting for
  // the order items to come back first (removes a serial round-trip).
  const menuSectionsQuery = supabase.from("menu_items").select("name, menu_sections(name)")

  // These queries are independent of each other, so run them in parallel.
  const [
    { count: totalOrders },
    { data: rawOrders, error: ordersError },
    { data: allOrdersForStats },
    { data: menuItemsWithSections },
  ] = await Promise.all([countQuery, ordersQuery, statsQuery, menuSectionsQuery])

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
    return <div className="p-8">Error loading orders</div>
  }

  // Data normalization: map old statuses to new ones and delete cancelled orders
  const cancelledOrderIds: string[] = []
  const orders = (rawOrders || [])
    .map((order) => {
      let normalizedStatus = order.status

      // Normalize statuses
      if (order.status === "completed") {
        normalizedStatus = "delivered"
      } else if (!["new", "in_progress", "packed", "delivered"].includes(order.status)) {
        // Unknown statuses become "new"
        normalizedStatus = "new"
      }

      // Track cancelled orders for deletion
      if (order.status === "cancelled") {
        cancelledOrderIds.push(order.id)
        return null // Will be filtered out
      }

      // Update status in database if it changed
      if (normalizedStatus !== order.status) {
        supabase.from("orders").update({ status: normalizedStatus }).eq("id", order.id)
      }

      return {
        ...order,
        status: normalizedStatus,
      }
    })
    .filter((order): order is NonNullable<typeof order> => order !== null)

  // Delete cancelled orders and their items
  if (cancelledOrderIds.length > 0) {
    await supabase.from("order_items").delete().in("order_id", cancelledOrderIds)
    await supabase.from("orders").delete().in("id", cancelledOrderIds)
  }

  const orderIds = orders?.map((order) => order.id) || []
  const { data: allItems, error: itemsError } = await supabase.from("order_items").select("*").in("order_id", orderIds)

  if (itemsError) {
    console.error("Error fetching order items:", itemsError)
  }

  // Create a map of item name to section name (menu fetched in the parallel batch above)
  const sectionMap = new Map(menuItemsWithSections?.map((item) => [item.name, getSectionName(item.menu_sections)]) || [])

  const itemsByOrder = (allItems || []).reduce(
    (acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = []
      }

      // Use stored section, or fallback to looking it up from the map
      const section = item.section || sectionMap.get(item.item_name) || "OTHER"

      acc[item.order_id].push({
        ...item,
        section,
      })
      return acc
    },
    {} as Record<string, OrderItem[]>,
  )

  return (
    <div className="min-h-screen pwa-safe-bottom bg-gradient-to-br from-primary/5 via-white to-secondary/30">
      <PullToRefresh />
      <AdminNav title="GERA COOKS Admin" subtitle="Order Management Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <PWAInstaller />

        <OrdersSummaryCards orders={allOrdersForStats || []} />

        <OrdersList
          orders={orders || []}
          itemsByOrder={itemsByOrder}
          totalOrders={totalOrders || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          statusFilter={statusFilter}
          phoneFilter={phoneFilter}
          paymentFilter={paymentFilter}
        />
      </div>
    </div>
  )
}
