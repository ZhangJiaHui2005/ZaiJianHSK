import { useUser } from "@clerk/clerk-react"
import { Link } from "react-router-dom"
import {
  Flame,
  TrendingUp,
  Target,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { HskDeck } from "@/lib/api"

interface LearningHomeProps {
  decks: HskDeck[]
  totalDecksCount: number
  loading: boolean
}

export function LearningHome({ decks, totalDecksCount, loading }: LearningHomeProps) {
  const { user } = useUser()

  // Quá trình học: các chỉ số tạm thời hiển thị dựa trên dữ liệu deck có sẵn
  const totalWords = decks.reduce((sum, d) => sum + d.totalWords, 0)
  const currentlyLearning = decks.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Lời chào */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Xin chào, {user?.username || user?.firstName || "Học viên"}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy tiếp tục hành trình chinh phục HSK của bạn hôm nay.
        </p>
      </div>

      {/* Quá trình học */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">0 ngày</p>
              <p className="text-xs font-medium text-muted-foreground">Chuỗi ngày học</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{totalWords}</p>
              <p className="text-xs font-medium text-muted-foreground">Từ vựng đang học</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{totalDecksCount}</p>
              <p className="text-xs font-medium text-muted-foreground">Bộ bài học HSK</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bài đang học */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Bài đang học</h2>
          </div>
          <Link to="/user/library">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold text-primary">
              Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="animate-pulse border-border/70 bg-muted/30">
                <CardContent className="h-28 p-4" />
              </Card>
            ))}
          </div>
        ) : currentlyLearning.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyLearning.map((deck) => (
              <Card
                key={deck.id}
                className="group border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Badge variant="secondary" className="mb-2 text-[10px] font-bold">
                        {deck.hskLevel}
                      </Badge>
                      <h3 className="truncate text-sm font-bold text-foreground">{deck.title}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {deck.subtitle}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {deck.totalWords} từ
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {deck.newWordsCount} mới
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/70 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-muted-foreground">
                Bạn chưa có bài học nào đang học
              </p>
              <Link to="/user/library">
                <Button size="sm" className="mt-1">Khám phá bộ bài học</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

export default LearningHome
