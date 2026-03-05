import { NextResponse } from "next/server"
import { createCateringQuote } from "@/app/admin/catering/actions"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { contact, people, items, subtotal } = payload

    // ── 1) Persist to DB ──────────────────────────────────────────────────────
    const quoteItems = (items ?? []).map((i: any) => ({
      label: i.name,
      price: i.lineTotal ?? 0,
      item_type: i.unitPrice === null ? "included" : "priced",
    }))

    const result = await createCateringQuote({
      customer_name: contact.nombre,
      phone: contact.phone,
      notes: [
        contact.notas,
        contact.fecha   ? `Fecha: ${contact.fecha}`       : null,
        contact.hora    ? `Hora: ${contact.hora}`         : null,
        contact.direccion ? `Dirección: ${contact.direccion}` : null,
        contact.email   ? `Email: ${contact.email}`       : null,
      ].filter(Boolean).join("\n"),
      status: "sent",
      quote_type: "items",
      people_count: people ?? null,
      subtotal: subtotal ?? 0,
      tax: 0,
      delivery_fee: 0,
      discount: 0,
      total: subtotal ?? 0,
      items: quoteItems,
    })

    if (result.error) {
      console.error("[catering-quote] DB save failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    // ── 2) WhatsApp notification to business owner ────────────────────────────
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken  = process.env.TWILIO_AUTH_TOKEN
      const from       = process.env.TWILIO_WHATSAPP_FROM
      const to         = process.env.TWILIO_WHATSAPP_OWNER

      if (accountSid && authToken && from && to) {
        const itemLines = (items ?? [])
          .map((i: any) =>
            i.unitPrice === null
              ? `  • ${i.qty}x ${i.name} (precio a confirmar)`
              : `  • ${i.qty}x ${i.name} – $${(i.lineTotal ?? 0).toFixed(2)}`
          )
          .join("\n")

        const body = [
          `*Nueva solicitud de catering*`,
          `👤 ${contact.nombre}  |  📱 ${contact.phone}`,
          contact.fecha    ? `📅 ${contact.fecha}${contact.hora ? ` a las ${contact.hora}` : ""}` : null,
          contact.direccion ? `📍 ${contact.direccion}` : null,
          `👥 ${people} personas`,
          ``,
          `*Menú solicitado:*`,
          itemLines,
          ``,
          `*Subtotal estimado: $${(subtotal ?? 0).toFixed(2)}*`,
          contact.notas ? `\n📝 ${contact.notas}` : null,
          `\nVer en admin: ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/catering/${result.id}`,
        ].filter((l) => l !== null).join("\n")

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
        const params = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body })

        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        })

        if (!twilioRes.ok) {
          const err = await twilioRes.text()
          console.error("[catering-quote] Twilio error:", err)
        }
      }
    } catch (notifyErr) {
      // Don't fail the request if notification fails
      console.error("[catering-quote] Notification error (non-fatal):", notifyErr)
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error("[catering-quote] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
