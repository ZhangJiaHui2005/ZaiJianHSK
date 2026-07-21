import { useEffect, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { getUserByClerkId } from "@/lib/api"
import {
  getPendingVocabulary,
  approvePendingVocabulary,
  rejectPendingVocabulary,
  type PendingVocab,
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
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const statusBadgeVariant: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock className="size-3.5 text-yellow-500" />,
  approved: <CheckCircle className="size-3.5 text-green-500" />,
  rejected: <XCircle className="size-3.5 text-red-500" />,
}

export default function AdminPendingVocabulary() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [submissions, setSubmissions] = useState<PendingVocab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("pending")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  const fetchSubmissions = async () => {
    if (!isLoaded || !isSignedIn || !user) return
    setLoading(true)
    setError(null)
    try {
      const currentUser = await getUserByClerkId(user.id)
      if (!currentUser || (currentUser as any).role !== "admin") {
        setError("Access denied. Admin role required.")
        return
      }

      const data = await getPendingVocabulary(user.id, {
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
  }, [user, isLoaded, isSignedIn, statusFilter, page])

  const handleApprove = async (pendingId: string) => {
    if (!user) return
    setActionLoading(pendingId)
    try {
      await approvePendingVocabulary(user.id, pendingId)
      await fetchSubmissions()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (pendingId: string) => {
    if (!user) return
    const notes = rejectNotes[pendingId] || ""
    if (!notes.trim()) {
      alert("Please provide a reason for rejection.")
      return
    }
    setActionLoading(pendingId)
    try {
      await rejectPendingVocabulary(user.id, pendingId, notes)
      setRejectNotes((prev) => ({ ...prev, [pendingId]: "" }))
      await fetchSubmissions()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Vocabulary</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve/reject vocabulary submissions from users.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(v: string | null) => {
              setStatusFilter(v ?? "pending")
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

      {/* Table */}
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
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">
                        <span className="text-lg">{s.simplified}</span>
                        {s.traditional && s.traditional !== s.simplified && (
                          <span className="ml-1 text-muted-foreground">
                            ({s.traditional})
                          </span>
                        )}
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
                      <TableCell className="text-muted-foreground">
                        {s.userId?.username || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant[s.status] || "outline"}
                        >
                          <span className="flex items-center gap-1">
                            {statusIcon[s.status]}
                            {s.status}
                          </span>
                        </Badge>
                        {s.notes && s.status === "rejected" && (
                          <p className="mt-1 text-xs text-destructive">
                            Reason: {s.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === "pending" ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(s._id)}
                                disabled={actionLoading === s._id}
                                className="gap-1"
                              >
                                <CheckCircle className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(s._id)}
                                disabled={
                                  actionLoading === s._id ||
                                  !rejectNotes[s._id]?.trim()
                                }
                                className="gap-1"
                              >
                                <XCircle className="size-3.5" />
                                Reject
                              </Button>
                            </div>
                            <Input
                              placeholder="Reason for rejection..."
                              className="h-7 w-56 text-xs"
                              value={rejectNotes[s._id] || ""}
                              onChange={(e) =>
                                setRejectNotes((prev) => ({
                                  ...prev,
                                  [s._id]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {s.adminId?.username || "Admin"} on{" "}
                            {s.reviewedAt
                              ? new Date(s.reviewedAt).toLocaleDateString()
                              : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
                Previous
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
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
