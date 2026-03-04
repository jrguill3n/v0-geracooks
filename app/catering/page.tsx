import type { Metadata } from "next"
import { CateringQuoteClient } from "./catering-quote-client"

export const metadata: Metadata = {
  title: "Catering | Gera Cooks",
  description:
    "Arma tu cotización de catering en minutos. Selecciona piezas, ajusta cantidades y envíanos tu solicitud.",
}

export default function CateringPage() {
  return <CateringQuoteClient />
}
