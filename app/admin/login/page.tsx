"use client"

import type React from "react"

import { useState } from "react"
import { loginAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function LoginPage() {
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      // Redirect happened, which is expected on success
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-10 bg-white border-0 shadow-2xl rounded-3xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={120} height={120} className="object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">GERA COOKS Admin</h1>
          <p className="text-sm text-muted-foreground font-medium">Sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground font-bold text-sm">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              disabled={isLoading}
              className="bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 h-14 rounded-2xl"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-bold text-sm">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              className="bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 h-14 rounded-2xl"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border-2 border-destructive/30 rounded-2xl px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg rounded-2xl shadow-lg"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
