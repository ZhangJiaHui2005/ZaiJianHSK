import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Languages, Mic, PenTool, SlidersHorizontal, Loader2, Sparkles, Folder } from 'lucide-react'
import {
  fetchVocabularyStats,
  fetchHskDecks,
  type HskDeck,
  type Hsk3StatsResponse,
} from '@/lib/api'
import { VocabFolderCard } from '@/components/vocabulary/VocabFolderCard'
import { VocabSetCard } from '@/components/vocabulary/VocabSetCard'
import { VocabSetDetailModal } from '@/components/vocabulary/VocabSetDetailModal'
import { Button } from '@/components/ui/button'
import type { VocabFolderItem, VocabSetItem } from '@/data/hskVocabData'

interface VocabularyLibraryProps {
  searchQuery?: string;
}

export type Hsk3FilterKey = 'all' | 'hsk1' | 'hsk2' | 'hsk3' | 'hsk4' | 'hsk5' | 'hsk6' | 'hsk7_9'

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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Notice Banner */}
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-5 py-3 text-sm text-emerald-200">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>
            Thư viện tự động chia thành <strong>{totalDecksCount} bộ bài học HSK 3.0</strong>. Bấm vào bộ bài học để xem chi tiết từ vựng!
          </span>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between pt-2">
        <div>
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
            — KHÁM PHÁ HSK 3.0
          </span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Khám phá Thư viện HSK
          </h1>
        </div>

        {/* Practice Mode Selector Tabs */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-[#161c2e] p-1.5 shrink-0">
          <Button
            type="button"
            variant={activeMode === 'vocab' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('vocab')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeMode === 'vocab'
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="h-4 w-4 mr-1.5" />
            <span>Từ vựng</span>
          </Button>

          <Button
            type="button"
            variant={activeMode === 'speaking' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('speaking')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeMode === 'speaking'
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="h-4 w-4 mr-1.5" />
            <span>Luyện Speaking</span>
          </Button>

          <Button
            type="button"
            variant={activeMode === 'writing' ? 'default' : 'ghost'}
            onClick={() => setActiveMode('writing')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeMode === 'writing'
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="h-4 w-4 mr-1.5" />
            <span>Luyện Hán tự</span>
          </Button>
        </div>
      </div>

      {/* Category Pills & Status Filter Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-y border-slate-800/80 py-4">
        {/* HSK 3.0 Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <Button
                key={cat.id}
                type="button"
                variant={isActive ? 'outline' : 'secondary'}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap h-auto ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'bg-[#161c2e] text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span className="ml-1 text-[10px] opacity-75">({cat.count})</span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Lọc:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'saved' | 'unlearned')}
            className="rounded-xl border border-slate-800 bg-[#161c2e] px-3 py-1.5 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">Tất cả các bộ</option>
            <option value="saved">Đã lưu (Bookmark)</option>
            <option value="unlearned">Chưa hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-emerald-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-sm font-semibold">Đang tải danh sách các bộ bài học HSK...</span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-300">
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
          <Folder className="h-10 w-10 text-slate-500 mb-2" />
          <p className="text-base font-semibold text-slate-400">
            Không tìm thấy bộ bài học HSK nào phù hợp
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setActiveCategory('all')
              setFilterStatus('all')
            }}
            className="mt-4 rounded-xl bg-slate-800 border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      )}

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
