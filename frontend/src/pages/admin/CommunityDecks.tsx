import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@clerk/clerk-react"
import {
  fetchAdminCommunityDecks,
  adminDeleteCommunityDeck,
  adminHideCommunityDeck,
  adminUnhideCommunityDeck,
} from "@/lib/api"
import type { AdminCommunityDeck, AdminCommunityDecksResponse } from "@/lib/api"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Search,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react"

const visibilityFilters = [
  { key: "", label: "All" },
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
  { key: "unlisted", label: "Unlisted" },
] as const

const statusFilters = [
  { key: "", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "hidden", label: "Hidden" },
] as const

const sortOptions = [
  { key: "updatedAt", label: "Recent" },
  { key: "createdAt", label: "Created" },
  { key: "title", label: "Title" },
  { key: "saveCount", label: "Saves" },
] as const

type VisibilityKey = (typeof visibilityFilters)[number]["key"]
type StatusKey = (typeof statusFilters)[number]["key"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminCommunityDecks() {
  const { getToken } = useAuth()
  const [data, setData] = useState<AdminCommunityDecksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [visibility, setVisibility] = useState<VisibilityKey>("")
  const [status, setStatus] = useState<StatusKey>("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("updatedAt")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadDecks = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAdminCommunityDecks(token, {
        search: search || undefined,
        visibility: visibility || undefined,
        status: status || undefined,
        page,
        limit: 15,
        sort,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch community decks")
    } finally {
      setLoading(false)
    }
  }, [getToken, search, visibility, status, page, sort])

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleHide = async (deckId: string) => {
    const token = await getToken()
    if (!token) return
    setActionLoading(deckId)
    try {
      await adminHideCommunityDeck(token, deckId)
      await loadDecks()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnhide = async (deckId: string) => {
    const token = await getToken()
    if (!token) return
    setActionLoading(deckId)
    try {
      await adminUnhideCommunityDeck(token, deckId)
      await loadDecks()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (deckId: string) => {
    const token = await getToken()
    if (!token) return
    setActionLoading(deckId)
    try {
      await adminDeleteCommunityDeck(token, deckId)
      setDeleteConfirm(null)
      await loadDecks()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Community Decks</h1>
        <p className="mt-1 text-muted-foreground">
          View, hide, or delete community decks across the platform.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by deck title or author..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} variant="secondary">
                Search
              </Button>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Visibility filter */}
              <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                {visibilityFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setVisibility(f.key)
                      setPage(1)
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      visibility === f.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                {statusFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setStatus(f.key)
                      setPage(1)
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      status === f.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value)
                    setPage(1)
                  }}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            {!loading && data && (
              <div className="text-xs text-muted-foreground">
                {data.total} deck{data.total !== 1 ? "s" : ""} found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-muted-foreground" />
            All Community Decks
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${data?.decks.length ?? 0} decks on this page`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.decks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Layers className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No decks found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Words</TableHead>
                    <TableHead className="text-center">Saves</TableHead>
                    <TableHead className="text-center">Comments</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.decks.map((deck: AdminCommunityDeck) => (
                    <TableRow key={deck._id}>
                      <TableCell>
                        <div className="font-medium truncate max-w-[260px]" title={deck.title}>
                          {deck.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {deck.ownerId?.username || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deck.visibility === "public"
                              ? "default"
                              : deck.visibility === "unlisted"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {deck.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            deck.status === "hidden"
                              ? "destructive"
                              : deck.status === "published"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {deck.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {deck.wordIds?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {deck.saveCount}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {deck.commentCount}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(deck.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Hide / Unhide */}
                          {deck.status === "hidden" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleUnhide(deck._id)}
                              disabled={actionLoading === deck._id}
                              title="Unhide deck"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleHide(deck._id)}
                              disabled={actionLoading === deck._id}
                              title="Hide deck"
                            >
                              <EyeOff className="size-3.5" />
                            </Button>
                          )}

                          {/* Delete */}
                          <Dialog
                            open={deleteConfirm === deck._id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteConfirm(null)
                            }}
                          >
                            <DialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Delete deck permanently"
                                  className="text-destructive hover:text-destructive"
                                />
                              }
                              onClick={() => setDeleteConfirm(deck._id)}
                            >
                              <Trash2 className="size-3.5" />
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Community Deck</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to permanently delete{" "}
                                  <strong>"{deck.title}"</strong>? This action cannot be
                                  undone. All associated comments, saves, and reports will
                                  also be removed.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose
                                  render={<Button variant="outline" />}
                                >
                                  Cancel
                                </DialogClose>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(deck._id)}
                                  disabled={actionLoading === deck._id}
                                >
                                  {actionLoading === deck._id
                                    ? "Deleting..."
                                    : "Delete Permanently"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              let pageNum: number
              if (totalPages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="min-w-8"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

