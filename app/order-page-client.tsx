"use client"

import type React from "react"
import Image from "next/image"
import { InfoTooltip } from "@/components/info-tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react"
import { PhoneInput } from "@/components/phone-input"

interface MenuItem {
  id: string
  name: string
  price: number
  description?: string
  extras?: Array<{ id: string; name: string; price: number }>
}

interface OrderPageClientProps {
  menuItems: Record<string, MenuItem[]>
}

interface OrderItem {
  itemName: string
  quantity: number
  extras: string[]
}

interface Customer {
  name: string
  country_code: string
  phone_number: string
}

export function OrderPageClient({ menuItems }: OrderPageClientProps) {
  const [customerName, setCustomerName] = useState("")
  const [countryCode, setCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<MenuItem | null>(null)
  const [tempExtras, setTempExtras] = useState<string[]>([])
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const categories = useMemo(() => Object.keys(menuItems), [menuItems])
  const [activeCategory, setActiveCategory] = useState<string>(() => categories[0] || "")
  const [menuSearchQuery, setMenuSearchQuery] = useState("")
  const filteredMenuItems = useMemo(() => {
    const query = menuSearchQuery.trim().toLocaleLowerCase()
    return Object.fromEntries(
      Object.entries(menuItems).map(([category, items]) => [
        category,
        items.filter((item) => {
          const searchableText = [
            category,
            item.name,
            item.description || "",
            ...(item.extras || []).map((extra) => extra.name),
          ].join(" ").toLocaleLowerCase()
          return !query || searchableText.includes(query)
        }),
      ]),
    ) as Record<string, MenuItem[]>
  }, [menuItems, menuSearchQuery])
  const visibleCategories = useMemo(
    () => categories.filter((category) => filteredMenuItems[category]?.length > 0),
    [categories, filteredMenuItems],
  )
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryNavRef = useRef<HTMLDivElement | null>(null)
  const programmaticScrollRef = useRef<{ category: string; timeoutId: ReturnType<typeof setTimeout> } | null>(null)

  useEffect(() => {
    if (!visibleCategories.length) return
    setActiveCategory((current) =>
      visibleCategories.includes(current) ? current : visibleCategories[0],
    )
  }, [visibleCategories])

  const getCategoryId = (category: string) =>
    `category-${category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`

  // Lock body scroll when cart sheet is open
  useEffect(() => {
    if (isCartSheetOpen) {
      const originalOverflow = document.body.style.overflow
      const originalPosition = document.body.style.position
      const originalWidth = document.body.style.width
      const scrollY = window.scrollY
      
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollY}px`
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.position = originalPosition
        document.body.style.width = originalWidth
        document.body.style.top = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isCartSheetOpen])

  // Scroll spy only observes sections. Updating the active pill never scrolls the page.
  useEffect(() => {
    if (!visibleCategories.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (!visibleEntries.length) return

        const visibleCategory = visibleEntries[0].target.getAttribute("data-category")
        if (!visibleCategory) return

        const programmaticScroll = programmaticScrollRef.current
        if (programmaticScroll) {
          if (visibleCategory === programmaticScroll.category) {
            clearTimeout(programmaticScroll.timeoutId)
            programmaticScrollRef.current = null
          } else {
            return
          }
        }

        setActiveCategory((current) => (current === visibleCategory ? current : visibleCategory))
      },
      // The sticky search and category controls occupy roughly the top 116px.
      // Shrink the observer's visible region so the section under them is not selected.
      { rootMargin: "-116px 0px -45% 0px", threshold: [0.1, 0.25, 0.5] },
    )

    visibleCategories.forEach((category) => {
      const section = sectionRefs.current[category]
      if (section) observer.observe(section)
    })

    return () => {
      observer.disconnect()
      if (programmaticScrollRef.current) {
        clearTimeout(programmaticScrollRef.current.timeoutId)
        programmaticScrollRef.current = null
      }
    }
  }, [visibleCategories])

  useEffect(() => {
    if (customerName.length >= 2 || phoneNumber.length >= 3) {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }

      suggestionTimeoutRef.current = setTimeout(async () => {
        try {
          const query = customerName || phoneNumber
          const response = await fetch(`/api/customer-suggestions?query=${encodeURIComponent(query)}`)
          const data = await response.json()

          if (data.customers && data.customers.length > 0) {
            setCustomerSuggestions(data.customers)
            setShowSuggestions(true)
          } else {
            setCustomerSuggestions([])
            setShowSuggestions(false)
          }
        } catch (error) {
          console.error("[v0] Error fetching suggestions:", error)
        }
      }, 300)
    } else {
      setCustomerSuggestions([])
      setShowSuggestions(false)
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [customerName, phoneNumber])

  const selectSuggestion = (customer: Customer) => {
    setCustomerName(customer.name)
    setCountryCode(customer.country_code)
    setPhoneNumber(customer.phone_number)
    setShowSuggestions(false)
    setCustomerSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || customerSuggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev < customerSuggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : customerSuggestions.length - 1))
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      selectSuggestion(customerSuggestions[selectedSuggestionIndex])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const scrollToSection = (category: string) => {
    const section = sectionRefs.current[category]
    if (!section) return

    if (programmaticScrollRef.current) {
      clearTimeout(programmaticScrollRef.current.timeoutId)
    }

    setActiveCategory(category)
    const timeoutId = setTimeout(() => {
      programmaticScrollRef.current = null
    }, 1200)
    programmaticScrollRef.current = { category, timeoutId }

    // scroll-margin-top accounts for the sticky category bar. This moves the
    // document only for an explicit pill click, never as a result of the spy.
    section.scrollIntoView({ behavior: "smooth", block: "start" })

    // Keep only the horizontal pill strip in view; block: nearest avoids
    // accidentally scrolling the document while centering the active pill.
    const button = categoryNavRef.current?.querySelector<HTMLButtonElement>(
      `[data-category="${CSS.escape(category)}"]`,
    )
    if (button && categoryNavRef.current) {
      const container = categoryNavRef.current
      const targetLeft = button.offsetLeft - (container.clientWidth - button.offsetWidth) / 2
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" })
    }
  }

  const getOrderLineKey = (itemName: string, extras: string[]) =>
    `${encodeURIComponent(itemName)}::${[...extras].sort().join(",")}`

  const getItemOrderLines = (itemName: string) =>
    Object.entries(orderItems).filter(([, orderItem]) => orderItem.itemName === itemName)

  const handleAddItem = (item: MenuItem) => {
    if (item.extras && item.extras.length > 0) {
      setSelectedItemForExtras(item)
      setTempExtras([])
    } else {
      updateQuantity(item.name, 1, [])
    }
  }

  const removeOrderLine = (lineKey: string) => {
    setOrderItems((prev) => {
      const next = { ...prev }
      delete next[lineKey]
      return next
    })
  }

  const updateQuantity = (itemName: string, change: number, extras?: string[]) => {
    setOrderItems((prev) => {
      const matchingLines = Object.entries(prev).filter(([, line]) => line.itemName === itemName)
      const targetKey = extras !== undefined
        ? getOrderLineKey(itemName, extras)
        : matchingLines[0]?.[0]

      if (!targetKey) return prev
      const currentItem = prev[targetKey]
      const newQuantity = (currentItem?.quantity || 0) + change

      if (newQuantity <= 0) {
        const { [targetKey]: _, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [targetKey]: {
          itemName,
          quantity: newQuantity,
          extras: extras ?? currentItem?.extras ?? [],
        },
      }
    })
  }

  const confirmExtras = () => {
    if (selectedItemForExtras) {
      updateQuantity(selectedItemForExtras.name, 1, tempExtras)
      setSelectedItemForExtras(null)
      setTempExtras([])
    }
  }

  const getTotalItems = () =>
    Object.values(orderItems).reduce((sum, item) => sum + item.quantity, 0)

  const getCategoryItemCount = (category: string) => {
    const items = menuItems[category]
    if (!items) return 0
    return items.reduce((sum, item) => {
      return sum + getItemOrderLines(item.name).reduce((count, [, line]) => count + line.quantity, 0)
    }, 0)
  }

  const getTotalPrice = () => {
    let total = 0
    Object.values(orderItems).forEach((orderItem) => {
      const item = Object.values(menuItems).flat().find((menuItem) => menuItem.name === orderItem.itemName)
      if (item) {
        const extrasPrice = orderItem.extras.reduce((sum, extraId) => {
          return sum + (item.extras?.find((extra) => extra.id === extraId)?.price || 0)
        }, 0)
        total += (item.price + extrasPrice) * orderItem.quantity
      }
    })
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !phoneNumber || getTotalItems() === 0) {
      alert("Please fill in your name, phone number, and select at least one item")
      return
    }

    setSubmitStatus("submitting")

    try {
      const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "")

      const orderData = {
        customerName,
        phone: countryCode + cleanedPhoneNumber,
        orderItems,
        totalPrice: getTotalPrice(),
      }

      console.log("[v0] Submitting order:", orderData)

      const response = await fetch("/api/save-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const responseData = await response.json()
      console.log("[v0] Order response:", responseData)

      if (!response.ok) {
        throw new Error(`Failed to save order: ${JSON.stringify(responseData)}`)
      }

      setOrderSubmitted(true)
      setSubmitStatus("success")
    } catch (error) {
      console.error("[v0] Error submitting order:", error)
      alert(`There was an error saving your order: ${error}. Please try again.`)
      setSubmitStatus("error")
    }
  }

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center bg-white border-0 shadow-2xl rounded-3xl">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl mb-4 text-foreground font-bold">Thank You!</h1>
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-base leading-relaxed">
                Thank you for submitting your order, we will get in contact for your delivery.
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setOrderSubmitted(false)
              setCustomerName("")
              setCountryCode("+1")
              setPhoneNumber("")
              setOrderItems({})
              setSubmitStatus("idle")
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl shadow-lg"
          >
            Place Another Order
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-6 py-0">
          <div className="flex flex-col items-center text-center">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={220} height={220} className="object-contain" />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          <div className="relative mb-3" role="search">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={menuSearchQuery}
              onChange={(event) => setMenuSearchQuery(event.target.value)}
              placeholder="Search dishes or ingredients"
              aria-label="Search menu"
              className="h-11 rounded-2xl border-gray-200 bg-gray-50 pl-10 pr-10 text-base focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20"
            />
            {menuSearchQuery && (
              <button
                type="button"
                onClick={() => setMenuSearchQuery("")}
                aria-label="Clear menu search"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {visibleCategories.length > 0 ? (
            <div className="overflow-x-auto overflow-y-visible scrollbar-hide -mx-4 px-4 pb-1" ref={categoryNavRef}>
              <div className="flex min-w-max gap-2">
                {visibleCategories.map((category) => {
                  const isActive = activeCategory === category
                  const itemCount = getCategoryItemCount(category)

                  return (
                    <button
                      key={category}
                      type="button"
                      data-category={category}
                      onClick={() => scrollToSection(category)}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold shadow-sm transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      {category}
                      {itemCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {itemCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : menuSearchQuery ? (
            <p className="pb-1 text-center text-xs text-gray-500" role="status">
              No dishes match “{menuSearchQuery}”. Try another search.
            </p>
          ) : null}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-4">
        {menuSearchQuery && visibleCategories.length > 0 && (
          <p className="mb-3 text-xs text-gray-500" role="status" aria-live="polite">
            {visibleCategories.reduce((count, category) => count + filteredMenuItems[category].length, 0)} results for “{menuSearchQuery}”
          </p>
        )}
        {visibleCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <h2 className="font-semibold text-gray-900">No dishes found</h2>
            <p className="mt-1 text-sm text-gray-500">Try another name, ingredient, or category.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMenuSearchQuery("")}
              className="mt-4 rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Clear search
            </Button>
          </div>
        ) : visibleCategories.map((category) => {
          const items = filteredMenuItems[category]
          const categoryItemCount = getCategoryItemCount(category)
          
          return (
            <div
              key={category}
              id={getCategoryId(category)}
              data-category={category}
              className="mb-6 scroll-mt-32"
              ref={(el) => {
                sectionRefs.current[category] = el
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-indigo-700 tracking-wide">
                  {category}
                </h2>
                {categoryItemCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {categoryItemCount}
                  </span>
                )}
              </div>
              
              <div className="h-px bg-gray-200 mb-4" />

              <div className="space-y-3">
                {items.map((item) => {
                  const itemQuantity = getItemOrderLines(item.name).reduce((sum, [, line]) => sum + line.quantity, 0)
                  const hasQuantity = itemQuantity > 0

                  return (
                    <div
                      key={item.name}
                      className={`relative bg-white rounded-2xl p-4 transition-all duration-300 ${
                        hasQuantity
                          ? "shadow-md ring-2 ring-indigo-500"
                          : "shadow hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h3>
                            <InfoTooltip description={item.description || ""} itemName={item.name} price={item.price} />
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-green-600 mt-2">${item.price.toFixed(2)}</p>
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-xs text-purple-600 font-semibold mt-1">+ Extras available</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!hasQuantity ? (
                            <Button
                              onClick={() => handleAddItem(item)}
                              className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-sm transition-all duration-200"
                            >
                              + Add
                            </Button>
                          ) : (
                            <>
                              <button
                                onClick={() => updateQuantity(item.name, -1, getItemOrderLines(item.name)[0]?.[1].extras)}
                                className="h-11 w-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 active:scale-95"
                              >
                                <Minus className="h-5 w-5" />
                              </button>
                              <span className="min-w-[2rem] text-center font-bold text-gray-900 text-lg">
                                {itemQuantity}
                              </span>
                              <button
                                onClick={() => handleAddItem(item)}
                                className="h-11 w-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-200 active:scale-95 shadow-sm"
                              >
                                <Plus className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="text-center py-4">
          <p className="text-sm text-foreground/60 italic font-medium">
            Nuestros empaques son de 1 libra y sirven aproximadamente 2 porciones.
          </p>
        </div>

        <div className="bg-white border-0 rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-1 text-foreground">Your Information</h2>
          <p className="mb-4 text-sm text-muted-foreground">Add your contact details when you&apos;re ready to place the order.</p>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="customer-name" className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Name</label>
              <Input
                id="customer-name"
                type="text"
                name="name"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter your name"
                className="w-full bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 h-12 rounded-2xl text-base shadow-sm"
              />
              {showSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-primary/20 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(customer)}
                      className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                        index === selectedSuggestionIndex ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="font-bold text-foreground">{customer.name}</div>
                      <div className="text-xs text-foreground/60 mt-0.5">
                        {customer.country_code} {customer.phone_number}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="customer-phone" className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Phone Number</label>
              <PhoneInput
                inputId="customer-phone"
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setCountryCode}
                onPhoneNumberChange={setPhoneNumber}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border-0 rounded-3xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-center text-foreground">Contact Us</h2>
          <div className="space-y-3">
            <a
              href="tel:+16315780700"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Phone</p>
                <p className="text-base font-bold text-primary">+1 631 578 0700</p>
              </div>
            </a>

            <a
              href="mailto:geraguillent@gmail.com"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Email</p>
                <p className="text-base font-bold text-primary">geraguillent@gmail.com</p>
              </div>
            </a>

            <a
              href="https://instagram.com/gera.cooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.668-.072 4.948-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.668.07-4.948.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground/60 font-bold uppercase tracking-wide">Instagram</p>
                <p className="text-base font-bold text-primary">@gera.cooks</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {getTotalItems() > 0 && (
        <button
          onClick={() => setIsCartSheetOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-4 rounded-full shadow-xl transition-all duration-200 flex items-center gap-3"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>View Order</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {getTotalItems()}
          </span>
          <span className="text-lg">${getTotalPrice().toFixed(2)}</span>
        </button>
      )}

      <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Your Order</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {Object.entries(menuItems).map(([category, items]) => {
              const categoryLines = items.flatMap((item) =>
                getItemOrderLines(item.name).map(([lineKey, orderItem]) => ({ item, lineKey, orderItem })),
              )

              if (categoryLines.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryLines.map(({ item, lineKey, orderItem }) => {
                      const extrasPrice = orderItem.extras.reduce((sum, extraId) => {
                        return sum + (item.extras?.find((extra) => extra.id === extraId)?.price || 0)
                      }, 0)
                      const subtotal = (item.price + extrasPrice) * orderItem.quantity

                      return (
                        <div key={lineKey} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              {orderItem.extras.length > 0 ? (
                                <div className="text-xs text-gray-600 mt-1">
                                  {orderItem.extras.map((extraId) => {
                                    const extra = item.extras?.find((candidate) => candidate.id === extraId)
                                    return extra ? <div key={extra.id}>+ {extra.name}</div> : null
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 mt-1">No extras</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">${subtotal.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.name, -1, orderItem.extras)}
                              aria-label={`Remove one ${item.name}${orderItem.extras.length ? " with extras" : " without extras"}`}
                              className="h-8 w-8 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-full transition-all duration-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[2rem] text-center font-bold text-gray-900">
                              {orderItem.quantity}
                            </span>
                            <button
                              onClick={() => handleAddItem(item)}
                              aria-label={`Add another ${item.name}`}
                              className="h-8 w-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeOrderLine(lineKey)}
                              aria-label={`Remove all ${orderItem.quantity} ${item.name}${orderItem.extras.length ? " with extras" : " without extras"} from order`}
                              title="Remove this item"
                              className="ml-auto h-9 w-9 flex items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="border-t px-6 py-4 bg-white" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-indigo-600">${getTotalPrice().toFixed(2)}</span>
            </div>
            
            <Button
              onClick={(e) => {
                setIsCartSheetOpen(false)
                handleSubmit(e)
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-2xl shadow-lg"
              disabled={!customerName || !phoneNumber || submitStatus === "submitting"}
            >
              {submitStatus === "submitting" ? "Placing Order..." : "Place Order"}
            </Button>
            
            {(!customerName || !phoneNumber) && (
              <p className="text-xs text-red-600 text-center mt-2">
                Please fill in your name and phone number above
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedItemForExtras} onOpenChange={(open) => !open && setSelectedItemForExtras(null)}>
        <DialogContent className="border-2 border-purple-300 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Extras to {selectedItemForExtras?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select optional extras for this item:</p>
            {selectedItemForExtras?.extras?.map((extra) => (
              <div key={extra.id} className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white p-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50">
                <Checkbox
                  id={extra.id}
                  className="size-5 border-2 border-indigo-700 bg-white data-[state=checked]:border-indigo-700 data-[state=checked]:bg-indigo-700 data-[state=checked]:text-white focus-visible:ring-indigo-500"
                  checked={tempExtras.includes(extra.id)}
                  onCheckedChange={(checked) => {
                    setTempExtras((prev) => (checked ? [...prev, extra.id] : prev.filter((id) => id !== extra.id)))
                  }}
                />
                <Label htmlFor={extra.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{extra.name}</span>
                    <span className="text-teal-400 font-bold">+${extra.price}</span>
                  </div>
                </Label>
              </div>
            ))}
            <Button
              onClick={confirmExtras}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-2xl"
            >
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
