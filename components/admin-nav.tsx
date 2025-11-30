"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, UtensilsCrossed, Users, LogOut } from "lucide-react"
import { logoutAction } from "@/app/admin/actions"

interface AdminNavProps {
  title: string
  subtitle: string
}

export function AdminNav({ title, subtitle }: AdminNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: "/admin", label: "Orders", icon: Home },
    { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/admin/customers", label: "Customers", icon: Users },
  ]

  return (
    <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight truncate">{title}</h1>
            <p className="text-sm sm:text-base mt-1 sm:mt-2 font-semibold text-white/90 tracking-wide hidden sm:block">
              {subtitle}
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={`font-bold border-2 rounded-2xl px-6 transition-all ${
                      isActive
                        ? "bg-white text-primary border-white"
                        : "border-white/30 hover:bg-white/20 text-white bg-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            <form action={logoutAction}>
              <Button
                variant="outline"
                type="submit"
                size="lg"
                className="font-bold border-2 border-white/30 hover:bg-white/20 text-white bg-transparent rounded-2xl px-6"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 pb-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={`w-full justify-start font-bold border-2 rounded-xl px-5 py-6 text-base ${
                      isActive
                        ? "bg-white text-primary border-white shadow-md"
                        : "border-white/30 hover:bg-white/20 text-white bg-transparent"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 shrink-0" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
            <form action={logoutAction}>
              <Button
                variant="outline"
                type="submit"
                size="lg"
                className="w-full justify-start font-bold border-2 border-white/30 hover:bg-white/20 text-white bg-transparent rounded-xl px-5 py-6 text-base"
              >
                <LogOut className="w-5 h-5 mr-3 shrink-0" />
                <span>Logout</span>
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
