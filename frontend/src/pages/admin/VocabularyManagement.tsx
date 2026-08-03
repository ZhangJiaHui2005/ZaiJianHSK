import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import {
  getUserByClerkId,
  fetchVocabularyList,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  type VocabularyWord,
  type VocabularyMutationPayload,
} from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react"

const HSK_LEVELS = [
  { value: "newest-1", label: "HSK 1" },
  { value: "newest-2", label: "HSK 2" },
  { value: "newest-3", label: "HSK 3" },
  { value: "newest-4", label: "HSK 4" },
  { value: "newest-5", label: "HSK 5" },
  { value: "newest-6", label: "HSK 6" },
  { value: "newest-7", label: "HSK 7-9" },
]

const LEVEL_COLORS: Record<string, string> = {
  "1": "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  "2": "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  "3": "bg-violet-500/15 text-violet-600 border-violet-500/30 dark:text-violet-400",
  "4": "bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400",
  "5": "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
  "6": "bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-400",
  "7": "bg-pink-500/15 text-pink-600 border-pink-500/30 dark:text-pink-400",
}

// "new-1" and "newest-1" (and legacy "old-1") all refer to the same HSK level.
// Strip the prefix so duplicates can be collapsed and colors looked up consistently.
function levelNumber(lv: string): string {
  return lv.trim().toLowerCase().replace(/^new(est)?-/, "").replace(/^old-/, "")
}

// Collapse ["new-1", "newest-1"] into a single displayed badge per HSK level.
function dedupeLevels(levels: string[]): string[] {
  const seen = new Map<string, string>()
  for (const lv of levels) {
    const key = levelNumber(lv)
    if (!seen.has(key)) seen.set(key, lv)
  }
  return Array.from(seen.values())
}

interface WordForm {
  simplified: string
  traditional: string
  radical: string
  pinyin: string
  numeric: string
  meanings: string
  level: string[]
  frequency: string
  pos: string
  classifiers: string
}

const EMPTY_FORM: WordForm = {
  simplified: "",
  traditional: "",
  radical: "",
  pinyin: "",
  numeric: "",
  meanings: "",
  level: [],
  frequency: "999999",
  pos: "",
  classifiers: "",
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function formatLevel(lv: string) {
  return lv
    .replace("newest-", "HSK ")
    .replace("new-", "HSK ")
    .replace("old-", "HSK ")
}

export default function AdminVocabularyManagement() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()

  const [words, setWords] = useState<VocabularyWord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [levelFilter, setLevelFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null)
  const [form, setForm] = useState<WordForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedMeanings, setExpandedMeanings] = useState<Set<string>>(new Set())

  const toggleMeanings = (id: string) => {
    setExpandedMeanings((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchWords = async () => {
    if (!isLoaded || !isSignedIn || !user) return
    setLoading(true)
    setError(null)
    const token = await getToken()
    if (!token) return

    try {
      const currentUser = await getUserByClerkId(user.id, token)
      if (!currentUser || (currentUser as any).role !== "admin") {
        setError("Access denied. Admin role required.")
        return
      }

      const data = await fetchVocabularyList({
        level: levelFilter,
        search: debouncedSearch,
        page,
        limit: 20,
      })
      setWords(data.words)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch vocabulary")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWords()
  }, [user, isLoaded, isSignedIn, levelFilter, debouncedSearch, page, getToken])

  const openCreate = () => {
    setEditingWord(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setIsDialogOpen(true)
  }

  const openEdit = (word: VocabularyWord) => {
    setEditingWord(word)
    setForm({
      simplified: word.simplified,
      traditional: word.traditional || "",
      radical: word.radical || "",
      pinyin: word.pinyin,
      numeric: word.numeric || "",
      meanings: (word.meanings || []).join(", "),
      level: word.level || [],
      frequency: String(word.frequency ?? 999999),
      pos: (word.pos || []).join(", "),
      classifiers: (word.classifiers || []).join(", "),
    })
    setFormError(null)
    setIsDialogOpen(true)
  }

  const toggleLevel = (lv: string) => {
    setForm((prev) => ({
      ...prev,
      level: prev.level.includes(lv)
        ? prev.level.filter((l) => l !== lv)
        : [...prev.level, lv],
    }))
  }

  const handleSave = async () => {
    if (!user) return
    const token = await getToken()
    if (!token) return

    if (!form.simplified.trim() || !form.pinyin.trim()) {
      setFormError("Simplified Chinese and Pinyin are required.")
      return
    }

    const payload: VocabularyMutationPayload = {
      simplified: form.simplified.trim(),
      traditional: form.traditional.trim(),
      radical: form.radical.trim(),
      pinyin: form.pinyin.trim(),
      numeric: form.numeric.trim(),
      meanings: parseList(form.meanings),
      level: form.level,
      frequency: parseInt(form.frequency, 10) || 999999,
      pos: parseList(form.pos),
      classifiers: parseList(form.classifiers),
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editingWord) {
        await updateVocabulary(token, editingWord._id, payload)
      } else {
        await createVocabulary(token, payload)
      }
      setIsDialogOpen(false)
      await fetchWords()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save vocabulary")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (word: VocabularyWord) => {
    if (!user) return
    const token = await getToken()
    if (!token) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${word.simplified}" (${word.pinyin})?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(word._id)
    try {
      await deleteVocabulary(token, word._id)
      await fetchWords()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete vocabulary")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Từ vựng HSK</h1>
          <p className="mt-1 text-muted-foreground">
            Create, edit, and delete standard HSK vocabulary words in the library.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          Add Word
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={levelFilter}
            onValueChange={(v) => {
              setLevelFilter(v as string)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {HSK_LEVELS.map((lv) => (
                <SelectItem key={lv.value} value={lv.value}>
                  {lv.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {total} words
            </span>
          )}
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search simplified / pinyin / meaning..."
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Standard HSK Vocabulary
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Showing page ${page} of ${totalPages} (${total} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : words.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <BookOpen className="size-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No vocabulary words found.</p>
              <p className="text-xs text-muted-foreground/60">
                Try adjusting filters or add a new word.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Pinyin</TableHead>
                    <TableHead>Meanings</TableHead>
                    <TableHead>HSK Level</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.map((word) => (
                    <TableRow key={word._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{word.simplified}</span>
                          {word.traditional && word.traditional !== word.simplified && (
                            <span className="text-xs text-muted-foreground">
                              ({word.traditional})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {word.pinyin}
                      </TableCell>
                      <TableCell className="max-w-72">
                        {expandedMeanings.has(word._id) ? (
                          <div className="flex flex-col gap-1">
                            {word.meanings.map((m, i) => (
                              <span
                                key={i}
                                className="text-xs leading-snug text-foreground/90"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {word.meanings.slice(0, 2).map((m, i) => (
                              <span
                                key={i}
                                className="text-xs leading-snug text-foreground/90"
                              >
                                {m}
                              </span>
                            ))}
                            {word.meanings.length > 2 && (
                              <span className="text-xs font-medium text-muted-foreground">
                                +{word.meanings.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleMeanings(word._id)}
                          className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
                        >
                          {expandedMeanings.has(word._id) ? (
                            <>
                              <ChevronUp className="size-3.5" /> Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="size-3.5" /> Xem tất cả
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {word.level && word.level.length > 0 ? (
                            dedupeLevels(word.level).slice(0, 2).map((lv, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className={`text-[10px] border ${LEVEL_COLORS[levelNumber(lv)] || "border-border bg-muted text-muted-foreground"}`}
                              >
                                {formatLevel(lv)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {word.frequency?.toLocaleString() ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(word)}
                            className="gap-1"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(word)}
                            disabled={deletingId === word._id}
                            className="gap-1"
                          >
                            {deletingId === word._id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false)
            setEditingWord(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingWord ? (
                <>
                  <Pencil className="size-5 text-primary" /> Edit Vocabulary
                </>
              ) : (
                <>
                  <Plus className="size-5 text-primary" /> Add Vocabulary Word
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingWord
                ? `Update "${editingWord.simplified}" (${editingWord.pinyin}).`
                : "Create a new standard HSK vocabulary word."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Simplified <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.simplified}
                  onChange={(e) => setForm({ ...form, simplified: e.target.value })}
                  placeholder="简体字"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Pinyin <span className="text-destructive">*</span></label>
                <Input
                  value={form.pinyin}
                  onChange={(e) => setForm({ ...form, pinyin: e.target.value })}
                  placeholder="pīnyīn"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Traditional</label>
                <Input
                  value={form.traditional}
                  onChange={(e) => setForm({ ...form, traditional: e.target.value })}
                  placeholder="繁體字"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Radical</label>
                <Input
                  value={form.radical}
                  onChange={(e) => setForm({ ...form, radical: e.target.value })}
                  placeholder="部首"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Numeric</label>
                <Input
                  value={form.numeric}
                  onChange={(e) => setForm({ ...form, numeric: e.target.value })}
                  placeholder="numeric pinyin"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Frequency</label>
                <Input
                  type="number"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Meanings <span className="text-destructive">*</span></label>
              <Textarea
                value={form.meanings}
                onChange={(e) => setForm({ ...form, meanings: e.target.value })}
                placeholder="Comma-separated meanings, e.g. hello, hi"
                className="min-h-16"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold">HSK Level Classification</label>
              <div className="flex flex-wrap gap-2">
                {HSK_LEVELS.map((lv) => {
                  const isSelected = form.level.includes(lv.value)
                  return (
                    <button
                      key={lv.value}
                      type="button"
                      onClick={() => toggleLevel(lv.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                        isSelected
                          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                          : "border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <BookOpen className="size-3.5" /> {lv.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">POS (comma-separated)</label>
                <Input
                  value={form.pos}
                  onChange={(e) => setForm({ ...form, pos: e.target.value })}
                  placeholder="noun, verb, adj"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Classifiers (comma-separated)</label>
                <Input
                  value={form.classifiers}
                  onChange={(e) => setForm({ ...form, classifiers: e.target.value })}
                  placeholder="个, 只"
                />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="size-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setEditingWord(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              {editingWord ? "Save Changes" : "Create Word"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}