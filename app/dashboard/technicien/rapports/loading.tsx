import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 bg-muted rounded animate-pulse" />
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left pane skeleton */}
        <div className="w-full md:w-96 lg:w-[400px] flex flex-col border rounded-lg p-4 space-y-3">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>

        {/* Right pane skeleton */}
        <div className="flex-1 flex flex-col border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-40 bg-muted rounded animate-pulse" />
            <div className="h-40 bg-muted rounded animate-pulse" />
            <div className="md:col-span-2 h-40 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
