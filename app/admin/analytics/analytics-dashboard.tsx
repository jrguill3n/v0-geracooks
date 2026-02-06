"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"

interface Order {
  id: string
  total_price: number
  created_at: string
  status: string
  customer_name: string
  customer_id: string
}

interface OrderItem {
  id: string
  order_id: string
  item_name: string
  quantity: number
  price_at_purchase: number
  created_at: string
}

interface HistoricalSale {
  year: number
  month: number
  revenue: number
}

interface Customer {
  id: string
  name: string
  phone: string
  created_at: string
}

interface AnalyticsData {
  orders: Order[]
  orderItems: OrderItem[]
  historicalSales: HistoricalSale[]
  customers: Customer[]
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const COLORS = {
  primary: "#7c3aed",
  teal: "#14b8a6",
  pink: "#ec4899",
  orange: "#f97316",
}

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400 text-sm">
      {message}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

type RangeDays = 30 | 90 | null

const RANGE_OPTIONS: { label: string; value: RangeDays }[] = [
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "All time", value: null },
]

function RangeFilter({ value, onChange }: { value: RangeDays; onChange: (v: RangeDays) => void }) {
  return (
    <div className="flex w-full sm:w-auto bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
            value === opt.value
              ? "bg-purple-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rangeDays, setRangeDays] = useState<RangeDays>(null)
  const [customerSort, setCustomerSort] = useState<"spent" | "orders">("spent")

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ details: "Unknown error" }))
        throw new Error(errorData.details || errorData.error || "Failed to fetch analytics")
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load analytics"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Compute all chart data
  const computed = useMemo(() => {
    if (!data) return null

    const allOrders = data.orders || []
    const allOrderItems = data.orderItems || []
    const historicalSales = data.historicalSales || []
    const customers = data.customers || []

    // Apply date range filter
    let cutoffDate: Date | null = null
    if (rangeDays !== null) {
      cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - rangeDays)
      cutoffDate.setHours(0, 0, 0, 0)
    }

    const orders = cutoffDate
      ? allOrders.filter((o) => new Date(o.created_at) >= cutoffDate!)
      : allOrders

    const filteredOrderIds = new Set(orders.map((o) => o.id))
    const orderItems = cutoffDate
      ? allOrderItems.filter((item) => filteredOrderIds.has(item.order_id))
      : allOrderItems

    // KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0)
    const totalOrders = orders.length
    const totalCustomers = customers.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Revenue trend: merge historical + current orders by YYYY-MM
    const revenueMap = new Map<string, number>()

    // Filter historical sales by range too
    const filteredHistorical = cutoffDate
      ? historicalSales.filter((h) => {
          const historicalDate = new Date(h.year, h.month - 1, 1)
          return historicalDate >= cutoffDate!
        })
      : historicalSales

    filteredHistorical.forEach((h) => {
      const key = `${h.year}-${String(h.month).padStart(2, "0")}`
      revenueMap.set(key, (revenueMap.get(key) || 0) + Number(h.revenue))
    })

    orders.forEach((o) => {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      revenueMap.set(key, (revenueMap.get(key) || 0) + o.total_price)
    })

    const revenueTrend = Array.from(revenueMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, revenue]) => {
        const [yr, mo] = key.split("-")
        return {
          label: `${MONTH_NAMES[parseInt(mo) - 1]} ${yr}`,
          revenue,
        }
      })

    // Top selling items (by quantity, top 5)
    const itemMap = new Map<string, number>()
    orderItems.forEach((item) => {
      itemMap.set(item.item_name, (itemMap.get(item.item_name) || 0) + item.quantity)
    })
    const topItems = Array.from(itemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }))

    // Orders by day of week
    const dayMap = new Map<string, number>()
    DAY_NAMES.forEach((d) => dayMap.set(d, 0))
    orders.forEach((o) => {
      const dayName = new Date(o.created_at).toLocaleDateString("en-US", { weekday: "long" })
      dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1)
    })
    const ordersByDay = DAY_NAMES.map((day) => ({
      day: day.slice(0, 3),
      orders: dayMap.get(day) || 0,
    }))

    // Top customers
    const customerMap = new Map<string, { name: string; phone: string; orderCount: number; totalSpent: number }>()
    orders.forEach((o) => {
      const existing = customerMap.get(o.customer_id)
      if (existing) {
        existing.orderCount++
        existing.totalSpent += o.total_price
      } else {
        const customer = customers.find((c) => c.id === o.customer_id)
        customerMap.set(o.customer_id, {
          name: o.customer_name || customer?.name || "Unknown",
          phone: customer?.phone || "",
          orderCount: 1,
          totalSpent: o.total_price,
        })
      }
    })
    const allCustomersBySpent = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount)
      .slice(0, 10)

    const allCustomersByOrders = Array.from(customerMap.values())
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent)
      .slice(0, 10)

    // YoY growth
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const thisYearRevenue = Array.from(revenueMap.entries())
      .filter(([k]) => k.startsWith(`${currentYear}-`))
      .reduce((s, [, v]) => s + v, 0)
    const lastYearToDateRevenue = Array.from(revenueMap.entries())
      .filter(([k]) => {
        if (!k.startsWith(`${currentYear - 1}-`)) return false
        const mo = parseInt(k.split("-")[1])
        return mo <= currentMonth
      })
      .reduce((s, [, v]) => s + v, 0)
    const yoyGrowth = lastYearToDateRevenue > 0
      ? (((thisYearRevenue - lastYearToDateRevenue) / lastYearToDateRevenue) * 100).toFixed(1)
      : "N/A"

    // All-time revenue
    const allTimeRevenue = Array.from(revenueMap.values()).reduce((s, v) => s + v, 0)

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      allTimeRevenue,
      yoyGrowth,
      revenueTrend,
      topItems,
      ordersByDay,
      allCustomersBySpent,
      allCustomersByOrders,
    }
  }, [data, rangeDays])

  if (loading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-xl text-red-600">Failed to load analytics data</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Retry
        </button>
      </div>
    )
  }

  if (!data || !computed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">No data available</div>
      </div>
    )
  }

  const hasOrders = computed.totalOrders > 0

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Date range filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        <RangeFilter value={rangeDays} onChange={setRangeDays} />
      </div>

      {/* Empty state for filtered range */}
      {!hasOrders && rangeDays !== null && (
        <Card className="border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingCart className="h-10 w-10 text-gray-300" />
            <p className="text-gray-500 font-medium">No orders in the last {rangeDays} days</p>
            <button
              onClick={() => setRangeDays(null)}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              View all time instead
            </button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatUSD(computed.totalRevenue)}</div>
            <p className="text-xs text-purple-700">{rangeDays ? `Last ${rangeDays} days` : "All time"}</p>
          </CardContent>
        </Card>

        <Card className="bg-teal-50 border-teal-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-900">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{computed.totalOrders}</div>
            <p className="text-xs text-teal-700">{rangeDays ? `Last ${rangeDays} days` : "Since tracking started"}</p>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 border-pink-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900">{computed.totalCustomers}</div>
            <p className="text-xs text-pink-700">Unique customers</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">YoY Growth</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {computed.yoyGrowth === "N/A" ? "N/A" : `${computed.yoyGrowth}%`}
            </div>
            <p className="text-xs text-orange-700">{new Date().getFullYear()} vs {new Date().getFullYear() - 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend - full width */}
      <Card className="border-purple-200 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-purple-900">Revenue Trend</CardTitle>
          <CardDescription className="text-purple-700">Monthly revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          {computed.revenueTrend.length > 0 ? (
            <div className="w-full h-[300px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={computed.revenueTrend} margin={{ top: 5, right: 10, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                  <XAxis
                    dataKey="label"
                    angle={-45}
                    textAnchor="end"
                    fontSize={11}
                    tick={{ fill: "#7c3aed" }}
                    interval="preserveStartEnd"
                    height={60}
                  />
                  <YAxis
                    fontSize={11}
                    tick={{ fill: "#7c3aed" }}
                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatUSD(value), "Revenue"]}
                    labelStyle={{ color: "#7c3aed", fontWeight: 600 }}
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e9d5ff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    dot={{ fill: COLORS.primary, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No data yet" />
          )}
        </CardContent>
      </Card>

      {/* Two-column grid: Top Items + Orders by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items - horizontal bar chart */}
        <Card className="border-teal-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-teal-900">Top Selling Items</CardTitle>
            <CardDescription className="text-teal-700">Best performers by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.topItems.length > 0 ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.topItems} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" horizontal={false} />
                    <XAxis type="number" fontSize={11} tick={{ fill: "#14b8a6" }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={11}
                      tick={{ fill: "#14b8a6" }}
                      width={90}
                      tickFormatter={(v: string) => v.length > 14 ? `${v.slice(0, 12)}...` : v}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, "Qty Sold"]}
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid #ccfbf1" }}
                    />
                    <Bar dataKey="quantity" fill={COLORS.teal} name="Quantity" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty message="No data yet" />
            )}
          </CardContent>
        </Card>

        {/* Orders by Day of Week - vertical bar chart */}
        <Card className="border-pink-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-pink-900">Orders by Day of Week</CardTitle>
            <CardDescription className="text-pink-700">Peak ordering days</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.ordersByDay.some((d) => d.orders > 0) ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={computed.ordersByDay} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                    <XAxis dataKey="day" fontSize={11} tick={{ fill: "#ec4899" }} />
                    <YAxis fontSize={11} tick={{ fill: "#ec4899" }} allowDecimals={false} width={30} />
                    <Tooltip
                      formatter={(value: number) => [value, "Orders"]}
                      contentStyle={{ borderRadius: "0.75rem", border: "1px solid #fce7f3" }}
                    />
                    <Bar dataKey="orders" fill={COLORS.pink} name="Orders" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty message="No data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      {(() => {
        const topCustomers = customerSort === "spent"
          ? computed.allCustomersBySpent
          : computed.allCustomersByOrders

        return (
          <Card className="border-teal-200 rounded-2xl shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-teal-900">Top Customers</CardTitle>
                <CardDescription className="text-teal-700">
                  {customerSort === "spent" ? "Ranked by total spent" : "Ranked by order count"}
                </CardDescription>
              </div>
              <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start sm:self-auto">
                <button
                  onClick={() => setCustomerSort("spent")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    customerSort === "spent"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Total spent
                </button>
                <button
                  onClick={() => setCustomerSort("orders")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    customerSort === "orders"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Orders
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <div className="space-y-2">
                  {topCustomers.map((customer, index) => (
                    <div
                      key={`${customer.phone}-${index}`}
                      className="flex items-start gap-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100"
                    >
                      <div className="w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Mobile: 2-line layout. Desktop: single row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-purple-900 truncate">{customer.name}</span>
                          <span className="font-bold text-sm text-purple-900 shrink-0 tabular-nums">
                            {customerSort === "spent"
                              ? formatUSD(customer.totalSpent)
                              : `${customer.orderCount} ${customer.orderCount === 1 ? "order" : "orders"}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 truncate">{customer.phone || "No phone"}</span>
                          <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                            {customerSort === "spent"
                              ? `${customer.orderCount} ${customer.orderCount === 1 ? "order" : "orders"}`
                              : formatUSD(customer.totalSpent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ChartEmpty message="No data yet" />
              )}
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
