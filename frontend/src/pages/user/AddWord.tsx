import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import {
  PlusCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

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

export default function AddWord() {
  const { user } = useUser()

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Please sign in to submit vocabulary.")
      return
    }

    // Validate
    if (!simplified.trim()) {
      setError("Simplified Chinese is required.")
      return
    }
    if (!pinyin.trim()) {
      setError("Pinyin is required.")
      return
    }
    if (meanings.length === 0) {
      setError("At least one meaning is required.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/vocabulary/pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-user-id": user.id,
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
        message: `"${data.pending.simplified}" has been submitted for admin review.`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
          — ĐÓNG GÓP TỪ VỰNG
        </span>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Thêm từ mới
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Đóng góp từ vựng tiếng Trung vào thư viện chung. Sau khi gửi, admin sẽ
          xem xét và duyệt từ của bạn.
        </p>
      </div>

      {success ? (
        <Card className="border-emerald-500/30 bg-emerald-950/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <div>
              <CardTitle className="text-emerald-300">
                Gửi thành công!
              </CardTitle>
              <CardDescription className="mt-1 text-emerald-400/70">
                {success.message}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={resetForm}
              className="mt-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm từ khác
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Simplified Chinese */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              Chữ Hán (Giản thể) <span className="text-red-400">*</span>
            </label>
            <Input
              value={simplified}
              onChange={(e) => setSimplified(e.target.value)}
              placeholder="Ví dụ: 你好"
              className="border-slate-800 bg-[#161c2e] text-lg text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Traditional Chinese */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              Chữ Hán (Phồn thể){" "}
              <span className="text-slate-500">(không bắt buộc)</span>
            </label>
            <Input
              value={traditional}
              onChange={(e) => setTraditional(e.target.value)}
              placeholder="Ví dụ: 你好"
              className="border-slate-800 bg-[#161c2e] text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Pinyin */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              Pinyin <span className="text-red-400">*</span>
            </label>
            <Input
              value={pinyin}
              onChange={(e) => setPinyin(e.target.value)}
              placeholder="Ví dụ: nǐ hǎo"
              className="border-slate-800 bg-[#161c2e] text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* Meanings */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              Nghĩa <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={meaningInput}
                onChange={(e) => setMeaningInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addMeaning())
                }
                placeholder="Nhập nghĩa và nhấn Enter"
                className="border-slate-800 bg-[#161c2e] text-slate-200 placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addMeaning}
                disabled={!meaningInput.trim()}
                className="shrink-0 border-slate-700"
              >
                Thêm
              </Button>
            </div>
            {meanings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {meanings.map((m, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1 bg-emerald-500/10 text-emerald-300"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMeaning(i)}
                      className="ml-0.5 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* HSK Level Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-200">
              Xếp vào trình độ HSK{" "}
              <span className="text-slate-500">(không bắt buộc)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {HSK_LEVEL_OPTIONS.map((opt) => {
                const isSelected = selectedLevels.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleLevel(opt.value)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border border-slate-800 bg-[#161c2e] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-emerald-500 py-6 text-base font-bold text-slate-950 shadow-md shadow-emerald-500/10 hover:bg-emerald-400"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Gửi để admin duyệt
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
