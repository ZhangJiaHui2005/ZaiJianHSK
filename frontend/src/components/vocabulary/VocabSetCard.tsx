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
    <Card className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:bg-accent/30 hover:shadow-md">
      <CardHeader className="p-0 space-y-0">
        {/* Top Header: Book Icon, HSK Badge & Bookmark Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors">
              <BookOpen className="h-6 w-6 stroke-[1.75]" />
            </div>
            <HskBadge level={set.hskLevel} />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              setIsBookmarked(!isBookmarked)
            }}
            className={`h-8 w-8 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={isBookmarked ? 'Đã lưu' : 'Lưu bộ từ'}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </Button>
        </div>

        {/* Title */}
        <CardTitle className="mt-4 text-base font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {set.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 mt-2">
        {/* Word count & List label */}
        <p className="text-xs font-medium text-muted-foreground">
          <span className="font-semibold text-foreground">{set.totalWords} từ</span> •{' '}
          <span className="text-primary hover:underline cursor-pointer">
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
          className="flex h-auto flex-col items-center justify-center rounded-lg border-primary/30 bg-primary/10 p-2.5 transition-all hover:bg-primary/20 hover:border-primary active:scale-[0.98]"
        >
          <span className="text-lg font-black text-primary leading-none">
            {set.newWordsCount}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-wider text-primary uppercase">
            HỌC TỪ MỚI
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => onStartReview?.(set.id)}
          className="flex h-auto flex-col items-center justify-center rounded-lg border-border bg-muted/50 p-2.5 transition-all hover:bg-muted active:scale-[0.98]"
        >
          <span className="text-lg font-black text-foreground leading-none">
            {set.reviewWordsCount}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            ÔN TẬP
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}

