import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import Link from "next/link"
import { MenuManager } from "./menu-manager"

interface MenuSection {
  id: string
  name: string
  display_order: number
}

interface MenuItem {
  id: string
  section_id: string
  name: string
  price: number
  display_order: number
}

export default async function MenuPage() {
  const isAuthenticated = await checkAuth()

  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  const supabase = await createClient()

  const { data: sections, error: sectionsError } = await supabase
    .from("menu_sections")
    .select("*")
    .order("display_order", { ascending: true })

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .order("display_order", { ascending: true })

  if (sectionsError || itemsError) {
    console.error("Error fetching menu:", sectionsError || itemsError)
    return <div className="p-8">Error loading menu</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-teal-700 bg-gradient-to-r from-teal-500 to-teal-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Menu Management</h1>
              <p className="text-sm mt-1 font-medium text-white/90">Add, edit, and organize menu items</p>
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
        <MenuManager sections={sections || []} items={items || []} />
      </div>
    </div>
  )
}
