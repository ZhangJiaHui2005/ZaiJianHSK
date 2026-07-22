import { type ReactNode, useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import { getUserByClerkId } from "@/lib/api"
import {
  getPendingVocabulary,
  approvePendingVocabulary,
  rejectPendingVocabulary,
  permanentDeletePendingVocabulary,
  fetchDecksByLevels,
  type PendingVocab,
  type DeckInfo,
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
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tags,
  BookOpen,
  Layers,
  Loader2,
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

const statusBadgeVariant: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
}

const statusIcon: Record<string, ReactNode> = {
  pending: <Clock className="size-3.5 text-yellow-500" />,
  approved: <CheckCircle className="size-3.5 text-green-500" />,
  rejected: <XCircle className="size-3.5 text-red-500" />,
}

export default function AdminPendingVocabulary() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [submissions, setSubmissions] = useState<PendingVocab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})
  const [approveTarget, setApproveTarget] = useState<PendingVocab | null>(null)
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [availableDecks, setAvailableDecks] = useState<DeckInfo[]>([])
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([])
  const [loadingDecks, setLoadingDecks] = useState(false)

  const fetchSubmissions = async () => {
    if (!isLoaded || !isSignedIn || !user) return
    setLoading(true)
    setError(null)

    const token = await getToken();
    if (!token) return;

    try {
      const currentUser = await getUserByClerkId(user.id, token);
      if (!currentUser || (currentUser as any).role !== "admin") {
        setError("Access denied. Admin role required.")
        return
      }
      const data = await getPendingVocabulary(token, {
        status: statusFilter,
        page,
        limit: 20,
      })
      setSubmissions(data.submissions)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [user, isLoaded, isSignedIn, statusFilter, page, getToken])

  // Fetch available decks when selectedLevels change in approve dialog
  useEffect(() => {
    if (!isApproveDialogOpen || selectedLevels.length === 0) {
      setAvailableDecks([])
      setSelectedDeckIds([])
      return
    }
    const fetchDecks = async () => {
      setLoadingDecks(true)
      try {
        const data = await fetchDecksByLevels(selectedLevels)
        setAvailableDecks(data.decks || [])
        setSelectedDeckIds([])
      } catch (err) {
        console.error("Failed to fetch decks:", err)
        setAvailableDecks([])
      } finally {
        setLoadingDecks(false)
      }
    }
    fetchDecks()
  }, [isApproveDialogOpen, selectedLevels])

  const openApproveDialog = (submission: PendingVocab) => {
    setApproveTarget(submission)
    setSelectedLevels(
      submission.level && submission.level.length > 0
        ? [...submission.level]
        : []
    )
    setSelectedDeckIds([])
    setAvailableDecks([])
    setIsApproveDialogOpen(true)
  }

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  const toggleDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId)
        ? prev.filter((d) => d !== deckId)
        : [...prev, deckId]
    )
  }

  const handleConfirmApprove = async () => {
    if (!user || !approveTarget) return
    const token = await getToken()
    if (!token) return
    setActionLoading(approveTarget._id)
    setIsApproveDialogOpen(false)
    try {
      await approvePendingVocabulary(
        token,
        approveTarget._id,
        selectedLevels.length > 0 ? selectedLevels : undefined,
        selectedDeckIds.length > 0 ? selectedDeckIds : undefined
      )
      await fetchSubmissions()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
      setApproveTarget(null)
    }
  }

  const handleReject = async (pendingId: string) => {
    if (!user) return
    const token = await getToken()
    if (!token) return
    const notes = rejectNotes[pendingId] || ""
    if (!notes.trim()) {
      alert("Please provide a reason for rejection.")
      return
    }
    setActionLoading(pendingId)
    try {
      await rejectPendingVocabulary(token, pendingId, notes)
      setRejectNotes((prev) => ({ ...prev, [pendingId]: "" }))
      await fetchSubmissions()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePermanentDelete = async (pendingId: string) => {
    if (!user) return
    const token = await getToken()
    if (!token) return
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this submission? This action cannot be undone."
      )
    )
      return
    setActionLoading(pendingId)
    try {
      await permanentDeletePendingVocabulary(token, pendingId)
      await fetchSubmissions()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatLevel = (lv: string) =>
    lv
      .replace("newest-", "HSK ")
      .replace("new-", "HSK ")
      .replace("old-", "HSK ")

  const renderActions = (s: PendingVocab) => {
    if (s.status === "pending") {
      return (
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => openApproveDialog(s)}
              disabled={actionLoading === s._id}
              className="gap-1"
            >
              <CheckCircle className="size-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(s._id)}
              disabled={actionLoading === s._id || !rejectNotes[s._id]?.trim()}
              className="gap-1"
            >
              <XCircle className="size-3.5" /> Reject
            </Button>
          </div>
          <Input
            placeholder="Reason for rejection..."
            className="h-7 w-56 text-xs"
            value={rejectNotes[s._id] || ""}
            onChange={(e) =>
              setRejectNotes((prev) => ({ ...prev, [s._id]: e.target.value }))
            }
          />
        </div>
      )
    }
    if (s.status === "approved") {
      return (
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-muted-foreground">
            {typeof s.adminId === "object" && s.adminId !== null
              ? (s.adminId as { _id: string; username: string; email: string })
                .username
              : "Admin"}{" "}
            on{" "}
            {s.reviewedAt
              ? new Date(s.reviewedAt).toLocaleDateString()
              : "\u2014"}
          </span>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Reason for removing..."
              className="h-7 w-40 text-xs"
              value={rejectNotes[s._id] || ""}
              onChange={(e) =>
                setRejectNotes((prev) => ({ ...prev, [s._id]: e.target.value }))
              }
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                const notes = rejectNotes[s._id] || ""
                if (!notes.trim()) {
                  alert("Please provide a reason.")
                  return
                }
                if (
                  window.confirm(
                    `Are you sure you want to reject "${s.simplified}"? This will remove it from the vocabulary collection and all HSK libraries.`
                  )
                ) {
                  handleReject(s._id)
                }
              }}
              disabled={actionLoading === s._id || !rejectNotes[s._id]?.trim()}
              className="gap-1"
            >
              <XCircle className="size-3.5" /> Reject & Remove
            </Button>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-end gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handlePermanentDelete(s._id)}
          disabled={actionLoading === s._id}
          className="gap-1"
        >
          <XCircle className="size-3.5" /> Delete Permanently
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Vocabulary</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve/reject vocabulary submissions from users.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as string)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {total} submission{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary Submissions</CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : `Showing page ${page} of ${totalPages} (${total} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : submissions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No submissions found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Pinyin</TableHead>
                    <TableHead>Meanings</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HSK Level</TableHead>
                    <TableHead>Bài học</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-lg">
                            {s.simplified}
                            {s.traditional &&
                              s.traditional !== s.simplified && (
                                <span className="ml-1 text-muted-foreground">
                                  ({s.traditional})
                                </span>
                              )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.pinyin}
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div className="flex flex-wrap gap-1">
                          {s.meanings.slice(0, 3).map((m, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {m}
                            </Badge>
                          ))}
                          {s.meanings.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{s.meanings.length - 3}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(typeof s.userId === "object" && s.userId?.username) || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant[s.status] || "outline"}
                        >
                          <span className="flex items-center gap-1">
                            {statusIcon[s.status]} {s.status}
                          </span>
                        </Badge>
                        {s.notes && s.status === "rejected" && (
                          <p className="mt-1 text-xs text-destructive">
                            Reason: {s.notes.split(" | Removed")[0]}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.level && s.level.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.level.map((lv, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-[10px] leading-tight"
                              >
                                {formatLevel(lv)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {(typeof s.adminId === "object" && s.adminId?.username) || "Admin"} on{" "}
                            {s.reviewedAt
                              ? new Date(s.reviewedAt).toLocaleDateString()
                              : "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.assignedDeckNames &&
                          s.assignedDeckNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.assignedDeckNames.map((name, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-[10px] leading-tight"
                              >
                                <BookOpen className="mr-0.5 size-3" />
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            &mdash;
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderActions(s)}
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

      <Dialog
        open={isApproveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsApproveDialogOpen(false)
            setApproveTarget(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" /> Approve
              Vocabulary
            </DialogTitle>
            <DialogDescription>
              Assign this word to one or more HSK levels and choose which bài
              học (lessons) it belongs to. It will then appear in the
              corresponding library sections.
            </DialogDescription>
          </DialogHeader>

          {approveTarget && (
            <div className="flex flex-col gap-4 py-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black tracking-wide">
                    {approveTarget.simplified}
                  </span>
                  {approveTarget.traditional &&
                    approveTarget.traditional !== approveTarget.simplified && (
                      <span className="text-sm text-muted-foreground">
                        ({approveTarget.traditional})
                      </span>
                    )}
                  <span className="text-base font-semibold text-primary">
                    [{approveTarget.pinyin}]
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {approveTarget.meanings.map((m, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {m}
                    </Badge>
                  ))}
                </div>
                {approveTarget.userId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted by:{" "}
                    {typeof approveTarget.userId === "object" &&
                      approveTarget.userId !== null
                      ? (
                        approveTarget.userId as {
                          _id: string
                          username: string
                          email: string
                        }
                      ).username
                      : "Unknown"}
                  </p>
                )}
              </div>

              {/* HSK Level Selection */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Tags className="size-4 text-emerald-400" /> HSK Level
                  Classification
                </label>
                <p className="mb-3 text-xs text-muted-foreground">
                  Select one or more HSK levels for this word. If none are
                  selected, the level suggestions from the user will be used (if
                  any).
                </p>
                <div className="flex flex-wrap gap-2">
                  {HSK_LEVELS.map((opt) => {
                    const isSelected = selectedLevels.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleLevel(opt.value)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${isSelected
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                            : "border border-slate-800 bg-[#161c2e] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                          }`}
                      >
                        <BookOpen className="size-3.5" /> {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Lesson / Deck Selection - shown when levels are selected */}
              {selectedLevels.length > 0 && (
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <Layers className="size-4 text-blue-400" /> Bài học / Lesson
                    Assignment
                  </label>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Select which specific bài học (decks) this word should be
                    added to. These are available based on the HSK levels you
                    selected above.
                  </p>
                  {loadingDecks ? (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#161c2e] p-3">
                      <Loader2 className="size-4 animate-spin text-blue-400" />
                      <span className="text-xs text-slate-400">
                        Loading bài học...
                      </span>
                    </div>
                  ) : availableDecks.length === 0 ? (
                    <p className="rounded-lg border border-slate-800 bg-[#161c2e] p-3 text-xs text-slate-500">
                      No bài học found for the selected HSK levels. The word
                      will still be added to the vocabulary library.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableDecks.map((deck) => {
                        const isSelected = selectedDeckIds.includes(deck._id)
                        return (
                          <button
                            key={deck._id}
                            type="button"
                            onClick={() => toggleDeck(deck._id)}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${isSelected
                                ? "border-blue-500/40 bg-blue-500/15 text-blue-400"
                                : "border-slate-800 bg-[#161c2e] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                              }`}
                          >
                            <BookOpen className="size-3.5" />
                            <div className="flex flex-col items-start">
                              <span>{deck.name}</span>
                              <span className="text-[9px] text-slate-500">
                                {deck.totalWords} từ
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false)
                setApproveTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmApprove}
              className="gap-1"
            >
              <CheckCircle className="size-4" /> Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
