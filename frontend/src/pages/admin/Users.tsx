import { useEffect, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { getUserByClerkId } from "@/lib/api"
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

export default function AdminUsers() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchUsers = async () => {
    if (!isLoaded || !isSignedIn || !user) return
    setLoading(true)
    setError(null)
    try {
      const currentUser = await getUserByClerkId(user.id)
      if (!currentUser || (currentUser as any).role !== "admin") {
        setError("Access denied. Admin role required.")
        return
      }

      const res = await fetch(`${API_BASE_URL}/api/users`)
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
  }, [user, isLoaded, isSignedIn])

  const updateUserRole = async (clerkId: string, newRole: string) => {
    setUpdatingId(clerkId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${clerkId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage all registered users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${users.length} user${users.length !== 1 ? "s" : ""} registered`}
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
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant[u.role] || "default"}>
                          {u.role || "user"}
                        </Badge>
                      </TableCell>
<TableCell className="text-right">
                        <Select
                          value={u.role || "user"}
                          onValueChange={(value) => {
                            if (u.clerkId && value) {
                              updateUserRole(u.clerkId, value)
                            }
                          }}
                          disabled={!u.clerkId || u.clerkId === user?.id || updatingId === u.clerkId}
                        >
                          <SelectTrigger className="ml-auto w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

