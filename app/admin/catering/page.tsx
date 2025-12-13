import { createClient } from "@/lib/supabase/server"
import { AdminNav } from "@/components/admin-nav"
import { CateringList } from "./catering-list"

export default async function CateringPage() {
  const supabase = await createClient()

  const { data: quotes, error } = await supabase
    .from("catering_quotes")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching quotes:", error)
  }

  return (
    <>
      <AdminNav title="Catering" subtitle="Custom quotes for special events" />
      <CateringList initialQuotes={quotes || []} />
    </>
  )
}
