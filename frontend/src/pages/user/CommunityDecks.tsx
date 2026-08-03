import { useCallback, useEffect, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import { Flame, Loader2, PlusCircle, SearchX, Sparkles } from "lucide-react"
import {
  fetchCommunityDecks,
  saveCommunityDeck,
  type CommunityDeck,
} from "@/lib/api"
import { CommunityDeckCard } from "@/components/vocabulary/CommunityDeckCard"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sortTabs = [
  { key: "popular" as const, label: "Phổ biến", icon: Flame },
  { key: "recent" as const, label: "Gần đây", icon: Sparkles },
]

export default function CommunityDecks() {
  const { getToken, isSignedIn } = useAuth()
  const outletContext = useOutletContext<{ searchQuery?: string }>() || {}
  const searchQuery = outletContext.searchQuery ?? ""
  const [sort, setSort] = useState<"popular" | "recent">("popular")
  const [decks, setDecks] = useState<CommunityDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDecks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetchCommunityDecks({ search: searchQuery, sort, token })
      setDecks(res.decks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải bộ từ cộng đồng")
    } finally {
      setLoading(false)
    }
  }, [getToken, searchQuery, sort])

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  const handleToggleSave = async (deck: CommunityDeck) => {
    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để lưu bộ từ.")
      return
    }

    const token = await getToken()
    if (!token) return

    const nextSaved = !deck.isSaved
    setDecks((prev) =>
      prev.map((item) =>
        item._id === deck._id
          ? {
              ...item,
              isSaved: nextSaved,
              saveCount: Math.max(0, item.saveCount + (nextSaved ? 1 : -1)),
            }
          : item
      )
    )

    try {
      const res = await saveCommunityDeck(token, deck._id, nextSaved)
      setDecks((prev) =>
        prev.map((item) =>
          item._id === deck._id ? { ...item, isSaved: res.isSaved, saveCount: res.saveCount } : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu bộ từ")
      loadDecks()
    }
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">- CỘNG ĐỒNG</span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Bộ từ do người học chia sẻ
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Khám phá, lưu lại hoặc copy các bộ từ hữu ích để học theo cách của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/user/my-decks">
            <Button type="button" variant="outline">Bộ từ của tôi</Button>
          </Link>
          <Link to="/user/create-deck">
            <Button type="button">
              <PlusCircle className="mr-2 h-4 w-4" />
              Tạo bộ từ
            </Button>
          </Link>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {sortTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                sort === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-sm font-semibold">Đang tải bộ từ cộng đồng...</span>
        </div>
      ) : decks.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <CommunityDeckCard key={deck._id} deck={deck} onToggleSave={handleToggleSave} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <SearchX className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-base font-semibold text-muted-foreground">
            Chưa có bộ từ cộng đồng phù hợp
          </p>
          <Link to="/user/create-deck" className="mt-4">
            <Button type="button">Tạo bộ đầu tiên</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
