import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  )
}

export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin', className)} />
  )
}
