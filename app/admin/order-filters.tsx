"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter } from "lucide-react"

interface FilterTag {
  type: "status" | "phone"
  value: string
  label: string
}

interface OrderFiltersProps {
  onFiltersChange: (filters: FilterTag[]) => void
}

export function OrderFilters({ onFiltersChange }: OrderFiltersProps) {
  const [filters, setFilters] = useState<FilterTag[]>([])
  const [phoneInput, setPhoneInput] = useState("")
  const [statusSelect, setStatusSelect] = useState("")

  const addStatusFilter = (status: string) => {
    if (!status) return

    // Check if status filter already exists
    if (filters.some((f) => f.type === "status" && f.value === status)) {
      return
    }

    const newFilter: FilterTag = {
      type: "status",
      value: status,
      label: `Status: ${status}`,
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    onFiltersChange(newFilters)
    setStatusSelect("")
  }

  const addPhoneFilter = () => {
    if (!phoneInput.trim()) return

    // Check if this phone filter already exists
    if (filters.some((f) => f.type === "phone" && f.value === phoneInput)) {
      return
    }

    const newFilter: FilterTag = {
      type: "phone",
      value: phoneInput,
      label: `Phone: ${phoneInput}`,
    }
    const newFilters = [...filters, newFilter]
    setFilters(newFilters)
    onFiltersChange(newFilters)
    setPhoneInput("")
  }

  const removeFilter = (filterToRemove: FilterTag) => {
    const newFilters = filters.filter((f) => f !== filterToRemove)
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setFilters([])
    onFiltersChange([])
  }

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Status Filter */}
        <div className="flex gap-2 items-center">
          <Select value={statusSelect} onValueChange={setStatusSelect}>
            <SelectTrigger className="w-full sm:w-[160px] border-elegant text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => addStatusFilter(statusSelect)}
            variant="outline"
            size="sm"
            className="border-elegant bg-transparent shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Phone Filter */}
        <div className="flex gap-2 items-center flex-1">
          <Input
            type="text"
            placeholder="Filter by phone"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPhoneFilter()}
            className="border-elegant text-sm"
          />
          <Button
            onClick={addPhoneFilter}
            variant="outline"
            size="sm"
            className="border-elegant bg-transparent shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filters.map((filter, index) => (
            <Badge
              key={`${filter.type}-${filter.value}-${index}`}
              variant="secondary"
              className="gap-1 pr-1 bg-elegant/10 hover:bg-elegant/20 border-elegant text-xs"
            >
              {filter.label}
              <button onClick={() => removeFilter(filter)} className="ml-1 hover:bg-elegant/30 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
