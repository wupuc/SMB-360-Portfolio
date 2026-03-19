import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface SkeletonTableProps {
  rows?: number
  columns?: number
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full space-y-0">
      {/* Header row */}
      <div className="flex gap-2 border-b px-2 py-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1 rounded" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-2 border-b px-2 py-3 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return <Skeleton className="h-32 w-full rounded-lg" />
}
