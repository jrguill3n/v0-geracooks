"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface CountryCode {
  code: string
  country: string
  countryCode: string
  flag?: string
}

const countryCodes: CountryCode[] = [
  { code: "+1", country: "United States", countryCode: "US" },
  { code: "+52", country: "Mexico", countryCode: "MX" },
  { code: "+44", country: "United Kingdom", countryCode: "GB" },
  { code: "+61", country: "Australia", countryCode: "AU" },
  { code: "+43", country: "Austria", countryCode: "AT" },
  { code: "+32", country: "Belgium", countryCode: "BE" },
  { code: "+55", country: "Brazil", countryCode: "BR" },
  { code: "+1", country: "Canada", countryCode: "CA" },
  { code: "+56", country: "Chile", countryCode: "CL" },
  { code: "+86", country: "China", countryCode: "CN" },
  { code: "+57", country: "Colombia", countryCode: "CO" },
  { code: "+506", country: "Costa Rica", countryCode: "CR" },
  { code: "+45", country: "Denmark", countryCode: "DK" },
  { code: "+593", country: "Ecuador", countryCode: "EC" },
  { code: "+20", country: "Egypt", countryCode: "EG" },
  { code: "+503", country: "El Salvador", countryCode: "SV" },
  { code: "+358", country: "Finland", countryCode: "FI" },
  { code: "+33", country: "France", countryCode: "FR" },
  { code: "+49", country: "Germany", countryCode: "DE" },
  { code: "+30", country: "Greece", countryCode: "GR" },
  { code: "+502", country: "Guatemala", countryCode: "GT" },
  { code: "+504", country: "Honduras", countryCode: "HN" },
  { code: "+852", country: "Hong Kong", countryCode: "HK" },
  { code: "+91", country: "India", countryCode: "IN" },
  { code: "+62", country: "Indonesia", countryCode: "ID" },
  { code: "+353", country: "Ireland", countryCode: "IE" },
  { code: "+972", country: "Israel", countryCode: "IL" },
  { code: "+39", country: "Italy", countryCode: "IT" },
  { code: "+81", country: "Japan", countryCode: "JP" },
  { code: "+254", country: "Kenya", countryCode: "KE" },
  { code: "+60", country: "Malaysia", countryCode: "MY" },
  { code: "+31", country: "Netherlands", countryCode: "NL" },
  { code: "+64", country: "New Zealand", countryCode: "NZ" },
  { code: "+505", country: "Nicaragua", countryCode: "NI" },
  { code: "+47", country: "Norway", countryCode: "NO" },
  { code: "+507", country: "Panama", countryCode: "PA" },
  { code: "+51", country: "Peru", countryCode: "PE" },
  { code: "+63", country: "Philippines", countryCode: "PH" },
  { code: "+48", country: "Poland", countryCode: "PL" },
  { code: "+351", country: "Portugal", countryCode: "PT" },
  { code: "+1", country: "Puerto Rico", countryCode: "PR" },
  { code: "+40", country: "Romania", countryCode: "RO" },
  { code: "+7", country: "Russia", countryCode: "RU" },
  { code: "+966", country: "Saudi Arabia", countryCode: "SA" },
  { code: "+65", country: "Singapore", countryCode: "SG" },
  { code: "+27", country: "South Africa", countryCode: "ZA" },
  { code: "+82", country: "South Korea", countryCode: "KR" },
  { code: "+34", country: "Spain", countryCode: "ES" },
  { code: "+46", country: "Sweden", countryCode: "SE" },
  { code: "+41", country: "Switzerland", countryCode: "CH" },
  { code: "+886", country: "Taiwan", countryCode: "TW" },
  { code: "+66", country: "Thailand", countryCode: "TH" },
  { code: "+90", country: "Turkey", countryCode: "TR" },
  { code: "+971", country: "UAE", countryCode: "AE" },
  { code: "+598", country: "Uruguay", countryCode: "UY" },
  { code: "+58", country: "Venezuela", countryCode: "VE" },
  { code: "+84", country: "Vietnam", countryCode: "VN" },
]

interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  countryCode?: string
  phoneNumber?: string
  onCountryCodeChange?: (code: string) => void
  onPhoneNumberChange?: (number: string) => void
}

export function PhoneInput({
  value,
  onChange,
  required,
  countryCode: propCountryCode,
  phoneNumber: propPhoneNumber,
  onCountryCodeChange: propOnCountryCodeChange,
  onPhoneNumberChange: propOnPhoneNumberChange,
}: PhoneInputProps) {
  const [draftCountryCode, setDraftCountryCode] = useState("+1")
  const [draftPhoneDigits, setDraftPhoneDigits] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)

  // Initialize from props only once on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      if (propCountryCode && propPhoneNumber) {
        // New-style props
        setDraftCountryCode(propCountryCode)
        setDraftPhoneDigits(propPhoneNumber)
      } else if (value) {
        // Old-style single value prop - parse it
        const match = value.match(/^(\+\d+)(.*)$/)
        if (match) {
          setDraftCountryCode(match[1])
          // Strip non-digits from phone part
          setDraftPhoneDigits(match[2].replace(/\D/g, ""))
        } else {
          // Just digits, no country code
          setDraftPhoneDigits(value.replace(/\D/g, ""))
        }
      }
      isInitializedRef.current = true
    }
  }, [])

  const notifyParent = (countryCode: string, phoneDigits: string) => {
    // Notify parent with combined normalized value
    const combined = `${countryCode}${phoneDigits}`
    if (onChange) {
      onChange(combined)
    }
    if (propOnCountryCodeChange) {
      propOnCountryCodeChange(countryCode)
    }
    if (propOnPhoneNumberChange) {
      propOnPhoneNumberChange(phoneDigits)
    }
  }

  const handleCountryCodeChange = (code: string) => {
    setDraftCountryCode(code)
    notifyParent(code, draftPhoneDigits)
    setIsOpen(false)
    setSearch("")
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Strip non-digits, allow paste with formatted numbers
    const digits = input.replace(/\D/g, "")
    setDraftPhoneDigits(digits)
    // Update parent immediately so validation works
    notifyParent(draftCountryCode, digits)
  }

  const handlePhoneBlur = () => {
    // On blur, ensure parent has the latest normalized value
    notifyParent(draftCountryCode, draftPhoneDigits)
  }

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
    handleCountryCodeChange(code)
  }

  const selectedCountry = countryCodes.find((c) => c.code === draftCountryCode) || countryCodes[0]

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
            {selectedCountry.code} ({selectedCountry.countryCode})
          </span>
          <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
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

            <div className="overflow-y-auto flex-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <button
                    key={`${country.code}-${country.country}-${index}`}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-teal-50 flex items-center justify-between transition-colors ${
                      country.code === draftCountryCode ? "bg-teal-50" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{country.country}</span>
                      <span className="text-gray-500 ml-2 text-sm">{country.code}</span>
                    </div>
                    {country.code === draftCountryCode && <Check className="h-4 w-4 text-teal-600" />}
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
        name="tel"
        autoComplete="tel"
        value={draftPhoneDigits}
        onChange={handlePhoneNumberChange}
        onBlur={handlePhoneBlur}
        placeholder="5551234567"
        required={required}
        className="flex-1 bg-white border border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
    </div>
  )
}
