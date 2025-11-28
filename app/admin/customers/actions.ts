"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateCustomerNickname(customerId: string, nickname: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("customers")
    .update({
      nickname: nickname.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)

  if (error) {
    console.error("[v0] Error updating customer nickname:", error)
    throw new Error("Failed to update customer nickname")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/customers")
}
