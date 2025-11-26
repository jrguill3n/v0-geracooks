import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

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

export default async function AdminPage() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="font-playfair-display text-4xl font-bold text-foreground">GERA COOKS Admin</h1>
          <p className="text-sm text-muted-foreground mt-2">Order Management Dashboard</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-background border-elegant">
            <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-foreground">{orders?.length || 0}</p>
          </Card>
          <Card className="p-6 bg-background border-elegant">
            <p className="text-sm text-muted-foreground mb-1">Today's Orders</p>
            <p className="text-3xl font-bold text-foreground">{todayOrders}</p>
          </Card>
          <Card className="p-6 bg-background border-elegant">
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-foreground">Recent Orders</h2>

          {!orders || orders.length === 0 ? (
            <Card className="p-8 text-center bg-background border-elegant">
              <p className="text-muted-foreground">No orders yet</p>
            </Card>
          ) : (
            orders.map((order: Order) => {
              const items = itemsByOrder[order.id] || []
              return (
                <Card key={order.id} className="p-6 bg-background border-elegant">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-xl text-foreground">{order.customer_name}</h3>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-2xl font-serif text-foreground">${Number(order.total_price).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-elegant pt-4 mt-4">
                    <p className="text-sm font-medium text-foreground mb-3">Order Items:</p>
                    <div className="space-y-2">
                      {items.map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-muted-foreground">${Number(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
