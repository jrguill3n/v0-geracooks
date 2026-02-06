"use client"

import type React from "react"
import Image from "next/image"
import { InfoTooltip } from "@/components/info-tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Minus, Plus, ShoppingBag } from "lucide-react"
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
  quantity: number
  extras: string[] // Array of extra IDs
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
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>()
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({})
  const [orderSubmitted, setOrderSubmitted] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<MenuItem | null>(null)
  const [tempExtras, setTempExtras] = useState<string[]>([])
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(() => Object.keys(menuItems)[0])
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryNavRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const categories = Object.keys(menuItems)
      let currentActive = categories[0]

      for (const category of categories) {
        const section = sectionRefs.current[category]
        if (section) {
          const rect = section.getBoundingClientRect()
          if (rect.top <= 250 && rect.bottom > 250) {
            currentActive = category
            break
          }
        }
      }

      if (currentActive !== activeCategory) {
        setActiveCategory(currentActive)
        
        // Auto-scroll the active pill into view
        if (categoryNavRef.current) {
          const activeButton = categoryNavRef.current.querySelector(`[data-category="${currentActive}"]`)
          if (activeButton) {
            activeButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [menuItems, activeCategory])

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
    if (section) {
      const offset = 200
      const top = section.offsetTop - offset
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

  const handleAddItem = (item: MenuItem) => {
    if (item.extras && item.extras.length > 0) {
      setSelectedItemForExtras(item)
      setTempExtras(orderItems[item.name]?.extras || [])
    } else {
      updateQuantity(item.name, 1)
    }
  }

  const updateQuantity = (itemName: string, change: number, newExtras?: string[]) => {
    setOrderItems((prev) => {
      const currentItem = prev[itemName]
      const newQuantity = (currentItem?.quantity || 0) + change

      if (newQuantity <= 0) {
        const { [itemName]: _, ...rest } = prev
        return rest
      }

      return {
        ...prev,
        [itemName]: {
          quantity: newQuantity,
          extras: newExtras !== undefined ? newExtras : currentItem?.extras || [],
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

  const getTotalItems = () => {
    return Object.values(orderItems).reduce((sum, item) => sum + item.quantity, 0)
  }

  const getCategoryItemCount = (category: string) => {
    const items = menuItems[category]
    if (!items) return 0
    return items.reduce((sum, item) => {
      return sum + (orderItems[item.name]?.quantity || 0)
    }, 0)
  }

  const getTotalPrice = () => {
    let total = 0
    Object.entries(orderItems).forEach(([itemName, orderItem]) => {
      const item = Object.values(menuItems)
        .flat()
        .find((i) => i.name === itemName)
      if (item) {
        let itemPrice = item.price
        orderItem.extras.forEach((extraId) => {
          const extra = item.extras?.find((e) => e.id === extraId)
          if (extra) {
            itemPrice += extra.price
          }
        })
        total += itemPrice * orderItem.quantity
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/30 pb-24">
      <div className="bg-white">
        <div className="max-w-2xl mx-auto px-6 py-2">
          <div className="flex flex-col items-center text-center">
            <Image src="/gera-logo.png" alt="GERA COOKS" width={220} height={220} className="object-contain" />
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4" ref={categoryNavRef}>
            <div className="flex gap-2 min-w-max">
              {Object.keys(menuItems).map((category) => {
                const isActive = activeCategory === category
                const itemCount = getCategoryItemCount(category)
                
                return (
                  <button
                    key={category}
                    data-category={category}
                    onClick={() => scrollToSection(category)}
                    className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-200 whitespace-nowrap shadow-sm relative ${
                      isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {category}
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1">
                        {itemCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="bg-white border-0 rounded-3xl shadow-lg p-6 mb-4">
          <h2 className="text-xl font-bold mb-4 text-foreground">Your Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Name</label>
              <Input
                type="text"
                name="name"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter your name"
                className="w-full bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20 h-12 rounded-2xl text-sm shadow-sm"
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
              <label className="block text-xs font-bold mb-2 text-foreground/70 tracking-wide">Phone Number</label>
              <PhoneInput
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setCountryCode}
                onPhoneNumberChange={setPhoneNumber}
              />
            </div>
          </div>
        </div>

        {Object.entries(menuItems).map(([category, items]) => {
          const categoryItemCount = getCategoryItemCount(category)
          
          return (
            <div
              key={category}
              className="mb-6"
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
                  const itemInCart = orderItems[item.name]
                  const hasQuantity = itemInCart && itemInCart.quantity > 0

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
                                onClick={() => updateQuantity(item.name, -1)}
                                className="h-11 w-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all duration-200 active:scale-95"
                              >
                                <Minus className="h-5 w-5" />
                              </button>
                              <span className="min-w-[2rem] text-center font-bold text-gray-900 text-lg">
                                {itemInCart.quantity}
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
              const categoryItems = items.filter((item) => orderItems[item.name]?.quantity > 0)
              
              if (categoryItems.length === 0) return null
              
              return (
                <div key={category}>
                  <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryItems.map((item) => {
                      const orderItem = orderItems[item.name]
                      let itemPrice = item.price
                      
                      orderItem.extras.forEach((extraId) => {
                        const extra = item.extras?.find((e) => e.id === extraId)
                        if (extra) {
                          itemPrice += extra.price
                        }
                      })
                      
                      const subtotal = itemPrice * orderItem.quantity
                      
                      return (
                        <div key={item.name} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              {orderItem.extras.length > 0 && (
                                <div className="text-xs text-gray-600 mt-1">
                                  {orderItem.extras.map((extraId) => {
                                    const extra = item.extras?.find((e) => e.id === extraId)
                                    return extra ? (
                                      <div key={extra.id}>+ {extra.name}</div>
                                    ) : null
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">${subtotal.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.name, -1)}
                              className="h-8 w-8 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 rounded-full transition-all duration-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-[2rem] text-center font-bold text-gray-900">
                              {orderItem.quantity}
                            </span>
                            <button
                              onClick={() => handleAddItem(item)}
                              className="h-8 w-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
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
          
          <div className="border-t px-6 py-4 bg-white">
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
              <div key={extra.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={extra.id}
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
