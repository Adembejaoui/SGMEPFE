import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Skeleton className="h-10 w-20" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-4 md:col-span-2">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}