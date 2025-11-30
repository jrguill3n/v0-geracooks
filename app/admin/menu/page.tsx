import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkAuth } from "@/lib/auth"
import { MenuManager } from "./menu-manager"
import { AdminNav } from "@/components/admin-nav"

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

interface MenuExtra {
  id: string
  item_id: string
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

  const { data: extras, error: extrasError } = await supabase
    .from("menu_item_extras")
    .select("*")
    .order("display_order", { ascending: true })

  if (sectionsError || itemsError || extrasError) {
    console.error("Error fetching menu:", sectionsError || itemsError || extrasError)
    return <div className="p-8">Error loading menu</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30">
      <AdminNav title="Menu Management" subtitle="Add, edit, and organize menu items" />

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        <MenuManager sections={sections || []} items={items || []} extras={extras || []} />
      </div>
    </div>
  )
}
