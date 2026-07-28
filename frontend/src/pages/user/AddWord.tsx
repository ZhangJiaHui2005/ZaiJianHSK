import { useState, useRef } from "react"
import { useAuth } from "@clerk/clerk-react"
import {
  PlusCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  BookOpen,
  Tags,
  Sparkles,
  ArrowLeft,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const HSK_LEVEL_OPTIONS = [
  { value: "newest-1", label: "HSK 1" },
  { value: "newest-2", label: "HSK 2" },
  { value: "newest-3", label: "HSK 3" },
  { value: "newest-4", label: "HSK 4" },
  { value: "newest-5", label: "HSK 5" },
  { value: "newest-6", label: "HSK 6" },
  { value: "newest-7", label: "HSK 7-9" },
]

interface PendingResponse {
  message: string
  pending: {
    _id: string
    simplified: string
    pinyin: string
    meanings: string[]
    status: string
    createdAt: string
  }
}

interface Submission {
  simplified: string
  pinyin: string
  meanings: string[]
  createdAt: string
  status: string
}

export default function AddWord() {
  const { getToken, isSignedIn } = useAuth()
  const simplifiedRef = useRef<HTMLInputElement>(null)

  // Form fields
  const [simplified, setSimplified] = useState("")
  const [traditional, setTraditional] = useState("")
  const [pinyin, setPinyin] = useState("")
  const [meaningInput, setMeaningInput] = useState("")
  const [meanings, setMeanings] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    id: string
    message: string
  } | null>(null)

  // My submissions
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
  const [showMySubmissions, setShowMySubmissions] = useState(false)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const addMeaning = () => {
    const trimmed = meaningInput.trim()
    if (trimmed && !meanings.includes(trimmed)) {
      setMeanings([...meanings, trimmed])
      setMeaningInput("")
    }
  }

  const removeMeaning = (idx: number) => {
    setMeanings(meanings.filter((_, i) => i !== idx))
  }

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  const resetForm = () => {
    setSimplified("")
    setTraditional("")
    setPinyin("")
    setMeanings([])
    setSelectedLevels([])
    setMeaningInput("")
    setError(null)
    setSuccess(null)
    simplifiedRef.current?.focus()
  }

  const fetchMySubmissions = async () => {
    const token = await getToken()
    if (!token) return

    setLoadingSubmissions(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/vocabulary/pending/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Failed to fetch submissions")
      const data = await res.json()
      setMySubmissions(
        (data.submissions || []).map((s: any) => ({
          simplified: s.simplified,
          pinyin: s.pinyin,
          meanings: s.meanings || [],
          createdAt: s.createdAt,
          status: s.status,
        }))
      )
    } catch (err) {
      console.error("Failed to fetch submissions:", err)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSignedIn) {
      setError("Vui lòng đăng nhập để gửi từ vựng.")
      return
    }

    // Validate
    if (!simplified.trim()) {
      setError("Chữ Hán (Giản thể) không được để trống.")
      return
    }
    if (!pinyin.trim()) {
      setError("Pinyin không được để trống.")
      return
    }
    if (meanings.length === 0) {
      setError("Ít nhất một nghĩa là bắt buộc.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Authentication failed. Please sign in again.")
      }

      const res = await fetch(`${API_BASE_URL}/api/vocabulary/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          simplified: simplified.trim(),
          traditional: traditional.trim(),
          pinyin: pinyin.trim(),
          meanings,
          level: selectedLevels,
        }),
      })

      const data: PendingResponse & { error?: string } = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit vocabulary")
      }

      setSuccess({
        id: data.pending._id,
        message: `"${data.pending.simplified}" đã được gửi để admin xem xét.`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            Đã duyệt
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>
      default:
        return (
          <Badge variant="secondary">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Chờ duyệt
          </Badge>
        )
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold tracking-wider text-primary uppercase">
          — ĐÓNG GÓP TỪ VỰNG
        </span>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Thêm từ mới
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đóng góp từ vựng tiếng Trung vào thư viện chung. Sau khi gửi, admin sẽ
          xem xét và duyệt từ của bạn trong thời gian sớm nhất.
        </p>
      </div>

      {success ? (
        /* === SUCCESS STATE === */
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Gửi thành công! 🎉
              </CardTitle>
              <CardDescription className="mt-1.5 max-w-sm">
                {success.message}
              </CardDescription>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={resetForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm từ khác
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetForm()
                  fetchMySubmissions()
                  setShowMySubmissions(true)
                }}
                className="text-muted-foreground"
              >
                <History className="mr-2 h-4 w-4" />
                Xem từ đã gửi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : showMySubmissions ? (
        /* === MY SUBMISSIONS === */
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            onClick={() => setShowMySubmissions(false)}
            className="self-start text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Từ vựng đã gửi
              </CardTitle>
              <CardDescription>
                Danh sách các từ bạn đã đóng góp và trạng thái duyệt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : mySubmissions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Bạn chưa gửi từ vựng nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {mySubmissions.map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-foreground">
                              {sub.simplified}
                            </span>
                            <span className="text-sm text-primary">
                              [{sub.pinyin}]
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {sub.meanings.slice(0, 2).map((m, j) => (
                              <span key={j} className="text-xs text-muted-foreground">
                                {m}{j < Math.min(sub.meanings.length, 2) - 1 ? "," : ""}
                              </span>
                            ))}
                            {sub.meanings.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{sub.meanings.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {statusBadge(sub.status)}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMySubmissions}
                disabled={loadingSubmissions}
                className="mt-3 w-full text-muted-foreground"
              >
                {loadingSubmissions ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : null}
                Làm mới
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* === FORM === */
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Chinese & Pinyin section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Thông tin từ vựng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Simplified Chinese */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Chữ Hán (Giản thể) <span className="text-destructive">*</span>
                </label>
                <Input
                  ref={simplifiedRef}
                  value={simplified}
                  onChange={(e) => setSimplified(e.target.value)}
                  placeholder="Ví dụ: 你好"
                  className="text-lg"
                  autoFocus
                />
              </div>

              {/* Traditional Chinese */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Chữ Hán (Phồn thể)
                  <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
                </label>
                <Input
                  value={traditional}
                  onChange={(e) => setTraditional(e.target.value)}
                  placeholder="Ví dụ: 你好 (nếu khác với giản thể)"
                />
              </div>

              {/* Pinyin */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
                  Pinyin <span className="text-destructive">*</span>
                </label>
                <Input
                  value={pinyin}
                  onChange={(e) => setPinyin(e.target.value)}
                  placeholder="Ví dụ: nǐ hǎo"
                />
              </div>
            </CardContent>
          </Card>

          {/* Meanings section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tags className="h-4 w-4 text-primary" />
                Nghĩa của từ <span className="text-destructive">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={meaningInput}
                  onChange={(e) => setMeaningInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addMeaning())
                  }
                  placeholder="Nhập nghĩa và nhấn Enter..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMeaning}
                  disabled={!meaningInput.trim()}
                  className="shrink-0"
                >
                  Thêm
                </Button>
              </div>
              {meanings.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {meanings.map((m, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="flex items-center gap-1.5 py-1"
                    >
                      <span className="text-xs font-semibold">{i + 1}.</span> {m}
                      <button
                        type="button"
                        onClick={() => removeMeaning(i)}
                        className="ml-0.5 rounded-full p-0.5 opacity-70 transition-opacity hover:bg-foreground/10 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-1">
                  Chưa có nghĩa nào. Hãy nhập nghĩa và nhấn "Thêm" hoặc Enter.
                </p>
              )}
            </CardContent>
          </Card>

          {/* HSK Level section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                Xếp vào trình độ HSK
                <span className="text-xs text-muted-foreground font-normal">(không bắt buộc)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {HSK_LEVEL_OPTIONS.map((opt) => {
                  const isSelected = selectedLevels.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleLevel(opt.value)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-transparent text-muted-foreground hover:border-ring hover:text-foreground"
                      )}
                    >
                      {opt.label}
                      {isSelected && (
                        <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
              {selectedLevels.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Nếu không chọn, admin sẽ tự xếp vào trình độ phù hợp.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Có lỗi xảy ra</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={submitting || !isSignedIn}
              size="lg"
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi...
                </>
              ) : !isSignedIn ? (
                <>
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Vui lòng đăng nhập
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Gửi để admin duyệt
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                fetchMySubmissions()
                setShowMySubmissions(true)
              }}
              className="text-muted-foreground"
            >
              <History className="mr-2 h-4 w-4" />
              Xem từ vựng đã gửi
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}