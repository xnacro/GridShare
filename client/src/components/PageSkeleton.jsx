import { Card, Skeleton } from '@heroui/react'

// Generic placeholder shown for a brief moment on every route change,
// simulating data being fetched. Every page in this app shares roughly
// this shape (header, stat row, a couple of cards), so one shared
// skeleton reads as plausible everywhere rather than hand-building one
// per page.
export default function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Card.Content className="space-y-3 py-5">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <Card.Content className="space-y-3 py-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-24 w-full" />
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  )
}
