import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import { getUserByClerkId, fetchActivityLogs, fetchActivityActions } from "@/lib/api"
import type { ActivityLogEntry } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  User,
  Clock,
  FileText,
  Layers,
  BookOpen,
} from "lucide-react"

const ACTION_META: Record<string, { label: string; color: string }> = {
  "user.register": { label: "User Register", color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950 border-emerald-500/30" },
  "vocabulary.submit": { label: "Vocabulary Submit", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950 border-blue-500/30" },
  "vocabulary.approve": { label: "Vocabulary Approve", color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950 border-emerald-500/30" },
  "vocabulary.reject": { label: "Vocabulary Reject", color: "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950 border-rose-500/30" },
  "vocabulary.create": { label: "Vocabulary Create", color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-950 border-violet-500/30" },
  "vocabulary.update": { label: "Vocabulary Update", color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950 border-amber-500/30" },
  "vocabulary.delete": { label: "Vocabulary Delete", color: "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950 border-rose-500/30" },
  "deck.create": { label: "Deck Create", color: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950 border-cyan-500/30" },
  "deck.publish": { label: "Deck Publish", color: "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950 border-indigo-500/30" },
}

function actionMeta(action: string) {
  return (
    ACTION_META[action] || {
      label: action || "Unknown",
      color: "text-muted-foreground bg-muted dark:bg-muted/50 border-border",
    }
  )
}

function entityIcon(type: string) {
  if (type === "user") return <User className="size-3.5" />
  if (type === "vocabulary") return <BookOpen className="size-3.5" />
  if (type === "community_deck") return <Layers className="size-3.5" />
  return <FileText className="size-3.5" />
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminActivityLogs() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedAction, setSelectedAction] = useState("all")
  const [days, setDays] = useState("30")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchLogs = async () => {
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

      const data = await fetchActivityLogs(token, {
        action: selectedAction === "all" ? undefined : selectedAction,
        search: debouncedSearch || undefined,
        page,
        limit: 30,
        days: Number(days),
      })
      setLogs(data.logs)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activity logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [user, isLoaded, isSignedIn, selectedAction, days, debouncedSearch, page, getToken])

  // Load distinct action types for filter
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    const loadActions = async () => {
      const token = await getToken()
      if (!token) return
      try {
        const data = await fetchActivityActions(token)
        setActions(Array.isArray(data) ? data : data.actions || [])
      } catch {
        // ignore
      }
    }
    loadActions()
  }, [user, isLoaded, isSignedIn, getToken])

  const resetPagination = () => setPage(1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log Stream</h1>
          <p className="mt-1 text-muted-foreground">
            Track user registrations, vocabulary submissions, and deck activity in real time.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetPagination()
            fetchLogs()
          }}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedAction}
            onValueChange={(v) => {
              setSelectedAction(v as string)
              resetPagination()
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_META[a]?.label || a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={days}
            onValueChange={(v) => {
              setDays(v as string)
              resetPagination()
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetPagination()
            }}
            placeholder="Search username / entity..."
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Activity Feed
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${total} event${total !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Activity className="size-8 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No activity events found.</p>
              <p className="text-xs text-muted-foreground/60">
                Try adjusting filters or performing actions in the app.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => {
                const meta = actionMeta(log.action)
                const username =
                  (typeof log.user === "object" && log.user !== null && log.user.username) ||
                  log.username ||
                  "System"
                return (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {entityIcon(log.entityType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`gap-1 border ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        {log.entityName && (
                          <span className="text-sm font-semibold text-foreground">
                            {log.entityName}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {username}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTime(log.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {log.entityType}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
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
    </div>
  )
}
