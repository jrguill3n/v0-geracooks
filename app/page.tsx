import { createClient } from "@/lib/supabase/server"
import { OrderPageClient } from "./order-page-client"

export default async function OrderPage() {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from("menu_sections")
    .select("*")
    .order("display_order", { ascending: true })

  const { data: items } = await supabase.from("menu_items").select("*").order("display_order", { ascending: true })

  const { data: extras } = await supabase
    .from("menu_item_extras")
    .select("*")
    .order("display_order", { ascending: true })

  const menuItems: Record<
    string,
    Array<{
      id: string
      name: string
      price: number
      description?: string
      extras?: Array<{ id: string; name: string; price: number }>
    }>
  > = {}

  sections?.forEach((section) => {
    menuItems[section.name] =
      items
        ?.filter((item) => item.section_id === section.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          description: item.description || undefined,
          extras:
            extras
              ?.filter((extra) => extra.menu_item_id === item.id)
              .map((extra) => ({
                id: extra.id,
                name: extra.name,
                price: Number(extra.price),
              })) || [],
        })) || []
  })

  return <OrderPageClient menuItems={menuItems} />
}
