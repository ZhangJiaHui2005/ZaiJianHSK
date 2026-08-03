import { useEffect, useState, useCallback } from 'react'
import { fetchHskDecks, type HskDeck } from '@/lib/api'
import { LearningHome } from '@/components/vocabulary/LearningHome'

export default function LearningHomePage() {
  const [decks, setDecks] = useState<HskDeck[]>([])
  const [totalDecksCount, setTotalDecksCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const loadDecks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchHskDecks({ level: 'all' })
      if (res.success) {
        setDecks(res.decks)
        setTotalDecksCount(res.totalDecks)
      }
    } catch (err) {
      console.error('Failed to fetch HSK decks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      <LearningHome
        decks={decks}
        totalDecksCount={totalDecksCount}
        loading={loading}
      />
    </div>
  )
}
