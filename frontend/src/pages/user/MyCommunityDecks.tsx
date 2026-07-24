import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import { Loader2, PlusCircle } from "lucide-react"
import { fetchMyCommunityDecks, type CommunityDeck } from "@/lib/api"
import { CommunityDeckCard } from "@/components/vocabulary/CommunityDeckCard"
import { Button } from "@/components/ui/button"

export default function MyCommunityDecks() {
  const { getToken, isSignedIn } = useAuth()
  const [decks, setDecks] = useState<CommunityDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDecks = async () => {
      if (!isSignedIn) {
        setLoading(false)
        setError("Bạn cần đăng nhập để xem bộ từ của mình.")
        return
      }

      try {
        const token = await getToken()
        if (!token) throw new Error("Không lấy được phiên đăng nhập")
        const res = await fetchMyCommunityDecks(token)
        setDecks(res.decks)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bộ từ của bạn")
      } finally {
        setLoading(false)
      }
    }

    loadDecks()
  }, [getToken, isSignedIn])

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">- BỘ TỪ CỦA TÔI</span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Quản lý bộ từ cá nhân
          </h1>
        </div>
        <Link to="/user/create-deck">
          <Button type="button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tạo bộ từ
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-3 text-sm font-semibold">Đang tải bộ từ...</span>
        </div>
      ) : decks.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <CommunityDeckCard key={deck._id} deck={deck} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Bạn chưa tạo bộ từ nào.</p>
          <Link to="/user/create-deck" className="mt-4 inline-block">
            <Button type="button">Tạo bộ đầu tiên</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
