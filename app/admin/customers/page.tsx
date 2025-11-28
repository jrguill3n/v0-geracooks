import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import Link from "next/link"
import { CustomersManager } from "./customers-manager"

export default async function CustomersPage() {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  // Get all customers with their order count
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*, orders(count)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", error)
    return <div className="p-8">Error loading customers</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-teal-700 bg-gradient-to-r from-teal-500 to-teal-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Customer Management</h1>
              <p className="text-sm mt-1 font-medium text-white/90">Manage customer nicknames and information</p>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="font-semibold border-white/30 hover:bg-white/10 text-white bg-transparent"
              >
                ← Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <CustomersManager customers={customers || []} />
      </div>
    </div>
  )
}
