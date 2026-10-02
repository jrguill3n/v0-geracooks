import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { CustomersManager } from "./customers-manager"
import { AdminNav } from "@/components/admin-nav"

export default async function CustomersPage() {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  // Get all customers with their order count
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*, orders(id, created_at, total_price, status, order_items(quantity, item_name, unit_price, total_price))")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
    return <div className="p-8">Error loading customers</div>
  }

  return (
    <div className="min-h-screen pwa-safe-bottom bg-gradient-to-br from-primary/5 via-white to-secondary/30">
      <AdminNav title="Customer Management" subtitle="Manage customer nicknames and information" />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <CustomersManager customers={customers || []} />
      </div>
    </div>
  )
}
