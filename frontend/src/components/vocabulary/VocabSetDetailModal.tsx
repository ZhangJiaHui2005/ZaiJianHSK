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
  deck: HskDeck | null
  isOpen: boolean
  onClose: () => void
  onStartLearn?: (deckId: string) => void
}

export const VocabSetDetailModal: React.FC<VocabSetDetailModalProps> = ({
  deck,
  isOpen,
  onClose,
  onStartLearn,
}) => {
  const [words, setWords] = useState<VocabularyWord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !deck) return

    const loadWords = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchDeckWords({
          levelKey: deck.levelKey,
          page: deck.page,
          limit: deck.limit,
          search: searchQuery,
        })
        if (res.success) {
          setWords(res.words)
        } else {
          setError('API tra ve loi')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b p-5 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold">{deck.title}</DialogTitle>
                <HskBadge level={deck.hskLevel} />
              </div>
              <DialogDescription className="text-xs mt-0.5">
                {loading ? 'Dang tai...' : `Danh sach ${words.length} / ${deck.totalWords} tu vung HSK 3.0`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-b bg-muted/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tim tu (Pinyin, Chu Han, Nghia)..."
              className="w-full pl-9"
            />
          </div>
          <Button onClick={() => onStartLearn?.(deck.id)} disabled={words.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            <span>BAT DAU HOC TU MOI</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-primary">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="ml-3 text-sm font-semibold">Dang tai danh sach tu vung...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-destructive">
              <p className="text-sm font-semibold">Loi tai du lieu</p>
              <p className="text-xs mt-1 text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setSearchQuery('')}>
                Thu lai
              </Button>
            </div>
          ) : words.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {words.map((w, idx) => (
                <div
                  key={w._id || idx}
                  className="flex items-center justify-between rounded-xl border bg-card p-3.5 transition-all hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                      {(deck.page - 1) * deck.limit + idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black tracking-wide">{w.simplified}</span>
                        {w.traditional && w.traditional !== w.simplified && (
                          <span className="text-xs font-medium text-muted-foreground">
                            ({w.traditional})
                          </span>
                        )}
                        <span className="text-sm font-semibold text-primary">[{w.pinyin}]</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {w.meanings.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {w.radical && (
                      <Badge variant="outline" className="hidden sm:inline-flex text-muted-foreground">
                        Bo: {w.radical}
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => playAudio(w.simplified)} title="Nghe phat am">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Khong tim thay tu vung</p>
              <p className="text-xs mt-1">
                {searchQuery ? 'Thu tu khoa khac' : 'Bo bai nay chua co du lieu'}
              </p>
              {searchQuery && (
                <Button variant="link" size="sm" className="mt-2" onClick={() => setSearchQuery('')}>
                  Xoa bo loc
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3 bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Du lieu chuan HSK 3.0</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Dong
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}