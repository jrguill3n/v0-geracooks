import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { logoutAction } from "./actions"
import { OrdersList } from "./orders-list"
import Link from "next/link"

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

  const itemsByOrder = (allItems || []).reduce(
    (acc, item) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = []
      }
      acc[item.order_id].push(item)
      return acc
    },
    {} as Record<string, OrderItem[]>,
  )

  const { data: allOrdersForStats } = await supabase.from("orders").select("total_price, created_at")

  const totalRevenue = allOrdersForStats?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0
  const todayOrders =
    allOrdersForStats?.filter((order) => {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      return orderDate.toDateString() === today.toDateString()
    }).length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-secondary">
      <div className="border-b-2 border-primary/20 bg-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight">
                GERA COOKS Admin
              </h1>
              <p className="text-base mt-2 font-semibold text-primary-foreground/90 tracking-wide">
                Order Management Dashboard
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/menu">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-bold border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent rounded-xl px-6"
                >
                  Manage Menu
                </Button>
              </Link>
              <Link href="/admin/customers">
                <Button
                  variant="outline"
                  size="lg"
                  className="font-bold border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent rounded-xl px-6"
                >
                  Customers
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button
                  variant="outline"
                  type="submit"
                  size="lg"
                  className="font-bold border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground bg-transparent rounded-xl px-6"
                >
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <Card className="p-8 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-secondary rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground/60 mb-2 tracking-wide">Total Orders</p>
                <p className="font-serif text-5xl font-bold text-foreground tracking-tight">{totalOrders || 0}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-2xl">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-accent rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground/60 mb-2 tracking-wide">Today's Orders</p>
                <p className="font-serif text-5xl font-bold text-foreground tracking-tight">{todayOrders}</p>
              </div>
              <div className="p-4 bg-warning/10 rounded-2xl">
                <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-2 border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-success/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-success/80 mb-2 tracking-wide">Total Revenue</p>
                <p className="font-serif text-5xl font-bold text-success tracking-tight">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-success/10 rounded-2xl">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

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
