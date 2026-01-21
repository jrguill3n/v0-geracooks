"use client"

import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

interface Order {
  id: string
  created_at: string
  total_price: number
}

interface OrdersSummaryCardsProps {
  orders: Order[]
  isLoading?: boolean
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatWeekRange(start: Date, end: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`
}

function formatMonth(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getFullYear()}`
}

export function OrdersSummaryCards({ orders, isLoading }: OrdersSummaryCardsProps) {
  const router = useRouter()

  const { weekStats, monthStats, yearStats } = useMemo(() => {
    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekEnd = getWeekEnd(weekStart)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)

    let weekOrders = 0
    let weekRevenue = 0
    let monthOrders = 0
    let monthRevenue = 0
    let yearOrders = 0
    let yearRevenue = 0

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at)
      const amount = Number(order.total_price) || 0

      if (orderDate >= weekStart && orderDate <= weekEnd) {
        weekOrders++
        weekRevenue += amount
      }
      if (orderDate >= monthStart) {
        monthOrders++
        monthRevenue += amount
      }
      if (orderDate >= yearStart) {
        yearOrders++
        yearRevenue += amount
      }
    })

    return {
      weekStats: {
        orders: weekOrders,
        revenue: weekRevenue,
        range: `Monday – Sunday`,
        subtext: formatWeekRange(weekStart, weekEnd),
      },
      monthStats: {
        orders: monthOrders,
        revenue: monthRevenue,
        range: formatMonth(now),
        subtext: "",
      },
      yearStats: {
        orders: yearOrders,
        revenue: yearRevenue,
        range: `${now.getFullYear()} so far`,
        subtext: "",
      },
    }
  }, [orders])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 border-0 shadow-md bg-white rounded-2xl animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </Card>
        ))}
      </div>
    )
  }

  const hasOrders = orders.length > 0

  if (!hasOrders) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {["Week", "Month", "Year"].map((period) => (
          <Card key={period} className="p-4 border-0 shadow-md bg-white rounded-2xl">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-1">Orders by {period}</p>
            <p className="text-sm text-gray-400">No orders yet</p>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    { title: "Orders by Week", ...weekStats, filter: "week" },
    { title: "Orders by Month", ...monthStats, filter: "month" },
    { title: "Orders by Year", ...yearStats, filter: "year" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          onClick={() => router.push(`/admin/analytics?range=${card.filter}`)}
          className="p-4 border-0 shadow-md hover:shadow-lg bg-white rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-0.5">{card.title}</p>
          <p className="text-[10px] text-gray-400 mb-2">
            {card.range}
            {card.subtext && ` · ${card.subtext}`}
          </p>
          <p className="text-3xl font-bold text-foreground leading-none">{card.orders}</p>
          <p className="text-sm font-semibold text-success mt-1">{formatCurrency(card.revenue)}</p>
        </Card>
      ))}
    </div>
  )
}
