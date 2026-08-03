import { useEffect, useState } from "react"
import { useAuth } from "@clerk/clerk-react"
import { fetchDeckReports, resolveReport, dismissReport, hideDeckAndResolveReport, type DeckReport } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
 
import { cn } from "@/lib/utils"
import { Flag, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  inappropriate: "Inappropriate",
  wrong_topic: "Wrong Topic",
  duplicate: "Duplicate",
  other: "Other",
}

const statusTabs = [
  { key: "pending", label: "Pending" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
] as const

type StatusTab = (typeof statusTabs)[number]["key"]

export default function AdminReports() {
  const { getToken } = useAuth()
  const [reports, setReports] = useState<DeckReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<StatusTab>("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadReports = async (status: StatusTab) => {
    const token = await getToken()
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDeckReports(token, { status, limit: 50 })
      setReports(data.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports(activeTab)
  }, [activeTab])

  const handleAction = async (
    action: "resolve" | "dismiss" | "hide",
    reportId: string
  ) => {
    const token = await getToken()
    if (!token) return
    setActionLoading(reportId)
    try {
      if (action === "resolve") {
        await resolveReport(token, reportId)
      } else if (action === "dismiss") {
        await dismissReport(token, reportId)
      } else if (action === "hide") {
        await hideDeckAndResolveReport(token, reportId)
      }
      await loadReports(activeTab)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Deck Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Review and manage community deck reports.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "pending"
              ? "Pending Reports"
              : activeTab === "resolved"
                ? "Resolved Reports"
                : "Dismissed Reports"}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : `${reports.length} report${reports.length !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Flag className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "pending"
                  ? "No pending reports. Everything looks good!"
                  : activeTab === "resolved"
                    ? "No resolved reports."
                    : "No dismissed reports."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const deck = typeof report.deckId === "object" ? report.deckId : null
                const reporter = typeof report.reporterId === "object" ? report.reporterId : null

                return (
                  <Card key={report._id} className="border-l-4 border-l-destructive/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        {/* Report header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Flag className="mt-0.5 size-4 text-destructive shrink-0" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="destructive" className="text-xs">
                                  {reasonLabels[report.reason] || report.reason}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  reported by{" "}
                                  <span className="font-medium text-foreground">
                                    {reporter?.username || "Unknown"}
                                  </span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(report.createdAt)}
                                </span>
                              </div>
                              {report.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  "{report.description}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Deck info */}
                        {deck && (
                          <div className="rounded-md bg-muted/50 p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{deck.title}</span>
                                <span className="ml-2 text-muted-foreground">
                                  by {deck.ownerId?.username || "Unknown"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
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
                                <Badge
                                  variant={
                                    deck.status === "hidden"
                                      ? "destructive"
                                      : "default"
                                  }
                                  className="text-xs"
                                >
                                  {deck.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {deck.saveCount} saves
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action buttons for pending reports */}
                        {activeTab === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleAction("hide", report._id)}
                              disabled={actionLoading === report._id}
                            >
                              <EyeOff className="mr-1.5 size-3.5" />
                              Hide Deck
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction("resolve", report._id)}
                              disabled={actionLoading === report._id}
                            >
                              <CheckCircle className="mr-1.5 size-3.5" />
                              Resolve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction("dismiss", report._id)}
                              disabled={actionLoading === report._id}
                            >
                              <XCircle className="mr-1.5 size-3.5" />
                              Dismiss
                            </Button>
                          </div>
                        )}

                        {/* Show admin info for resolved/dismissed */}
                        {activeTab !== "pending" && (
                          <div className="text-xs text-muted-foreground">
                            {report.adminId && (
                              <span>
                                Processed by{" "}
                                {typeof report.adminId === "object"
                                  ? report.adminId.username
                                  : "Admin"}
                                {report.resolvedAt && (
                                  <> on {formatDate(report.resolvedAt)}</>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
