import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Languages, Mic, PenTool, SlidersHorizontal, Loader2, Sparkles, Folder, Volume2, Search, ChevronDown, List } from 'lucide-react'
import {
  fetchVocabularyStats,
  fetchHskDecks,
  fetchVocabularyByLevel,
  type HskDeck,
  type Hsk3StatsResponse,
  type VocabLevelGroup,
} from '@/lib/api'
import { VocabFolderCard } from '@/components/vocabulary/VocabFolderCard'
import { VocabSetCard } from '@/components/vocabulary/VocabSetCard'
import { VocabSetDetailModal } from '@/components/vocabulary/VocabSetDetailModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import type { VocabFolderItem, VocabSetItem } from '@/data/hskVocabData'

interface VocabularyLibraryProps {
  searchQuery?: string;
}

export type Hsk3FilterKey = 'all' | 'hsk1' | 'hsk2' | 'hsk3' | 'hsk4' | 'hsk5' | 'hsk6' | 'hsk7_9'

type VocabWordItem = VocabLevelGroup['words'][number]

const WORDS_PAGE_SIZE = 60

// Memoized row so typing in the search box / opening other accordion items
// doesn't re-render every single word row already on screen.
const WordRow = React.memo(function WordRow({
  word,
  onPlayAudio,
}: {
  word: VocabWordItem
  onPlayAudio: (text: string) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg font-bold text-foreground shrink-0">
          {word.simplified}
        </span>
        {word.traditional && word.traditional !== word.simplified && (
          <span className="text-xs text-muted-foreground shrink-0">
            ({word.traditional})
          </span>
        )}
        <span className="text-sm text-primary font-semibold shrink-0">
          [{word.pinyin}]
        </span>
        <span className="text-xs text-muted-foreground truncate hidden sm:inline">
          {word.meanings.slice(0, 2).join(', ')}
          {word.meanings.length > 2 && '...'}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onPlayAudio(word.simplified)
        }}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
        title="Nghe phát âm"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </div>
  )
})

export const VocabularyLibrary: React.FC<VocabularyLibraryProps> = ({
  searchQuery: propSearchQuery,
}) => {
  const outletContext = useOutletContext<{ searchQuery?: string }>() || {}
  const searchQuery = propSearchQuery ?? outletContext.searchQuery ?? ''

  const [activeCategory, setActiveCategory] = useState<Hsk3FilterKey>('all')
  const [activeMode, setActiveMode] = useState<'vocab' | 'speaking' | 'writing'>('vocab')
  const [filterStatus, setFilterStatus] = useState<'all' | 'saved' | 'unlearned'>('all')

  // Real data state from Backend API
  const [stats, setStats] = useState<Hsk3StatsResponse['hsk3Stats'] | null>(null)
  const [decks, setDecks] = useState<HskDeck[]>([])
  const [totalDecksCount, setTotalDecksCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Selected deck for detail modal
  const [selectedDeck, setSelectedDeck] = useState<HskDeck | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Browse All Words by Level
  const [vocabByLevel, setVocabByLevel] = useState<VocabLevelGroup[]>([])
  const [loadingVocabByLevel, setLoadingVocabByLevel] = useState(false)
  const [showBrowseWords, setShowBrowseWords] = useState(false)
  const [browseSearch, setBrowseSearch] = useState('')
  const [debouncedBrowseSearch, setDebouncedBrowseSearch] = useState('')
  const [expandedLevel, setExpandedLevel] = useState<string>('')
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})

  // Debounce the search box so filtering thousands of words doesn't run on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBrowseSearch(browseSearch), 250)
    return () => clearTimeout(timer)
  }, [browseSearch])

  // Reset pagination whenever the search term changes so old counts don't carry over
  useEffect(() => {
    setVisibleCounts({})
  }, [debouncedBrowseSearch])

  // 1. Fetch HSK 3.0 statistics from Backend
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchVocabularyStats()
        if (res.success) {
          setStats(res.hsk3Stats)
        }
      } catch (err) {
        console.error('Failed to load HSK 3.0 stats:', err)
      }
    }
    loadStats()
  }, [])

  // 2. Fetch HSK Decks from Backend API
  const loadDecks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const levelParam = activeCategory === 'hsk7_9' ? '7' : activeCategory
      const res = await fetchHskDecks({
        level: levelParam,
        search: searchQuery,
      })

      if (res.success) {
        setDecks(res.decks)
        setTotalDecksCount(res.totalDecks)
      }
    } catch (err) {
      console.error('Failed to fetch HSK decks:', err)
      setError('Không thể kết nối đến máy chủ MongoDB API. Hãy kiểm tra backend server.')
    } finally {
      setLoading(false)
    }
  }, [activeCategory, searchQuery])

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  // 3. Fetch vocabulary by level for Browse All Words section
  const loadVocabByLevel = useCallback(async () => {
    setLoadingVocabByLevel(true)
    try {
      const res = await fetchVocabularyByLevel()
      if (res.success) {
        setVocabByLevel(res.levels)
      }
    } catch (err) {
      console.error('Failed to fetch vocabulary by level:', err)
    } finally {
      setLoadingVocabByLevel(false)
    }
  }, [])

  const toggleBrowseWords = () => {
    const next = !showBrowseWords
    setShowBrowseWords(next)
    if (next && vocabByLevel.length === 0) {
      loadVocabByLevel()
    }
  }

  // Category filters config with HSK 3.0 tags & counts
  const categories: Array<{ id: Hsk3FilterKey; label: string; count?: number; badge?: string }> = [
    { id: 'all', label: 'Tất cả' },
    { id: 'hsk1', label: 'HSK 1 (3.0)', count: stats?.hsk1 },
    { id: 'hsk2', label: 'HSK 2 (3.0)', count: stats?.hsk2 },
    { id: 'hsk3', label: 'HSK 3 (3.0)', count: stats?.hsk3 },
    { id: 'hsk4', label: 'HSK 4 (3.0)', count: stats?.hsk4 },
    { id: 'hsk5', label: 'HSK 5 (3.0)', count: stats?.hsk5 },
    { id: 'hsk6', label: 'HSK 6 (3.0)', count: stats?.hsk6 },
    { id: 'hsk7_9', label: 'HSK 7 - 9 (3.0)', count: stats?.hsk7_9 },
  ]

  // Folder Card representation for active level
  const folderCard: VocabFolderItem | null = activeCategory !== 'all' ? {
    id: `folder-${activeCategory}`,
    type: 'folder',
    title: `Bộ bài học tổng hợp ${activeCategory.toUpperCase().replace('_', '-')}`,
    hskLevel: activeCategory.toUpperCase().replace('_', '-'),
    subTags: ['Phần 1', 'Phần 2', 'Phần 3'],
    extraCountText: `${totalDecksCount} bộ bài học`,
    category: activeCategory as any,
  } : null

  const handleOpenDeckModal = (deck: HskDeck) => {
    setSelectedDeck(deck)
    setIsModalOpen(true)
  }

  const playAudio = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const getVisibleCount = useCallback(
    (levelKey: string) => visibleCounts[levelKey] ?? WORDS_PAGE_SIZE,
    [visibleCounts]
  )

  const showMoreWords = (levelKey: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [levelKey]: (prev[levelKey] ?? WORDS_PAGE_SIZE) + WORDS_PAGE_SIZE,
    }))
  }

  const levelColors: Record<string, string> = {
    'newest-1': 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
    'newest-2': 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400',
    'newest-3': 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400',
    'newest-4': 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400',
    'newest-5': 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400',
    'newest-6': 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400',
    'newest-7': 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-400',
    'unclassified': 'border-border bg-muted text-muted-foreground',
  }

  // Filter vocab levels by search query (memoized so it only re-runs when
  // the actual data or the debounced search term changes, not on every render)
  const filteredLevels = useMemo(() => {
    const q = debouncedBrowseSearch.trim().toLowerCase()
    if (!q) return vocabByLevel
    return vocabByLevel
      .map((level) => ({
        ...level,
        words: level.words.filter((w) => {
          return (
            w.simplified.includes(q) ||
            w.pinyin.toLowerCase().includes(q) ||
            w.meanings.some((m) => m.toLowerCase().includes(q))
          )
        }),
      }))
      .filter((level) => level.words.length > 0)
  }, [vocabByLevel, debouncedBrowseSearch])

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Notice Banner */}
      <Card className="border border-primary/20 bg-primary/5 px-5 py-3 shadow-none">
        <div className="flex items-center gap-3 text-sm text-foreground">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <span>
            Thư viện tự động chia thành <strong>{totalDecksCount} bộ bài học HSK 3.0</strong>. Bấm vào bộ bài học để xem chi tiết từ vựng!
          </span>
        </div>
      </Card>

      {/* Main Section Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pt-2">
        <div>
          <span className="text-xs font-bold tracking-wider text-primary uppercase">
            — KHÁM PHÁ HSK 3.0
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Khám phá Thư viện HSK
          </h1>
        </div>

        {/* Practice Mode Selector Tabs */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shrink-0 shadow-sm">
          <Button
            type="button"
            variant={activeMode === 'vocab' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('vocab')}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          >
            <Languages className="h-4 w-4 mr-1.5" />
            <span>Từ vựng</span>
          </Button>

          <Button
            type="button"
            variant={activeMode === 'speaking' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('speaking')}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          >
            <Mic className="h-4 w-4 mr-1.5" />
            <span>Luyện Speaking</span>
          </Button>

          <Button
            type="button"
            variant={activeMode === 'writing' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('writing')}
            className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          >
            <PenTool className="h-4 w-4 mr-1.5" />
            <span>Luyện Hán tự</span>
          </Button>
        </div>
      </div>

      {/* Category Pills & Status Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-border py-4">
        {/* HSK 3.0 Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <Button
                key={cat.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setActiveCategory(cat.id)}
                className="rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap h-auto"
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span className="ml-1 text-[10px] opacity-80">({cat.count})</span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Lọc:</span>
          <Select
            value={filterStatus}
            onValueChange={(val: string | null) => {
              if (val) setFilterStatus(val as 'all' | 'saved' | 'unlearned')
            }}
          >
            <SelectTrigger className="w-44 h-9 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Tất cả các bộ" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Tất cả các bộ</SelectItem>
              <SelectItem value="saved">Đã lưu (Bookmark)</SelectItem>
              <SelectItem value="unlearned">Chưa hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-sm font-semibold">Đang tải danh sách các bộ bài học HSK...</span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid of Decks / Sets */}
      {!loading && !error && decks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Main Folder Card if filtered by specific HSK level */}
          {folderCard && (
            <VocabFolderCard
              folder={folderCard}
              onOpenFolder={() => {
                if (decks.length > 0) handleOpenDeckModal(decks[0])
              }}
            />
          )}

          {/* Render Set Cards for each Deck */}
          {decks.map((deck) => {
            const setItem: VocabSetItem = {
              id: deck.id,
              type: 'deck',
              title: deck.title,
              hskLevel: deck.hskLevel,
              totalWords: deck.totalWords,
              newWordsCount: deck.newWordsCount,
              reviewWordsCount: deck.reviewWordsCount,
              isBookmarked: deck.isBookmarked,
              category: deck.category as any,
              subtitle: deck.subtitle,
            }

            return (
              <div key={deck.id} onClick={() => handleOpenDeckModal(deck)}>
                <VocabSetCard
                  set={setItem}
                  onStartLearn={() => handleOpenDeckModal(deck)}
                  onStartReview={() => handleOpenDeckModal(deck)}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && decks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Folder className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-base font-semibold text-muted-foreground">
            Không tìm thấy bộ bài học HSK nào phù hợp
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setActiveCategory('all')
              setFilterStatus('all')
            }}
            className="mt-4"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      )}

      {/* ============ BROWSE ALL WORDS SECTION ============ */}
      <div className="border-t border-border pt-6 mt-6">
        <button
          onClick={toggleBrowseWords}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <List className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-foreground">
                Xem tất cả từ vựng theo trình độ
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vocabByLevel.length > 0
                  ? `${vocabByLevel.reduce((sum, l) => sum + l.count, 0)} từ vựng được phân loại theo HSK`
                  : 'Nhấn để tải danh sách tất cả từ vựng trong thư viện'}
              </p>
            </div>
          </div>
          <ChevronDown className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            showBrowseWords && 'rotate-180'
          )} />
        </button>

        {showBrowseWords && (
          <div className="mt-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                placeholder="Tìm từ (Chữ Hán, Pinyin, Nghĩa)..."
                className="w-full pl-9"
              />
            </div>

            {loadingVocabByLevel ? (
              <div className="flex items-center justify-center py-8 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm">Đang tải danh sách từ vựng...</span>
              </div>
            ) : filteredLevels.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                value={expandedLevel}
                onValueChange={setExpandedLevel}
                className="w-full"
              >
                {filteredLevels.map((level) => (
                  <AccordionItem
                    key={level.levelKey}
                    value={level.levelKey}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-accent/30 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'rounded-full px-3 py-1 text-xs font-bold border',
                          levelColors[level.levelKey] || 'border-border bg-muted text-muted-foreground'
                        )}>
                          {level.levelLabel}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {level.words.length} từ
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-[420px] overflow-y-auto pr-1">
                        <div className="flex flex-col gap-1.5 px-1">
                          {level.words.slice(0, getVisibleCount(level.levelKey)).map((word) => (
                            <WordRow key={word._id} word={word} onPlayAudio={playAudio} />
                          ))}
                        </div>
                      </div>
                      {level.words.length > getVisibleCount(level.levelKey) && (
                        <div className="flex justify-center pt-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => showMoreWords(level.levelKey)}
                            className="text-xs text-muted-foreground"
                          >
                            Xem thêm (còn {level.words.length - getVisibleCount(level.levelKey)} từ)
                          </Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {vocabByLevel.length > 0
                  ? `Không tìm thấy từ nào phù hợp với "${browseSearch}"`
                  : 'Không có dữ liệu từ vựng.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Word List Detail Modal */}
      <VocabSetDetailModal
        deck={selectedDeck}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartLearn={(deckId) => {
          console.log('Bắt đầu học deck:', deckId)
        }}
      />
    </div>
  )
}

export default VocabularyLibrary