import { cn } from '../lib/utils'

// Base shimmer block
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn(
      'rounded-xl animate-pulse',
      'bg-gradient-to-r from-white/5 via-white/10 to-white/5',
      'bg-[length:200%_100%]',
      className
    )}
    style={{
      animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
    }} />
  )
}

// Signal card skeleton — matches the magazine grid card shape
export function SignalCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/3"
      style={{ minHeight: tall ? '420px' : '320px' }}
    >
      {/* Image area */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/4 via-white/8 to-white/4 bg-[length:200%_100%] animate-pulse" 
        style={{ animation: 'skeleton-shimmer 2s ease-in-out infinite' }}
      />
      
      {/* Content overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
        <SkeletonBlock className="h-6 w-3/4" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <SkeletonBlock className="h-3 w-12 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6">
        <SkeletonBlock className="w-24 h-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
    </div>
  )
}

// History card skeleton
export function HistoryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/2">
      <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-5 w-1/2" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
      <SkeletonBlock className="w-20 h-8 rounded-full" />
    </div>
  )
}

// Signal Detail / Event Detail skeleton
export function MomentDetailSkeleton() {
  return (
    <div className="flex-1 bg-void animate-in fade-in duration-700">
      {/* Hero area */}
      <div className="h-[45vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/4 via-white/8 to-white/4 bg-[length:200%_100%] animate-pulse" 
          style={{ animation: 'skeleton-shimmer 2.5s ease-in-out infinite' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-void" />
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 space-y-8">
        <div className="p-8 rounded-3xl bg-obsidian border border-white/8 space-y-6">
          <SkeletonBlock className="h-12 w-3/4" />
          <div className="flex gap-4">
            <SkeletonBlock className="h-10 w-32 rounded-full" />
            <SkeletonBlock className="h-10 w-32 rounded-full" />
          </div>
          <div className="space-y-3 pt-4">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        </div>
        
        {/* Creator block */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/3 border border-white/5">
          <SkeletonBlock className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
