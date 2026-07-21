import React, { useState } from 'react'
import { BookOpen, Bookmark } from 'lucide-react'
import type { VocabSetItem } from '@/data/hskVocabData'
import { HskBadge } from './HskBadge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface VocabSetCardProps {
  set: VocabSetItem;
  onStartLearn?: (id: string) => void;
  onStartReview?: (id: string) => void;
}

export const VocabSetCard: React.FC<VocabSetCardProps> = ({
  set,
  onStartLearn,
  onStartReview,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(!!set.isBookmarked)

  return (
    <Card className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#161c2e] p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-[#1a2238] hover:shadow-emerald-950/20">
      <CardHeader className="p-0 space-y-0">
        {/* Top Header: Book Icon, HSK Badge & Bookmark Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <BookOpen className="h-6 w-6 stroke-[1.75]" />
            </div>
            <HskBadge level={set.hskLevel} />
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsBookmarked(!isBookmarked)
            }}
            className={`rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={isBookmarked ? 'Đã lưu' : 'Lưu bộ từ'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </Button>
        </div>

        {/* Title */}
        <CardTitle className="mt-4 text-base font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
          {set.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        {/* Word count & List label */}
        <p className="text-xs font-medium text-slate-400">
          <span className="font-semibold text-slate-200">{set.totalWords} từ</span> •{' '}
          <span className="text-emerald-400 hover:underline cursor-pointer">
            {set.subtitle || 'Danh sách'}
          </span>
        </p>
      </CardContent>

      {/* Bottom Action Grid: 2 buttons */}
      <CardFooter className="p-0 mt-6 grid grid-cols-2 gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => onStartLearn?.(set.id)}
          className="flex h-auto flex-col items-center justify-center rounded-lg bg-emerald-900/40 border border-emerald-700/40 p-2.5 transition-all hover:bg-emerald-800/50 hover:border-emerald-600 active:scale-[0.98]"
        >
          <span className="text-lg font-black text-emerald-300 leading-none">
            {set.newWordsCount}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
            HỌC TỪ MỚI
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => onStartReview?.(set.id)}
          className="flex h-auto flex-col items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700/40 p-2.5 transition-all hover:bg-slate-700/60 hover:border-slate-600 active:scale-[0.98]"
        >
          <span className="text-lg font-black text-amber-400 leading-none">
            {set.reviewWordsCount}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
            ÔN TẬP
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}
