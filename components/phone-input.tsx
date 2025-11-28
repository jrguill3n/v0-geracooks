"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CountryCode {
  code: string
  country: string
  flag?: string
}

const countryCodes: CountryCode[] = [
  { code: "+1", country: "United States" },
  { code: "+52", country: "Mexico" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+43", country: "Austria" },
  { code: "+32", country: "Belgium" },
  { code: "+55", country: "Brazil" },
  { code: "+1", country: "Canada" },
  { code: "+56", country: "Chile" },
  { code: "+86", country: "China" },
  { code: "+57", country: "Colombia" },
  { code: "+506", country: "Costa Rica" },
  { code: "+45", country: "Denmark" },
  { code: "+593", country: "Ecuador" },
  { code: "+20", country: "Egypt" },
  { code: "+503", country: "El Salvador" },
  { code: "+358", country: "Finland" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Germany" },
  { code: "+30", country: "Greece" },
  { code: "+502", country: "Guatemala" },
  { code: "+504", country: "Honduras" },
  { code: "+852", country: "Hong Kong" },
  { code: "+91", country: "India" },
  { code: "+62", country: "Indonesia" },
  { code: "+353", country: "Ireland" },
  { code: "+972", country: "Israel" },
  { code: "+39", country: "Italy" },
  { code: "+81", country: "Japan" },
  { code: "+254", country: "Kenya" },
  { code: "+60", country: "Malaysia" },
  { code: "+31", country: "Netherlands" },
  { code: "+64", country: "New Zealand" },
  { code: "+505", country: "Nicaragua" },
  { code: "+47", country: "Norway" },
  { code: "+507", country: "Panama" },
  { code: "+51", country: "Peru" },
  { code: "+63", country: "Philippines" },
  { code: "+48", country: "Poland" },
  { code: "+351", country: "Portugal" },
  { code: "+1", country: "Puerto Rico" },
  { code: "+40", country: "Romania" },
  { code: "+7", country: "Russia" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+27", country: "South Africa" },
  { code: "+82", country: "South Korea" },
  { code: "+34", country: "Spain" },
  { code: "+46", country: "Sweden" },
  { code: "+41", country: "Switzerland" },
  { code: "+886", country: "Taiwan" },
  { code: "+66", country: "Thailand" },
  { code: "+90", country: "Turkey" },
  { code: "+971", country: "UAE" },
  { code: "+598", country: "Uruguay" },
  { code: "+58", country: "Venezuela" },
  { code: "+84", country: "Vietnam" },
]

interface PhoneInputProps {
  countryCode: string
  phoneNumber: string
  onCountryCodeChange: (code: string) => void
  onPhoneNumberChange: (number: string) => void
}

export function PhoneInput({ countryCode, phoneNumber, onCountryCodeChange, onPhoneNumberChange }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCountries = countryCodes.filter(
    (country) => country.country.toLowerCase().includes(search.toLowerCase()) || country.code.includes(search),
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (code: string) => {
    onCountryCodeChange(code)
    setIsOpen(false)
    setSearch("")
  }

  const selectedCountry = countryCodes.find((c) => c.code === countryCode) || countryCodes[0]

  return (
    <div className="flex gap-2">
      {/* Country Code Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <Button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-40 px-3 py-2 bg-white border border-gray-300 rounded-md hover:border-teal-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium text-gray-900 flex items-center justify-between h-10"
          variant="outline"
        >
          <span className="truncate">
            {selectedCountry.code} ({selectedCountry.country.substring(0, 2)})
          </span>
          <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search country or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Country List */}
            <div className="overflow-y-auto flex-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <button
                    key={`${country.code}-${country.country}-${index}`}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-teal-50 flex items-center justify-between transition-colors ${
                      country.code === countryCode ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{country.country}</span>
                      <span className="text-gray-500 ml-2 text-sm">{country.code}</span>
                    </div>
                    {country.code === countryCode && <Check className="h-4 w-4 text-teal-600" />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">No countries found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <Input
        type="tel"
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
        placeholder="(555) 123-4567"
        className="flex-1 bg-white border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
    </div>
  )
}
