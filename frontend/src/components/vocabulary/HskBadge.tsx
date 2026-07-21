import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HskBadgeProps {
  level: string;
  className?: string;
}

export const HskBadge: React.FC<HskBadgeProps> = ({ level, className = '' }) => {
  const getBadgeStyle = (lvl: string) => {
    switch (lvl.toUpperCase()) {
      case 'HSK 1':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'HSK 2':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30'
      case 'HSK 3':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30'
      case 'HSK 4':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'HSK 5':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'HSK 6':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/30'
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide border transition-all',
        getBadgeStyle(level),
        className
      )}
    >
      {level}
    </Badge>
  )
}
