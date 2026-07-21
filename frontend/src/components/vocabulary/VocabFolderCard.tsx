import React from 'react'
import { Folder, ChevronRight } from 'lucide-react'
import type { VocabFolderItem } from '@/data/hskVocabData'
import { HskBadge } from './HskBadge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VocabFolderCardProps {
  folder: VocabFolderItem;
  onOpenFolder?: (id: string) => void;
}

export const VocabFolderCard: React.FC<VocabFolderCardProps> = ({
  folder,
  onOpenFolder,
}) => {
  return (
    <Card
      onClick={() => onOpenFolder?.(folder.id)}
      className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-slate-800/80 bg-[#161c2e] p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-[#1a2238] hover:shadow-emerald-950/20"
    >
      <CardHeader className="p-0 space-y-0">
        {/* Top Header Row: Folder Icon & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
            <Folder className="h-6 w-6 stroke-[1.75]" />
          </div>
          <HskBadge level={folder.hskLevel} />
        </div>

        {/* Title */}
        <CardTitle className="mt-4 text-base font-bold text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
          {folder.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 mt-3.5">
        {/* Sub-tags (Phần 1, Phần 2...) */}
        <div className="flex flex-wrap gap-1.5">
          {folder.subTags.map((tag, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium text-[11px] px-2 py-0.5 rounded-md"
            >
              {tag}
            </Badge>
          ))}
          {folder.extraCountText && (
            <Badge
              variant="secondary"
              className="bg-slate-800 text-slate-400 font-medium text-[11px] px-2 py-0.5 rounded-md"
            >
              {folder.extraCountText}
            </Badge>
          )}
        </div>
      </CardContent>

      {/* Card Footer: Action Link */}
      <CardFooter className="p-0 mt-6 flex items-center justify-between border-t border-slate-800/60 pt-3.5 text-xs font-semibold text-slate-400 group-hover:text-slate-200">
        <span>Xem các bộ</span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </CardFooter>
    </Card>
  )
}
