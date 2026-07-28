import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import { getUserByClerkId, fetchAdminStats } from "@/lib/api"
import type { AdminStats } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  BookOpen,
  Layers,
  Clock,
  Flag,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

type StatItem = {
  title: string
  value: number | string | null
  icon: React.ElementType
  description: string
  color: string
  progress?: number // 0-100 for bar fill
  link?: string
}

const STAT_CARD_ICONS: Record<string, React.ElementType> = {
  totalUsers: Users,
  totalVocabulary: BookOpen,
  totalCommunityDecks: Layers,
  pendingVocabulary: Clock,
  pendingReports: Flag,
}

const STAT_CARD_COLORS: Record<string, string> = {
  totalUsers: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  totalVocabulary: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950",
  totalCommunityDecks: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-950",
  pendingVocabulary: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  pendingReports: "text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-950",
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  loading,
}: StatItem & { loading: boolean }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="size-4" />
          </div>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-black tracking-tight">{value ?? "—"}</div>
        )}
      </CardContent>
    </Card>
  )
}

function SimpleBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-sm font-medium text-muted-foreground truncate">
        {label}
      </span>
      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="w-16 text-right text-sm font-bold tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    const fetchData = async () => {
      try {
        const token = await getToken()
        if (!token) return

        // Fetch user role and admin stats in parallel
        const [userData, adminStats] = await Promise.all([
          getUserByClerkId(user.id, token),
          fetchAdminStats(token),
        ])

        if (userData) {
          setUserRole((userData as any).role || "user")
        }
        setStats(adminStats)
      } catch (err) {
        console.error("Failed to fetch admin dashboard data:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, isLoaded, isSignedIn, getToken])

  const cardItems: (StatItem & { key: string })[] = [
    {
      key: "totalUsers",
      title: "Total Users",
      value: stats?.totalUsers ?? null,
      icon: STAT_CARD_ICONS.totalUsers,
      description: "All registered users",
      color: STAT_CARD_COLORS.totalUsers,
    },
    {
      key: "totalVocabulary",
      title: "Total Vocabulary",
      value: stats?.totalVocabulary ?? null,
      icon: STAT_CARD_ICONS.totalVocabulary,
      description: "Words in HSK library",
      color: STAT_CARD_COLORS.totalVocabulary,
    },
    {
      key: "totalCommunityDecks",
      title: "Community Decks",
      value: stats?.totalCommunityDecks ?? null,
      icon: STAT_CARD_ICONS.totalCommunityDecks,
      description: "Public & private decks",
      color: STAT_CARD_COLORS.totalCommunityDecks,
    },
    {
      key: "pendingVocabulary",
      title: "Pending Vocabulary",
      value: stats?.pendingVocabulary ?? null,
      icon: STAT_CARD_ICONS.pendingVocabulary,
      description: "Words awaiting review",
      color: STAT_CARD_COLORS.pendingVocabulary,
    },
    {
      key: "pendingReports",
      title: "Pending Reports",
      value: stats?.pendingReports ?? null,
      icon: STAT_CARD_ICONS.pendingReports,
      description: "Deck reports to review",
      color: STAT_CARD_COLORS.pendingReports,
    },
  ]

  // Compute max value for bar chart scaling
  const barData = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, color: "bg-blue-500" },
        { label: "Vocabulary", value: stats.totalVocabulary, color: "bg-emerald-500" },
        { label: "Community Decks", value: stats.totalCommunityDecks, color: "bg-violet-500" },
        { label: "Pending Vocab", value: stats.pendingVocabulary, color: "bg-amber-500" },
        { label: "Pending Reports", value: stats.pendingReports, color: "bg-rose-500" },
      ]
    : []

  const maxValue = Math.max(...barData.map((d) => d.value), 1)

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the platform, users, and content.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cardItems.map((item) => {
          const { key: _key, ...rest } = item
          return <StatCard key={_key} {...rest} loading={loading} />
        })}
      </div>

      {/* Bar chart visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                Platform Overview
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Real-time aggregate counts across the platform
              </CardDescription>
            </div>
            {!loading && stats && (
              <div className="text-xs text-muted-foreground tabular-nums">
                Total:{" "}
                <span className="font-semibold">
                  {(
                    stats.totalUsers +
                    stats.totalVocabulary +
                    stats.totalCommunityDecks +
                    stats.pendingVocabulary +
                    stats.pendingReports
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {barData.map((d) => (
                <SimpleBar
                  key={d.label}
                  label={d.label}
                  value={d.value}
                  max={maxValue}
                  color={d.color}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Role badge */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Your role:</span>
        <span className="font-semibold uppercase tracking-wider text-foreground">
          {userRole || "—"}
        </span>
      </div>
    </div>
  )
}

