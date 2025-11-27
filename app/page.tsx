import { createClient } from "@/lib/supabase/server"
import { OrderPageClient } from "./order-page-client"

export default async function OrderPage() {
  const supabase = await createClient()

  // Fetch menu sections and items from database
  const { data: sections } = await supabase
    .from("menu_sections")
    .select("*")
    .order("display_order", { ascending: true })

  const { data: items } = await supabase.from("menu_items").select("*").order("display_order", { ascending: true })

  // Transform data into the format expected by the client component
  const menuItems: Record<string, Array<{ name: string; price: number }>> = {}

  sections?.forEach((section) => {
    menuItems[section.name] =
      items
        ?.filter((item) => item.section_id === section.id)
        .map((item) => ({
          name: item.name,
          price: Number(item.price),
        })) || []
  })

  return <OrderPageClient menuItems={menuItems} />
}
