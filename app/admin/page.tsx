import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { logoutAction } from "./actions"
import { OrdersList } from "./orders-list"

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
  order_id: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; status?: string }>
}) {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const params = await searchParams
  const currentPage = Number.parseInt(params.page || "1")
  const pageSize = Number.parseInt(params.pageSize || "20")
  const statusFilter = params.status || ""

  const supabase = await createClient()

  let countQuery = supabase.from("orders").select("*", { count: "exact", head: true })

  if (statusFilter) {
    countQuery = countQuery.eq("status", statusFilter)
  }

  const { count: totalOrders } = await countQuery

  let ordersQuery = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (statusFilter) {
    ordersQuery = ordersQuery.eq("status", statusFilter)
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

  // Group items by order_id
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
    <div className="min-h-screen bg-gray-50">
      <div className="border-b-2 border-purple-300 bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-purple-700 tracking-tight">
                GERA COOKS Admin
              </h1>
              <p className="text-sm mt-1 font-medium text-purple-600">Order Management Dashboard</p>
            </div>
            <form action={logoutAction}>
              <Button
                variant="outline"
                type="submit"
                size="sm"
                className="font-semibold border-purple-400 hover:bg-purple-50 bg-transparent text-purple-700"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Orders - Blue Gradient */}
          <Card className="p-5 border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-400 to-blue-500 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-1">Total Orders</p>
                  <p className="text-4xl font-display font-bold text-white">{totalOrders || 0}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          {/* Today's Orders - Coral/Pink Gradient */}
          <Card className="p-5 border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-300 via-coral-400 to-pink-400 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-1">Today's Orders</p>
                  <p className="text-4xl font-display font-bold text-white">{todayOrders}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          {/* Total Revenue - Turquoise Gradient */}
          <Card className="p-5 border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-teal-400 to-cyan-500 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white/90 mb-1">Total Revenue</p>
                  <p className="text-4xl font-display font-bold text-white">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Orders List */}
        <OrdersList
          orders={orders || []}
          itemsByOrder={itemsByOrder}
          totalOrders={totalOrders || 0}
          currentPage={currentPage}
          pageSize={pageSize}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  )
}
