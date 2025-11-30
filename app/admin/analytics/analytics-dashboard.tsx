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
  total: number
  created_at: string
  status: string
  customer: { name: string; phone: string }
  order_items: Array<{
    quantity: number
    price_at_purchase: number
    menu_item: {
      name: string
      section: { name: string }
    }
  }>
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
  orders: Array<{ id: string; total: number; created_at: string }>
}

interface AnalyticsData {
  orders: Order[]
  historicalSales: HistoricalSale[]
  customers: Customer[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

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

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error)
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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-xl text-red-600">Failed to load analytics data</div>
      </div>
    )
  }

  // Calculate metrics
  const totalRevenue = data.orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = data.orders.length
  const totalCustomers = data.customers.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Combine historical and current data for revenue trend
  const revenueByMonth = [...data.historicalSales]

  // Add current year data from orders
  const currentYearOrders = data.orders.filter((order) => {
    const orderDate = new Date(order.created_at)
    return orderDate.getFullYear() === 2025
  })

  const currentMonthRevenue: { [key: number]: number } = {}
  currentYearOrders.forEach((order) => {
    const month = new Date(order.created_at).getMonth() + 1
    currentMonthRevenue[month] = (currentMonthRevenue[month] || 0) + order.total
  })

  // Update 2025 data with real orders
  Object.entries(currentMonthRevenue).forEach(([month, revenue]) => {
    const monthNum = Number.parseInt(month)
    const existingIndex = revenueByMonth.findIndex((r) => r.year === 2025 && r.month === monthNum)
    if (existingIndex >= 0) {
      revenueByMonth[existingIndex].revenue = revenue
    } else {
      revenueByMonth.push({ year: 2025, month: monthNum, revenue })
    }
  })

  // Format revenue trend data for chart
  const revenueTrendData = revenueByMonth.map((item) => ({
    date: `${MONTH_NAMES[item.month - 1]} ${item.year}`,
    revenue: item.revenue,
    year: item.year,
  }))

  // Top selling items
  const itemSales: { [key: string]: { count: number; revenue: number } } = {}
  data.orders.forEach((order) => {
    order.order_items.forEach((item) => {
      const itemName = item.menu_item.name
      if (!itemSales[itemName]) {
        itemSales[itemName] = { count: 0, revenue: 0 }
      }
      itemSales[itemName].count += item.quantity
      itemSales[itemName].revenue += item.quantity * item.price_at_purchase
    })
  })

  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
    }))

  // Revenue by section
  const sectionRevenue: { [key: string]: number } = {}
  data.orders.forEach((order) => {
    order.order_items.forEach((item) => {
      const sectionName = item.menu_item.section.name
      sectionRevenue[sectionName] = (sectionRevenue[sectionName] || 0) + item.quantity * item.price_at_purchase
    })
  })

  const sectionData = Object.entries(sectionRevenue).map(([name, value]) => ({
    name,
    value,
  }))

  // Top customers
  const topCustomers = data.customers
    .map((customer) => ({
      name: customer.name,
      phone: customer.phone,
      orderCount: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)

  // Orders by day of week
  const dayOfWeekOrders: { [key: string]: number } = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  }

  data.orders.forEach((order) => {
    const dayName = new Date(order.created_at).toLocaleDateString("en-US", { weekday: "long" })
    dayOfWeekOrders[dayName]++
  })

  const dayOfWeekData = Object.entries(dayOfWeekOrders).map(([day, count]) => ({
    day,
    orders: count,
  }))

  // Calculate year-over-year growth
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                totalRevenue +
                get2024Total +
                revenueByMonth.filter((r) => r.year === 2023).reduce((s, r) => s + r.revenue, 0)
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Since tracking started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yoyGrowth}%</div>
            <p className="text-xs text-muted-foreground">2025 vs 2024</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue from 2023 to present</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: {
                label: "Revenue",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px] sm:h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Items and Section Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Best performers by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Quantity",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItems} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Section</CardTitle>
            <CardDescription>Sales distribution across menu sections</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Revenue",
                  color: "hsl(var(--chart-3))",
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Day of Week */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Day of Week</CardTitle>
          <CardDescription>Peak ordering days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              orders: {
                label: "Orders",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>Best customers by total spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={customer.phone} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-base">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">${customer.totalSpent.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{customer.orderCount} orders</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
