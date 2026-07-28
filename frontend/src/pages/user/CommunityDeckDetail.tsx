import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import {
  Bookmark,
  GitFork,
  GitBranch,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  Volume2,
  X,
  ArrowRight,
  Flag,
} from "lucide-react"
import {
  createCommunityDeckComment,
  deleteCommunityDeckComment,
  fetchCommunityDeck,
  fetchDeckAncestors,
  fetchCommunityDeckComments,
  fetchDeckForks,
  forkCommunityDeck,
  saveCommunityDeck,
  reportCommunityDeck,
  type CommunityDeck,
  type CommunityDeckComment,
  type VocabularyWord,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

function isVocabularyWord(word: VocabularyWord | string): word is VocabularyWord {
  return typeof word !== "string"
}

export default function CommunityDeckDetail() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()
  const [deck, setDeck] = useState<CommunityDeck | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [comments, setComments] = useState<CommunityDeckComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [commentWorking, setCommentWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Report state
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("spam")
  const [reportDescription, setReportDescription] = useState("")
  const [reportWorking, setReportWorking] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  // Fork / version history state
  const [forks, setForks] = useState<CommunityDeck[]>([])
  const [forksLoading, setForksLoading] = useState(false)
  const [lineage, setLineage] = useState<Array<{ _id: string; title: string; username: string }> | null>(null)
  const [lineageLoading, setLineageLoading] = useState(false)
  const [showLineageModal, setShowLineageModal] = useState(false)

  useEffect(() => {
    const loadDeck = async () => {
      if (!deckId) return

      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        const res = await fetchCommunityDeck(deckId, token)
        setDeck(res.deck)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bộ từ")
      } finally {
        setLoading(false)
      }
    }

    loadDeck()
  }, [deckId, getToken])

  useEffect(() => {
    const loadComments = async () => {
      if (!deckId) return
      setCommentsLoading(true)
      try {
        const token = await getToken()
        const res = await fetchCommunityDeckComments(deckId, token)
        setComments(res.comments)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải thảo luận")
      } finally {
        setCommentsLoading(false)
      }
    }

    loadComments()
  }, [deckId, getToken])

  // Load forks
  useEffect(() => {
    const loadForks = async () => {
      if (!deckId) return
      setForksLoading(true)
      try {
        const token = await getToken()
        const res = await fetchDeckForks(deckId, token)
        setForks(res.forks)
      } catch {
        // silent fail
      } finally {
        setForksLoading(false)
      }
    }
    loadForks()
  }, [deckId, getToken])

  // Load ancestors
  useEffect(() => {
    const loadLineage = async () => {
      if (!deckId) return
      setLineageLoading(true)
      try {
        const token = await getToken()
        const res = await fetchDeckAncestors(deckId, token)
        if (res.lineage.length > 1) {
          setLineage(res.lineage)
        }
      } catch {
        // silent fail
      } finally {
        setLineageLoading(false)
      }
    }
    loadLineage()
  }, [deckId, getToken])

  const handleSave = async () => {
    if (!deck) return
    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để lưu bộ từ.")
      return
    }

    const token = await getToken()
    if (!token) return
    const nextSaved = !deck.isSaved
    setDeck({
      ...deck,
      isSaved: nextSaved,
      saveCount: Math.max(0, deck.saveCount + (nextSaved ? 1 : -1)),
    })

    try {
      const res = await saveCommunityDeck(token, deck._id, nextSaved)
      setDeck((current) => current && { ...current, isSaved: res.isSaved, saveCount: res.saveCount })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu bộ từ")
    }
  }

  const handleFork = async () => {
    if (!deck) return
    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để copy bộ từ.")
      return
    }

    setWorking(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("Không lấy được phiên đăng nhập")
      const res = await forkCommunityDeck(token, deck._id)
      navigate(`/user/community/${res.deck._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể copy bộ từ")
    } finally {
      setWorking(false)
    }
  }

  const handleComment = async () => {
    if (!deck || !commentText.trim()) return
    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để tham gia thảo luận.")
      return
    }

    setCommentWorking(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("Không lấy được phiên đăng nhập")
      const res = await createCommunityDeckComment(token, deck._id, commentText.trim())
      setComments((current) => [res.comment, ...current])
      setDeck((current) => current && { ...current, commentCount: res.commentCount })
      setCommentText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng bình luận")
    } finally {
      setCommentWorking(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!deck) return
    setCommentWorking(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("Không lấy được phiên đăng nhập")
      const res = await deleteCommunityDeckComment(token, deck._id, commentId)
      setComments((current) => current.filter((comment) => comment._id !== commentId))
      setDeck((current) => current && { ...current, commentCount: res.commentCount })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xoá bình luận")
    } finally {
      setCommentWorking(false)
    }
  }

  const handleReport = async () => {
    if (!deck) return
    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để báo cáo bộ từ.")
      return
    }

    setReportWorking(true)
    setReportSuccess(false)
    try {
      const token = await getToken()
      if (!token) throw new Error("Không lấy được phiên đăng nhập")
      await reportCommunityDeck(token, deck._id, reportReason, reportDescription.trim() || undefined)
      setReportSuccess(true)
      setTimeout(() => {
        setShowReportDialog(false)
        setReportSuccess(false)
        setReportReason("spam")
        setReportDescription("")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể báo cáo bộ từ")
    } finally {
      setReportWorking(false)
    }
  }

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "zh-CN"
      window.speechSynthesis.speak(utterance)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3 text-sm font-semibold">Đang tải bộ từ...</span>
      </div>
    )
  }

  if (!deck) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
        {error || "Không tìm thấy bộ từ"}
      </div>
    )
  }

  const ownerName = typeof deck.ownerId === "string" ? "Người học" : deck.ownerId.username
  const words = deck.wordIds.filter(isVocabularyWord)

  return (
    <div className="mx-auto flex flex-col gap-6 pb-12">
      {/* Report dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo cáo bộ từ</DialogTitle>
            <DialogDescription>
              Báo cáo bộ từ này nếu bạn cho rằng nó vi phạm quy tắc cộng đồng.
            </DialogDescription>
          </DialogHeader>
          {reportSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Flag className="h-8 w-8 text-green-500" />
              <p className="font-semibold text-green-600">Báo cáo thành công!</p>
              <p className="text-sm text-muted-foreground">
                Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lý do báo cáo</label>
                <Select value={reportReason} onValueChange={(value) => value && setReportReason(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate">Nội dung không phù hợp</SelectItem>
                    <SelectItem value="wrong_topic">Sai chủ đề</SelectItem>
                    <SelectItem value="duplicate">Trùng lặp</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả thêm (không bắt buộc)</label>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Cung cấp thêm thông tin chi tiết..."
                  maxLength={500}
                />
                <span className="text-xs text-muted-foreground">{reportDescription.length}/500</span>
              </div>
              <Button onClick={handleReport} disabled={reportWorking} className="w-full">
                {reportWorking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="mr-2 h-4 w-4" />
                )}
                Gửi báo cáo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lineage modal */}
      <Dialog open={showLineageModal} onOpenChange={setShowLineageModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lịch sử phiên bản</DialogTitle>
            <DialogDescription>
              Chuỗi fork từ bộ từ gốc đến phiên bản hiện tại.
            </DialogDescription>
          </DialogHeader>
          {lineageLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : lineage && lineage.length > 1 ? (
            <div className="flex flex-col gap-2 py-4">
              {lineage.map((item, index) => (
                <div key={item._id}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/user/community/${item._id}`}
                        className="text-sm font-semibold hover:text-primary"
                        onClick={() => setShowLineageModal(false)}
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.username}</p>
                    </div>
                    {item._id === deck._id && (
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        Hiện tại
                      </Badge>
                    )}
                  </div>
                  {index < lineage.length - 1 && (
                    <div className="ml-4 flex items-center py-1">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="ml-1 text-[10px] text-muted-foreground">fork</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Không có lịch sử fork.</p>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/user/community" className="text-sm font-semibold text-primary hover:underline">
            Quay lại cộng đồng
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">{deck.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tạo bởi <span className="font-semibold text-foreground">{ownerName}</span>
            {deck.sourceDeckId && !lineageLoading && lineage && lineage.length > 1 && (
              <span>
                {" "}· Forked from{" "}
                <Link
                  to={`/user/community/${lineage[0]._id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {lineage[0].title}
                </Link>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave}>
            <Bookmark className={`mr-2 h-4 w-4 ${deck.isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
            {deck.isSaved ? "Đã lưu" : "Lưu"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowReportDialog(true)} title="Báo cáo bộ từ">
            <Flag className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
          <Button onClick={handleFork} disabled={working}>
            {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitFork className="mr-2 h-4 w-4" />}
            Copy bộ từ
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Fork / Version history info card */}
      {(deck.sourceDeckId || deck.forkCount > 0 || (lineage && lineage.length > 1)) && (
        <Card className="border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 text-sm">
              {deck.sourceDeckId && lineage && lineage.length > 1 && (
                <p>
                  Được fork từ{" "}
                  <Link
                    to={`/user/community/${lineage[0]._id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {lineage[0].title}
                  </Link>{" "}
                  bởi {lineage[0].username}
                </p>
              )}
              {deck.forkCount > 0 && (
                <p className={deck.sourceDeckId ? "mt-1" : ""}>
                  <span className="font-semibold">{deck.forkCount}</span> bản sao từ bộ này
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLineageModal(true)}
              disabled={lineageLoading}
            >
              {lineageLoading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <GitBranch className="mr-1.5 h-3.5 w-3.5" />
              )}
              Xem lịch sử
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">{deck.description || "Bộ từ này chưa có mô tả."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">{words.length} từ</Badge>
          <Badge variant="outline">{deck.saveCount} lượt lưu</Badge>
          <Badge variant="outline">{deck.forkCount} lượt copy</Badge>
          <Badge variant="outline">{deck.commentCount} bình luận</Badge>
          {deck.status === "draft" && <Badge variant="destructive">Bản nháp</Badge>}
          {deck.hskLevels.map((level) => (
            <Badge key={level} variant="secondary">
              {level.replace("newest-", "HSK ")}
            </Badge>
          ))}
          {deck.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Forks list */}
      {forks.length > 0 && (
        <section>
          <div className="flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-black">Bản sao ({forks.length})</h2>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forks.map((fork) => {
              const forkOwner = typeof fork.ownerId === "string" ? "Người học" : fork.ownerId.username
              return (
                <Link
                  key={fork._id}
                  to={`/user/community/${fork._id}`}
                  className="rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
                >
                  <p className="line-clamp-1 text-sm font-bold">{fork.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">bởi {forkOwner}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      {fork.saveCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {fork.forkCount}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2.5">
        {words.length > 0 ? (
          words.map((word, index) => (
            <div
              key={word._id}
              className="flex items-center justify-between rounded-xl border bg-card p-3.5 transition hover:bg-accent/50"
            >
              <div className="flex items-center gap-4">
                <span className="w-7 shrink-0 text-center text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xl font-black">{word.simplified}</span>
                    {word.traditional && word.traditional !== word.simplified && (
                      <span className="text-xs text-muted-foreground">({word.traditional})</span>
                    )}
                    <span className="text-sm font-semibold text-primary">[{word.pinyin}]</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{word.meanings.join(", ")}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => playAudio(word.simplified)} title="Nghe phát âm">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            Bộ từ này chưa có từ nào.
          </div>
        )}
      </div>

      <section className="border-t pt-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black">Thảo luận ({deck.commentCount})</h2>
        </div>

        <div className="mt-4 rounded-lg border bg-card p-4">
          <Textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            maxLength={1000}
            placeholder={isSignedIn ? "Chia sẻ mẹo học hoặc đặt câu hỏi về bộ từ này..." : "Đăng nhập để tham gia thảo luận"}
            disabled={!isSignedIn || commentWorking}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{commentText.length}/1000</span>
            <Button onClick={handleComment} disabled={!commentText.trim() || !isSignedIn || commentWorking}>
              {commentWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Bình luận
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {commentsLoading ? (
            <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thảo luận...
            </div>
          ) : comments.length ? (
            comments.map((comment) => {
              const authorName = typeof comment.authorId === "string" ? "Người học" : comment.authorId.username
              return (
                <article key={comment._id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{authorName}</p>
                      <time className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString("vi-VN")}
                      </time>
                    </div>
                    {comment.canManage && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Xoá bình luận"
                        onClick={() => handleDeleteComment(comment._id)}
                        disabled={commentWorking}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{comment.content}</p>
                </article>
              )
            })
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có bình luận nào. Hãy mở đầu cuộc thảo luận.</p>
          )}
        </div>
      </section>
    </div>
  )
}

