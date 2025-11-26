import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Service account credentials
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "magnetic-flare-254003",
  private_key_id: "0708f7d5fae524b53baf750ae3bed91f072f0c55",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGGq7JJo/MmMCy\n7We6fhaeuow0OJVDbWex+AbVUb/+mQApqlrfSMf4SSoWnFzrg2wGm1K6ID45OeeA\nWjn9fDiiBXTTCz6I54kQlnlA/Hyyxqs+ij8sjSzRGaBJ33iiYrhG/HIXc/uzUL+x\nhLNSeeWuoyUu8BzTSGYETIEuSpYd2cFGZ7SoaimP/8lbmei2uNA6VQZQ3RCemP6/\nQr4p3e5MAZPGsdKG1DEG9J00w/ESfvdW7ziWU8a7oU6zL6t/Z1u3XmChe3xflpfD\nhC2GL4tHZrfIQy/xd7q76+KKjGoaFXb84QZrPr0pt6xP80ty6ItmpZImDi3C02RG\n0Y+hXOGFAgMBAAECggEANISSXaUpbhX4z/Z8D0ap/H57+MQfXfa9DMMyHI9FlNs+\n3czZtmP3D21mCQR+5bi7hKzcq5csp8MgCjjhMsAhy2Ii7GgItgaboZgioQXOkR51\n+2hvAwKSJQTkJ3Fk67e8HqWCIZGP4qO/jfIeD/lc2IVLsDvbiG+jC/S0Mm93iIXf\n4lczNBFfDdWR5X7fD0XsscQpLrRSw4yXTdPRWcpiSSUmld2Tc6MOhdA1ueH0QhuD\nxJ+HfinK01AnNBYG9bSuRS/kJA6XpA+1ppF61SVC0UeIV7jNnzLEWmQD4tv5YqVE\nx/SYjQc6NcC5kBlwKWk5uIzzejp+P/h7/eBDF5jwaQKBgQD5F63/X0TbnCCEe8ff\nswUafRcyYYVrMZkXd9yvGqG5zlFkuHzQYI3X54oHBhfLSOvJG+SItoBqq/RjUBw8\nuPsdBVrbgGw91ya7lWUZDnDl4Qa2drJTfKQ7LK4J9rhqlhz/5ILaXiMwP3NJ7pDU\nwF5bRKp9N0w50tW4keqKdBEa/wKBgQDLmQjmII7Y2m5RLUEn5WworJQotJZ7jT+i\nDJ7MpDTdtfQVyQpJtm5lA/g5Fl1u10gQq74nSd3lIuAC/Qj0qHy/gfnz0RGqSuoh\n7hFisxg0M0Uie4ryju4lKPpEzi3vU+V+09xhuGqCjpMEvoW8DkHiEmGxi3JKTiJy\n8YRfREgXewKBgHNmTwwSfPopGL+IAQ9YBrNA5LBIkeEZd01yEGFnOymzte2tstVv\nBgfSkxWx8vAQ9nuTWosj0daZl30zLgHLyTqmsnMiygLUXHNnQREcqZ02ZT+/OdqH\n0iZACtk+3i0zInhCy4STPEYr/yNvTNXj0VMDOuEL71qSnMUHhNtj7lDNAoGAJAVo\nYKbD/zPuLqiODYv2rd+SuvzwXt2ns3j+I4Ct5cgKbkxKaK5BK9ge86K0Vyb5lhF8\nrCDShHa+IWk5S2f/4jYRzgRgVru4XtZq9wZustWbVrV66N1G3wY3+TJtSBmU0fKT\n3Covlfe5pS48JQB0wZW0+R+N0f2u9J0saVqAUr8CgYEAiGB3pJzvWEeGJf5T+rm9\ntQxmu+PXsdWk+zc9Czk7oQESwo6ObtwCjBVO+l/ecGWTFuuHD+BODMTJJHfd5u4L\nVs1cnCKbAqb4F+gAhZujucwdC1Zd4e2w1iTYP7UpuIDzn+So2+mujHkwsxgy0eNU\nN5QukRWUeIKevVzNuwlvNK0=\n-----END PRIVATE KEY-----\n",
  client_email: "gera-cooks@magnetic-flare-254003.iam.gserviceaccount.com",
  client_id: "117590595115286431659",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/gera-cooks%40magnetic-flare-254003.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
}

const SPREADSHEET_ID = "1JSV4ffeEQTzyjoz8xhtYUUEemb2tYeGNg-8GG9dLE6g"

function getItemPrice(itemName: string): number {
  const menuPrices: Record<string, number> = {
    "Stir fry c/vegetales": 13,
    Tinga: 12,
    Mole: 12,
    Pollinita: 13,
    "Crema de chipotle": 14,
    "Crema de poblano y elote": 14,
    "Deshebrado 12 oz": 10,
    "Salsa verde c/ papas": 12,
    Bolognesa: 15,
    Yakimeshi: 12,
    "Picadillo verde": 14,
    "Picadillo fit": 15,
    "Deshebrada 12 oz": 16,
    "Deshebrada c/ papa": 15,
    "Burritos desheb/papa (4)": 20,
    "Cortadillo c/ poblano": 16,
    Picadillo: 13,
    "Albóndigas al chipotle": 15,
    "Carnitas healthy": 16,
    "Cochinita pibil": 16,
    "Chicharrón salsa verde": 13,
    "Arroz rojo c/elote": 6,
    "Arroz cilantro limón": 6,
    "Arroz integral": 6,
    "Calabacitas a la mexicana": 9,
    "Calabacitas con elote": 9,
    "Fideo seco": 6,
    "Lentejas c/vegetales": 9,
    "Puré de papa": 7,
    "Puré de camote": 9,
    "Quinoa c/vegetales": 6,
  }
  return menuPrices[itemName] || 0
}

export async function POST(request: Request) {
  try {
    const { customerName, customerPhone, orderItems, totalPrice } = await request.json()

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName,
        customer_phone: customerPhone,
        total_price: totalPrice,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Error creating order:", orderError)
      throw orderError
    }

    const orderItemsData = Object.entries(orderItems).map(([itemName, quantity]) => {
      const unitPrice = getItemPrice(itemName)
      const itemTotal = unitPrice * (quantity as number)

      return {
        order_id: order.id,
        item_name: itemName,
        quantity: quantity as number,
        unit_price: unitPrice,
        total_price: itemTotal,
      }
    })

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

    if (itemsError) {
      console.error("[v0] Error creating order items:", itemsError)
      throw itemsError
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error("[v0] Error saving order:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
