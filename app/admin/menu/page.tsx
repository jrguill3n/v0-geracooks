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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30">
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Menu Management</h1>
              <p className="text-base mt-2 font-semibold text-white/90 tracking-wide">
                Add, edit, and organize menu items
              </p>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                size="lg"
                className="font-bold border-2 border-white/30 hover:bg-white/20 text-white bg-transparent rounded-2xl px-6"
              >
                ← Back to Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <MenuManager sections={sections || []} items={items || []} />
      </div>
    </div>
  )
}
