import React, { useState, useEffect } from 'react'
import { Search, Volume2, BookOpen, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { fetchDeckWords, type VocabularyWord, type HskDeck } from '@/lib/api'
import { HskBadge } from './HskBadge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface VocabSetDetailModalProps {
  deck: HskDeck | null;
  isOpen: boolean;
  onClose: () => void;
  onStartLearn?: (deckId: string) => void;
}

export const VocabSetDetailModal: React.FC<VocabSetDetailModalProps> = ({
  deck,
  isOpen,
  onClose,
  onStartLearn,
}) => {
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !deck) return

    const loadWords = async () => {
      setLoading(true)
      try {
        const res = await fetchDeckWords({
          levelKey: deck.levelKey,
          page: deck.page,
          limit: deck.limit,
          search: searchQuery,
        })
        if (res.success) {
          setWords(res.words)
        }
      } catch (err) {
        console.error('Failed to load deck words:', err)
      } finally {
        setLoading(false)
      }
    }

    loadWords()
  }, [isOpen, deck, searchQuery])

  if (!deck) return null

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 border border-slate-800 bg-[#121829] text-slate-100 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-800/80 p-5 bg-[#161c2e] text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold text-white">{deck.title}</DialogTitle>
                <HskBadge level={deck.hskLevel} />
              </div>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Danh sách {words.length} / {deck.totalWords} từ vựng HSK 3.0
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Control Bar (Search & Actions) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b border-slate-800/60 bg-[#141a2a]">
          {/* Internal Word Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ trong bài này (Pinyin, Chữ Hán, Nghĩa)..."
              className="w-full rounded-xl border border-slate-800 bg-[#1a2238] py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onStartLearn?.(deck.id)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl px-5 flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>BẮT ĐẦU HỌC TỪ MỚI</span>
          </Button>
        </div>

        {/* Modal Content: Word List Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-emerald-400">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="ml-3 text-sm font-semibold">Đang tải danh sách từ vựng...</span>
            </div>
          ) : words.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {words.map((w, idx) => (
                <div
                  key={w._id || idx}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-[#161c2e] p-3.5 transition-all hover:border-slate-700 hover:bg-[#1a2238]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 w-6 text-center">
                      {(deck.page - 1) * deck.limit + idx + 1}
                    </span>

                    {/* Chinese Character & Pinyin */}
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-white tracking-wide">
                          {w.simplified}
                        </span>
                        {w.traditional && w.traditional !== w.simplified && (
                          <span className="text-xs font-medium text-slate-500">
                            ({w.traditional})
                          </span>
                        )}
                        <span className="text-sm font-semibold text-emerald-400">
                          [{w.pinyin}]
                        </span>
                      </div>

                      {/* Meanings */}
                      <p className="text-xs font-medium text-slate-300 mt-0.5 line-clamp-1">
                        {w.meanings.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Audio button & Radical badge */}
                  <div className="flex items-center gap-3">
                    {w.radical && (
                      <Badge
                        variant="secondary"
                        className="hidden sm:inline-flex bg-slate-800 text-slate-400 font-medium text-[11px] px-2 py-0.5 rounded-md"
                      >
                        Bộ: {w.radical}
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => playAudio(w.simplified)}
                      className="rounded-xl bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">Không tìm thấy từ vựng nào</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-5 py-3 bg-[#161c2e] text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Dữ liệu chuẩn HSK 3.0 Hanban</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
