"use server"

import { redirect } from "next/navigation"
import { validateCredentials, setAuthCookie } from "@/lib/auth"

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  const isValid = await validateCredentials(username, password)

  if (isValid) {
    await setAuthCookie()
    redirect("/admin")
  }

  return { error: "Invalid username or password" }
}
