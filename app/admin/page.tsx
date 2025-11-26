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

export default async function AdminPage() {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  // Fetch all orders with their items
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
    return <div className="p-8">Error loading orders</div>
  }

  // Fetch all order items
  const { data: allItems, error: itemsError } = await supabase.from("order_items").select("*")

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

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0
  const todayOrders =
    orders?.filter((order) => {
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
            <p className="text-xl sm:text-2xl font-bold text-foreground">{orders?.length || 0}</p>
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
        <OrdersList orders={orders || []} itemsByOrder={itemsByOrder} />
      </div>
    </div>
  )
}
