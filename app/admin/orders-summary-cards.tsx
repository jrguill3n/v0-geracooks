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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="px-3 py-2.5 border-0 shadow-sm bg-white rounded-xl animate-pulse h-[88px]">
            <div className="flex items-center justify-between mb-2">
              <div className="h-2.5 bg-gray-200 rounded w-20" />
              <div className="h-2 bg-gray-100 rounded w-16" />
            </div>
            <div className="flex items-baseline gap-3">
              <div className="h-6 bg-gray-200 rounded w-10" />
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const hasOrders = orders.length > 0

  if (!hasOrders) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        {["Week", "Month", "Year"].map((period) => (
          <Card key={period} className="px-3 py-2.5 border-0 shadow-sm bg-white rounded-xl h-[88px]">
            <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">Orders by {period}</p>
            <p className="text-xs text-gray-400 mt-1">No orders yet</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
      {cards.map((card) => (
        <Card
          key={card.title}
          onClick={() => router.push(`/admin/analytics?range=${card.filter}`)}
          className="px-3 py-2.5 border-0 shadow-sm hover:shadow-md bg-white rounded-xl cursor-pointer transition-all duration-150 hover:bg-gray-50/80 active:scale-[0.98] h-[88px] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">{card.title}</p>
            <p className="text-[10px] text-gray-400">
              {card.subtext || card.range}
            </p>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-2xl font-bold text-foreground leading-none">{card.orders}</p>
            <p className="text-sm font-medium text-success">{formatCurrency(card.revenue)}</p>
          </div>
          <p className="text-[10px] text-gray-400 hover:text-primary transition-colors">View details →</p>
        </Card>
      ))}
    </div>
  )
}
