import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const supabase = await createClient()

    // Get all labels from catering_quote_items
    const { data: items, error } = await supabase
      .from("catering_quote_items")
      .select("name")
      .not("name", "is", null)
      .limit(1000)

    if (error) {
      console.error("[v0] Error fetching label suggestions:", error)
      return NextResponse.json({ suggestions: [] })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // Count frequency of each label (case-insensitive)
    const frequencyMap = new Map<string, number>()
    const originalCaseMap = new Map<string, string>() // Keep original casing

    items.forEach((item) => {
      const label = item.name
      const lowerLabel = label.toLowerCase()
      frequencyMap.set(lowerLabel, (frequencyMap.get(lowerLabel) || 0) + 1)
      if (!originalCaseMap.has(lowerLabel)) {
        originalCaseMap.set(lowerLabel, label)
      }
    })

    const lowerQuery = query.toLowerCase()

    // Filter and sort suggestions
    const suggestions = Array.from(frequencyMap.entries())
      .filter(([label]) => {
        return label.includes(lowerQuery)
      })
      .sort((a, b) => {
        const [labelA, freqA] = a
        const [labelB, freqB] = b

        // "Starts with" matches first
        const aStartsWith = labelA.startsWith(lowerQuery)
        const bStartsWith = labelB.startsWith(lowerQuery)

        if (aStartsWith && !bStartsWith) return -1
        if (!aStartsWith && bStartsWith) return 1

        // Then by frequency
        if (freqB !== freqA) return freqB - freqA

        // Then alphabetically
        return labelA.localeCompare(labelB)
      })
      .slice(0, 10) // Limit to top 10
      .map(([label]) => originalCaseMap.get(label)!)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("[v0] Error in label suggestions:", error)
    return NextResponse.json({ suggestions: [] }, { status: 500 })
  }
}
