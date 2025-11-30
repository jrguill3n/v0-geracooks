import { AdminNav } from "@/components/admin-nav"
import { AnalyticsDashboard } from "./analytics-dashboard"

export const dynamic = "force-dynamic"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNav title="Analytics" subtitle="Business Insights & Trends" />
      <AnalyticsDashboard />
    </div>
  )
}
