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
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-background border-b border-elegant">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-playfair-display text-2xl sm:text-3xl font-bold text-foreground">GERA COOKS Admin</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Order Management Dashboard</p>
            </div>
            <form action={logoutAction}>
              <Button variant="outline" type="submit" size="sm" className="border-elegant bg-transparent">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4 sm:mb-6">
          <Card className="p-3 sm:p-4 bg-background border-elegant">
            <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{totalOrders || 0}</p>
          </Card>
          <Card className="p-3 sm:p-4 bg-background border-elegant">
            <p className="text-xs text-muted-foreground mb-1">Today's Orders</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{todayOrders}</p>
          </Card>
          <Card className="p-3 sm:p-4 bg-background border-elegant">
            <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
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
