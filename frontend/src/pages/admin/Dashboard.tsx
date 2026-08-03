import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth, useUser } from "@clerk/clerk-react"
import { getUserByClerkId, fetchAdminStats, fetchAnalytics } from "@/lib/api"
import type { AdminStats, AnalyticsResponse } from "@/lib/api"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  BookOpen,
  Layers,
  Clock,
  Flag,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Activity,
  BarChart3,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

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
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
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

// Fetch analytics (User Growth + Daily Study Activity) from Recharts-backed endpoint
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    const loadAnalytics = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const data = await fetchAnalytics(token)
        if (data.success) {
          setAnalytics(data)
        }
      } catch (err) {
        console.error("Failed to fetch activity analytics:", err)
      } finally {
        setLoadingAnalytics(false)
      }
    }

    loadAnalytics()
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

  const quickActions = [
    {
      title: "Duyệt Từ Vựng",
      desc: `${stats?.pendingVocabulary ?? 0} từ cần duyệt`,
      href: "/admin/pending-vocabulary",
      icon: Clock,
      color: "border-amber-500/20 bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
      badge: (stats?.pendingVocabulary ?? 0) > 0 ? `${stats?.pendingVocabulary} mới` : null,
    },
    {
      title: "Báo Cáo Vi Phạm",
      desc: `${stats?.pendingReports ?? 0} báo cáo cần xử lý`,
      href: "/admin/reports",
      icon: Flag,
      color: "border-rose-500/20 bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
      badge: (stats?.pendingReports ?? 0) > 0 ? `${stats?.pendingReports} mới` : null,
    },
    {
      title: "Quản Lý User",
      desc: "Quản lý vai trò & trạng thái",
      href: "/admin/users",
      icon: Users,
      color: "border-blue-500/20 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    },
    {
      title: "Bộ Từ Cộng Đồng",
      desc: "Ghim / Đánh dấu Official",
      href: "/community-decks",
      icon: Layers,
      color: "border-violet-500/20 bg-violet-50/50 hover:bg-violet-100/50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
    },
  ]

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

      {/* Quick Actions Bar */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Zap className="size-4 text-amber-500" />
          Tác Vụ Nhanh (Quick Actions)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} to={action.href}>
                <Card className={`transition-all duration-200 border ${action.color} hover:shadow-sm cursor-pointer h-full`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background/80 shadow-xs">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {action.title}
                          {action.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                              {action.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-80 mt-0.5">{action.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 opacity-60" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Action Center / Alert Badges */}
      {!loading && stats && ((stats.pendingVocabulary > 0) || (stats.pendingReports > 0)) && (
        <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ShieldAlert className="size-5" />
              Trung Tâm Cảnh Báo Cần Xử Lý (Pending Action Center)
            </CardTitle>
            <CardDescription className="text-xs">
              Các mục tồn đọng đang chờ Admin / Moderator phê duyệt
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {stats.pendingVocabulary > 0 ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{stats.pendingVocabulary} Từ Vựng Đóng Góp</p>
                    <p className="text-xs text-muted-foreground">Đang chờ phê duyệt từ người dùng</p>
                  </div>
                </div>
                <Link to="/admin/pending-vocabulary">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    Duyệt Ngay
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs">Không có từ vựng nào chờ duyệt.</span>
              </div>
            )}

            {stats.pendingReports > 0 ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <Flag className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{stats.pendingReports} Báo Cáo Vi Phạm</p>
                    <p className="text-xs text-muted-foreground">Các bộ từ cộng đồng bị báo cáo</p>
                  </div>
                </div>
                <Link to="/admin/reports">
                  <Button size="sm" variant="outline" className="gap-1 text-xs text-rose-600 hover:text-rose-700">
                    Xử Lý Ngay
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs">Không có báo cáo vi phạm nào chưa xử lý.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* ============ PHASE 2: Recharts Analytics ============ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Line Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="size-4 text-blue-500" />
                  User Growth
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Cumulative & new users over the last 30 days
                </CardDescription>
              </div>
              {analytics && (
                <div className="text-xs text-muted-foreground tabular-nums">
                  Total:{" "}
                  <span className="font-semibold">
                    {(analytics.totals.totalUsers).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {loadingAnalytics ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : analytics && analytics.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.userGrowth} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: number | string, name: string) => [
                      Number(value).toLocaleString(),
                      name === "newUsers" ? "New users" : name === "totalUsers" ? "Total users" : name,
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalUsers"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Total users"
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="New users"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Users className="size-8 opacity-40" />
                <p className="text-xs">No user growth data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Study Activity Bar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  Daily Study Activity
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Actions per day over the last 30 days
                </CardDescription>
              </div>
              {analytics && (
                <div className="text-xs text-muted-foreground tabular-nums">
                  Actions:{" "}
                  <span className="font-semibold">
                    {(analytics.totals.totalActions).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {loadingAnalytics ? (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : analytics && analytics.dailyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyActivity} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: number | string) => [Number(value).toLocaleString(), "Actions"]}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="actions" name="Actions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <BarChart3 className="size-8 opacity-40" />
                <p className="text-xs">No study activity data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action breakdown (small) */}
      {analytics && analytics.actionBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-violet-500" />
              Action Breakdown (30 days)
            </CardTitle>
            <CardDescription className="text-xs">
              Most frequent activity types across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.actionBreakdown.map((item) => (
                <div
                  key={item.action}
                  className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-foreground">{item.action}</span>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

