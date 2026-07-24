import { type FormEvent, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import { Check, Loader2, Plus, Search, Send, X } from "lucide-react"
import {
  createCommunityDeck,
  fetchVocabularyList,
  type VocabularyWord,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const HSK_LEVEL_OPTIONS = [
  { value: "newest-1", label: "HSK 1" },
  { value: "newest-2", label: "HSK 2" },
  { value: "newest-3", label: "HSK 3" },
  { value: "newest-4", label: "HSK 4" },
  { value: "newest-5", label: "HSK 5" },
  { value: "newest-6", label: "HSK 6" },
  { value: "newest-7", label: "HSK 7-9" },
]

export default function CreateCommunityDeck() {
  const navigate = useNavigate()
  const { getToken, isSignedIn } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [hskLevels, setHskLevels] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<VocabularyWord[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyWord[]>([])
  const [loadingWords, setLoadingWords] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishNow, setPublishNow] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWords = async () => {
      if (search.trim().length < 1) {
        setResults([])
        return
      }

      setLoadingWords(true)
      try {
        const res = await fetchVocabularyList({ search, limit: 12 })
        setResults(res.words)
      } catch {
        setResults([])
      } finally {
        setLoadingWords(false)
      }
    }

    const timer = window.setTimeout(loadWords, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const addTag = () => {
    const nextTag = tagInput.trim().replace(/^#/, "")
    if (nextTag && !tags.includes(nextTag)) {
      setTags((prev) => [...prev, nextTag].slice(0, 8))
      setTagInput("")
    }
  }

  const toggleLevel = (level: string) => {
    setHskLevels((prev) =>
      prev.includes(level) ? prev.filter((item) => item !== level) : [...prev, level]
    )
  }

  const toggleWord = (word: VocabularyWord) => {
    setSelectedWords((prev) =>
      prev.some((item) => item._id === word._id)
        ? prev.filter((item) => item._id !== word._id)
        : [...prev, word]
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!isSignedIn) {
      setError("Bạn cần đăng nhập để tạo bộ từ.")
      return
    }
    if (title.trim().length < 3) {
      setError("Tên bộ từ cần ít nhất 3 ký tự.")
      return
    }
    if (selectedWords.length === 0) {
      setError("Hãy chọn ít nhất một từ cho bộ từ.")
      return
    }

    setSubmitting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("Không lấy được phiên đăng nhập")
      const res = await createCommunityDeck(token, {
        title,
        description,
        wordIds: selectedWords.map((word) => word._id),
        visibility: publishNow ? "public" : "private",
        tags,
        hskLevels,
      })
      navigate(`/user/community/${res.deck._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo bộ từ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">- TẠO BỘ TỪ</span>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Chia sẻ một bộ từ mới
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin bộ từ</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Tên bộ từ</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Từ vựng đi du lịch Trung Quốc" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Mô tả</label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Nói ngắn gọn bộ này dùng để học gì"
                rows={4}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Trình độ HSK</label>
              <div className="flex flex-wrap gap-2">
                {HSK_LEVEL_OPTIONS.map((option) => {
                  const selected = hskLevels.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleLevel(option.value)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                        selected
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Ví dụ: du-lich"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Thêm
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button type="button" onClick={() => setTags((prev) => prev.filter((item) => item !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chọn từ trong kho HSK</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo chữ Hán, pinyin hoặc nghĩa"
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-2">
              {loadingWords ? (
                <div className="flex items-center justify-center py-8 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : results.length > 0 ? (
                results.map((word) => {
                  const selected = selectedWords.some((item) => item._id === word._id)
                  return (
                    <button
                      key={word._id}
                      type="button"
                      onClick={() => toggleWord(word)}
                      className="flex items-center justify-between rounded-xl border bg-card p-3 text-left transition hover:bg-accent/50"
                    >
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black">{word.simplified}</span>
                          <span className="text-sm font-semibold text-primary">[{word.pinyin}]</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{word.meanings.join(", ")}</p>
                      </div>
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                  )
                })
              ) : (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Nhập từ khóa để tìm và thêm từ.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Đã chọn {selectedWords.length} từ</CardTitle>
          </CardHeader>
          <CardContent className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
            {selectedWords.length > 0 ? (
              selectedWords.map((word) => (
                <div key={word._id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-bold">{word.simplified}</p>
                    <p className="truncate text-xs text-muted-foreground">{word.pinyin}</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => toggleWord(word)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Danh sách đang trống.</p>
            )}
          </CardContent>
        </Card>

        <Card className="p-4">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
              className="h-4 w-4"
            />
            Đăng công khai sau khi tạo
          </label>
          {error && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={submitting} className="mt-4 w-full py-6 font-bold">
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
            Tạo bộ từ
          </Button>
        </Card>
      </aside>
    </form>
  )
}
