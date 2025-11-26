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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/10 via-card to-accent shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                GERA COOKS Admin
              </h1>
              <p className="text-sm mt-1 font-medium text-primary/70">Order Management Dashboard</p>
            </div>
            <form action={logoutAction}>
              <Button
                variant="outline"
                type="submit"
                size="sm"
                className="font-semibold border-primary/30 hover:bg-primary/10 bg-transparent"
              >
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-5 border-2 border-primary/30 shadow-md hover:shadow-lg transition-all hover:border-primary/50 bg-gradient-to-br from-card to-primary/5">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Total Orders</p>
            <p className="text-3xl font-display font-bold text-primary">{totalOrders || 0}</p>
          </Card>
          <Card className="p-5 border-2 border-warning/30 shadow-md hover:shadow-lg transition-all hover:border-warning/50 bg-gradient-to-br from-card to-warning/5">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Today's Orders</p>
            <p className="text-3xl font-display font-bold text-warning">{todayOrders}</p>
          </Card>
          <Card className="p-5 border-2 border-success/30 shadow-md hover:shadow-lg transition-all hover:border-success/50 bg-gradient-to-br from-card to-success/5">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-3xl font-display font-bold text-success">${totalRevenue.toFixed(2)}</p>
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
