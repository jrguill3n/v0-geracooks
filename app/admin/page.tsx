import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { OrdersList } from "./orders-list"
import { AdminNav } from "@/components/admin-nav"
import { PWAInstaller } from "@/components/pwa-installer"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { OrdersSummaryCards } from "./orders-summary-cards"

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
  searchParams: Promise<{ page?: string; pageSize?: string; status?: string; phone?: string }>
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

  const supabase = await createClient()

  let countQuery = supabase.from("orders").select("*, customers!inner(phone, nickname)", { count: "exact", head: true })

  if (statusFilter) {
    countQuery = countQuery.eq("status", statusFilter)
  }

  if (phoneFilter) {
    countQuery = countQuery.ilike("customers.phone", `%${phoneFilter}%`)
  }

  const { count: totalOrders } = await countQuery

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

  const { data: orders, error: ordersError } = await ordersQuery

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
    return <div className="p-8">Error loading orders</div>
  }

  const orderIds = orders?.map((order) => order.id) || []
  const { data: allItems, error: itemsError } = await supabase.from("order_items").select("*").in("order_id", orderIds)

  if (itemsError) {
    console.error("Error fetching order items:", itemsError)
  }

  const itemNames = [...new Set(allItems?.map((item) => item.item_name) || [])]
  const { data: menuItemsWithSections } = await supabase
    .from("menu_items")
    .select("name, menu_sections(name)")
    .in("name", itemNames)

  // Create a map of item name to section name
  const sectionMap = new Map(menuItemsWithSections?.map((item) => [item.name, item.menu_sections?.name]) || [])

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

  const { data: allOrdersForStats } = await supabase
    .from("orders")
    .select("id, total_price, created_at")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30">
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
        />
      </div>
    </div>
  )
}
