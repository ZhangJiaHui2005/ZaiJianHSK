import { useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import { getUserByClerkId, deleteUser } from "@/lib/api"
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { Search, Trash2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

interface UserData {
  _id: string
  clerkId: string
  username: string
  email: string
  role: string
  createdAt: string
}

const roleBadgeVariant: Record<string, "default" | "destructive" | "secondary"> = {
  admin: "destructive",
  moderator: "secondary",
  user: "default",
}

const roleTabs = [
  { key: "all", label: "All" },
  { key: "user", label: "Users" },
  { key: "moderator", label: "Moderators" },
  { key: "admin", label: "Admins" },
] as const

type RoleTab = (typeof roleTabs)[number]["key"]

export default function AdminUsers() {
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<RoleTab>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchUsers = async () => {
    if (!isLoaded || !isSignedIn || !user) return
    setLoading(true)
    setError(null)

    const token = await getToken();
    if (!token) return;

    try {
      const currentUser = await getUserByClerkId(user.id, token)
      if (!currentUser || (currentUser as any).role !== "admin") {
        setError("Access denied. Admin role required.")
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [user, isLoaded, isSignedIn, getToken])

  const updateUserRole = async (clerkId: string, newRole: string) => {
    setUpdatingId(clerkId)
    const token = await getToken()
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${clerkId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      await fetchUsers()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteUser = async (clerkId: string, username: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(clerkId)

    const token = await getToken();
    if (!token) return

    try {
      await deleteUser(clerkId, token)
      await fetchUsers()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeletingId(null)
    }
  }

  // Filter by role tab first, then by search query
  const roleFiltered =
    activeTab === "all"
      ? users
      : users.filter((u) => u.role === activeTab)

  const query = searchQuery.toLowerCase().trim()
  const filteredUsers = query
    ? roleFiltered.filter(
      (u) =>
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    )
    : roleFiltered

  // Count users per role for tab display
  const roleCounts = {
    all: users.length,
    user: users.filter((u) => u.role === "user" || !u.role).length,
    moderator: users.filter((u) => u.role === "moderator").length,
    admin: users.filter((u) => u.role === "admin").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all registered users.
        </p>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {roleTabs.map((tab) => (
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
            {!loading && (
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-xs",
                  activeTab === tab.key
                    ? "border-foreground/20"
                    : "border-transparent"
                )}
              >
                {roleCounts[tab.key]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Search className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "all"
              ? "All Users"
              : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Loading..."
              : `${filteredUsers.length} user${filteredUsers.length !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {query
                  ? `No users match "${searchQuery}".`
                  : `No ${activeTab === "all" ? "" : activeTab} ${activeTab === "all" ? "users" : "users"} found.`}
              </p>
              <p className="text-xs text-muted-foreground/60">
                {query
                  ? "Try a different search term."
                  : activeTab === "user"
                    ? "There are no regular users registered yet."
                    : activeTab === "moderator"
                      ? "There are no moderators assigned yet."
                      : activeTab === "admin"
                        ? "There are no additional admins yet."
                        : "The user list is empty."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.username}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={roleBadgeVariant[u.role] || "default"}
                      >
                        {u.role || "user"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={u.role || "user"}
                          onValueChange={(value) => {
                            if (u.clerkId && value) {
                              updateUserRole(u.clerkId, value)
                            }
                          }}
                          disabled={
                            !u.clerkId ||
                            u.clerkId === user?.id ||
                            updatingId === u.clerkId
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">
                              Moderator
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() =>
                            u.clerkId && handleDeleteUser(u.clerkId, u.username)
                          }
                          disabled={
                            !u.clerkId ||
                            u.clerkId === user?.id ||
                            deletingId === u.clerkId
                          }
                          className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                          title={
                            u.clerkId === user?.id
                              ? "Cannot delete yourself"
                              : "Delete user"
                          }
                        >
                          {deletingId === u.clerkId ? (
                            <span className="size-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
