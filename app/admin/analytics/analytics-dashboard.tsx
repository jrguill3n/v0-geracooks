"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
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

const CHART_COLORS = {
  purple: "#7c3aed", // vibrant purple
  teal: "#14b8a6", // bright teal
  pink: "#ec4899", // pink accent
  orange: "#f97316", // orange accent
  blue: "#3b82f6", // blue accent
  green: "#10b981", // green accent
}

const PIE_COLORS = [
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
  CHART_COLORS.blue,
  CHART_COLORS.green,
]

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      console.log("[v0] Fetching analytics...")
      const response = await fetch("/api/analytics")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ details: "Unknown error" }))
        console.error("[v0] Analytics fetch error:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to fetch analytics")
      }

      const result = await response.json()
      console.log("[v0] Analytics data received:", {
        orders: result.orders?.length,
        historicalSales: result.historicalSales?.length,
        customers: result.customers?.length,
      })
      setData(result)
      setError(null)
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load analytics"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-xl text-red-600">Failed to load analytics data</div>
        <div className="text-sm text-gray-600">{error}</div>
        <button onClick={fetchAnalytics} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-gray-600">No data available</div>
      </div>
    )
  }

  const totalRevenue = (data.orders || []).reduce((sum, order) => sum + (order.total_price || 0), 0)
  const totalOrders = (data.orders || []).length
  const totalCustomers = (data.customers || []).length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const revenueByMonth = [...(data.historicalSales || [])]

  const currentYearOrders = (data.orders || []).filter((order) => {
    const orderDate = new Date(order.created_at)
    return orderDate.getFullYear() === 2025
  })

  const currentMonthRevenue: { [key: number]: number } = {}
  currentYearOrders.forEach((order) => {
    const month = new Date(order.created_at).getMonth() + 1
    currentMonthRevenue[month] = (currentMonthRevenue[month] || 0) + order.total_price
  })

  Object.entries(currentMonthRevenue).forEach(([month, revenue]) => {
    const monthNum = Number.parseInt(month)
    const existingIndex = revenueByMonth.findIndex((r) => r.year === 2025 && r.month === monthNum)
    if (existingIndex >= 0) {
      revenueByMonth[existingIndex].revenue = revenue
    } else {
      revenueByMonth.push({ year: 2025, month: monthNum, revenue })
    }
  })

  const revenueTrendData = revenueByMonth
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    .map((item) => ({
      date: `${MONTH_NAMES[item.month - 1].slice(0, 3)} ${item.year}`,
      revenue: Number(item.revenue),
      year: item.year,
      fullDate: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
    }))

  console.log("[v0] Revenue trend data:", revenueTrendData)

  const itemSales: { [key: string]: { count: number; revenue: number } } = {}
  ;(data.orderItems || []).forEach((item) => {
    const itemName = item.item_name
    if (!itemSales[itemName]) {
      itemSales[itemName] = { count: 0, revenue: 0 }
    }
    itemSales[itemName].count += item.quantity
    itemSales[itemName].revenue += item.quantity * item.price_at_purchase
  })

  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
    }))

  const sectionData: { name: string; value: number }[] = []

  const customerSpending: { [key: string]: { name: string; phone: string; orderCount: number; totalSpent: number } } =
    {}
  ;(data.orders || []).forEach((order) => {
    const customerId = order.customer_id
    if (!customerSpending[customerId]) {
      // Find customer details
      const customer = (data.customers || []).find((c) => c.id === customerId)
      customerSpending[customerId] = {
        name: order.customer_name || customer?.name || "Unknown",
        phone: customer?.phone || "",
        orderCount: 0,
        totalSpent: 0,
      }
    }
    customerSpending[customerId].orderCount++
    customerSpending[customerId].totalSpent += order.total_price
  })

  const topCustomers = Object.values(customerSpending)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)

  const dayOfWeekOrders: { [key: string]: number } = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  }
  ;(data.orders || []).forEach((order) => {
    const dayName = new Date(order.created_at).toLocaleDateString("en-US", { weekday: "long" })
    dayOfWeekOrders[dayName]++
  })

  const dayOfWeekData = Object.entries(dayOfWeekOrders).map(([day, count]) => ({
    day,
    orders: count,
  }))

  const get2024Total = revenueByMonth.filter((r) => r.year === 2024).reduce((sum, r) => sum + r.revenue, 0)

  const get2025Total = revenueByMonth.filter((r) => r.year === 2025).reduce((sum, r) => sum + r.revenue, 0)

  const currentMonth = new Date().getMonth() + 1
  const get2024ToDateTotal = revenueByMonth
    .filter((r) => r.year === 2024 && r.month <= currentMonth)
    .reduce((sum, r) => sum + r.revenue, 0)

  const yoyGrowth =
    get2024ToDateTotal > 0 ? (((get2025Total - get2024ToDateTotal) / get2024ToDateTotal) * 100).toFixed(1) : 0

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              $
              {(
                totalRevenue +
                get2024Total +
                revenueByMonth.filter((r) => r.year === 2023).reduce((s, r) => s + r.revenue, 0)
              ).toFixed(2)}
            </div>
            <p className="text-xs text-purple-700">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-900">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{totalOrders}</div>
            <p className="text-xs text-teal-700">Since tracking started</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-900">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-900">{totalCustomers}</div>
            <p className="text-xs text-pink-700">Unique customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">YoY Growth</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{yoyGrowth}%</div>
            <p className="text-xs text-orange-700">2025 vs 2024</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-100 via-purple-50 to-teal-100 border-b border-purple-200">
          <CardTitle className="text-2xl font-bold text-purple-900">Revenue Trend</CardTitle>
          <CardDescription className="text-purple-700 text-base">Monthly revenue from 2023 to present</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue ($)",
                color: CHART_COLORS.purple,
              },
            }}
            className="h-[350px] sm:h-[450px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={11}
                  stroke="#7c3aed"
                  interval={0}
                />
                <YAxis
                  fontSize={12}
                  stroke="#7c3aed"
                  label={{ value: "Revenue ($)", angle: -90, position: "insideLeft", style: { fill: "#7c3aed" } }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate
                    }
                    return value
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.purple}
                  strokeWidth={3}
                  name="Revenue ($)"
                  dot={{ fill: CHART_COLORS.purple, r: 5, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-purple-50">
            <CardTitle className="text-teal-900">Top Selling Items</CardTitle>
            <CardDescription className="text-teal-700">Best performers by quantity sold</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {topItems.length > 0 ? (
              <ChartContainer
                config={{
                  count: {
                    label: "Quantity",
                    color: CHART_COLORS.teal,
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" />
                    <XAxis type="number" fontSize={12} stroke="#14b8a6" />
                    <YAxis dataKey="name" type="category" width={100} fontSize={12} stroke="#14b8a6" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill={CHART_COLORS.teal} name="Quantity" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">No item data available</div>
            )}
          </CardContent>
        </Card>

        {sectionData.length > 0 && (
          <Card className="border-pink-200">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-orange-50">
              <CardTitle className="text-pink-900">Revenue by Section</CardTitle>
              <CardDescription className="text-pink-700">Sales distribution across menu sections</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  value: {
                    label: "Revenue",
                    color: CHART_COLORS.pink,
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: $${entry.value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-purple-900">Orders by Day of Week</CardTitle>
          <CardDescription className="text-purple-700">Peak ordering days</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer
            config={{
              orders: {
                label: "Orders",
                color: CHART_COLORS.pink,
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="day" fontSize={12} stroke="#ec4899" />
                <YAxis fontSize={12} stroke="#ec4899" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill={CHART_COLORS.pink} name="Orders" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-teal-200">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-purple-50">
          <CardTitle className="text-teal-900">Top Customers</CardTitle>
          <CardDescription className="text-teal-700">Best customers by total spending</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.phone}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-xl border border-purple-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-base text-purple-900">{customer.name}</div>
                    <div className="text-sm text-teal-700">{customer.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-purple-900">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-sm text-teal-700">{customer.orderCount} orders</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
