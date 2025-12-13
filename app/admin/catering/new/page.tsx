import { AdminNav } from "@/components/admin-nav"
import { CateringForm } from "../catering-form"

export default async function NewCateringPage() {
  try {
    return (
      <>
        <AdminNav title="New Catering Quote" subtitle="Create a custom catering quote" />
        <CateringForm />
      </>
    )
  } catch (error) {
    console.error("[catering/new] render error:", error instanceof Error ? error.message : "Unknown error", error)

    return (
      <>
        <AdminNav title="Error" subtitle="Failed to load catering form" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <h2 className="font-semibold mb-2">Failed to load Catering form</h2>
            <p className="text-sm">Please check server logs for details.</p>
            <a href="/admin/catering" className="text-sm underline mt-2 inline-block">
              ← Back to Catering List
            </a>
          </div>
        </div>
      </>
    )
  }
}
