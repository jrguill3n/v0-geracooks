import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="min-h-screen pwa-safe-bottom bg-gradient-to-br from-primary/5 via-white to-secondary/30">
      {/* Header bar — mirrors AdminNav so the shell paints instantly */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-8 w-56 bg-white/25 sm:h-11 sm:w-80" />
              <Skeleton className="mt-2 hidden h-4 w-64 bg-white/20 sm:block" />
            </div>
            <div className="hidden gap-3 md:flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-28 rounded-2xl bg-white/20" />
              ))}
            </div>
            <Skeleton className="size-10 rounded-xl bg-white/20 md:hidden" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </Card>
          ))}
        </div>

        {/* Orders filter bar */}
        <Card className="mb-4 rounded-2xl p-3 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Skeleton className="h-11 w-full sm:h-9 sm:w-44" />
            <Skeleton className="h-11 w-full sm:h-9 sm:w-56" />
            <Skeleton className="h-11 w-full sm:h-9 sm:flex-1" />
          </div>
        </Card>

        {/* Order cards */}
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-3 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
