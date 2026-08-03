import { Link } from "react-router-dom"
import { Bookmark, GitFork, MessageCircle, Star, UserRound, ShieldCheck, Sparkles } from "lucide-react"
import type { CommunityDeck } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface CommunityDeckCardProps {
  deck: CommunityDeck
  onToggleSave?: (deck: CommunityDeck) => void
}

function getOwnerName(deck: CommunityDeck) {
  return typeof deck.ownerId === "string" ? "Người học" : deck.ownerId.username
}

export function CommunityDeckCard({ deck, onToggleSave }: CommunityDeckCardProps) {
  const wordCount = deck.wordIds.length

  return (
    <Card className="flex min-h-64 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
      <CardHeader className="space-y-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              <span className="truncate">{getOwnerName(deck)}</span>
            </div>
            <CardTitle className="mt-2 line-clamp-2 text-base font-black leading-snug">
              <Link to={`/user/community/${deck._id}`} className="hover:text-primary">
                {deck.title}
              </Link>
            </CardTitle>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1">
            {deck.isOfficial && (
              <Badge variant="default" className="gap-1 bg-blue-600 text-white text-[10px] px-2 py-0">
                <ShieldCheck className="h-3 w-3" />
                Official
              </Badge>
            )}
            {deck.isFeatured && (
              <Badge variant="secondary" className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0">
                <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
                Featured
              </Badge>
            )}
            {!deck.isOfficial && !deck.isFeatured && deck.saveCount >= 5 && (
              <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 text-[10px] px-2 py-0">
                <Star className="h-3 w-3 fill-amber-500" />
                Nổi bật
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleSave?.(deck)}
              className={`h-8 w-8 shrink-0 rounded-lg ${
                deck.isSaved ? "bg-amber-500/10 text-amber-500" : "text-muted-foreground"
              }`}
              title={deck.isSaved ? "Bỏ lưu" : "Lưu bộ từ"}
            >
              <Bookmark className={`h-4 w-4 ${deck.isSaved ? "fill-amber-500" : ""}`} />
            </Button>
          </div>
        </div>

        <p className="line-clamp-3 min-h-12 text-sm text-muted-foreground">
          {deck.description || "Bộ từ cộng đồng chưa có mô tả."}
        </p>
      </CardHeader>

      <CardContent className="mt-4 flex flex-wrap gap-1.5 p-0">
        {deck.hskLevels.slice(0, 3).map((level) => (
          <Badge key={level} variant="secondary" className="text-[10px]">
            {level.replace("newest-", "HSK ")}
          </Badge>
        ))}
        {deck.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px]">
            #{tag}
          </Badge>
        ))}
      </CardContent>

      <CardFooter className="mt-5 flex items-center justify-between border-t p-0 pt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{wordCount} từ</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Bookmark className="h-3.5 w-3.5" />
            {deck.saveCount}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" />
            {deck.forkCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {deck.commentCount}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
