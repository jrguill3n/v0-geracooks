import { AdminNav } from "@/components/admin-nav"
import { CateringForm } from "../catering-form"

export default function NewCateringPage() {
  return (
    <>
      <AdminNav title="New Catering Quote" subtitle="Create a custom catering quote" />
      <CateringForm />
    </>
  )
}
