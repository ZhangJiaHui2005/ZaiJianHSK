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
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Activity, Shield } from "lucide-react"

export default function AdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    const fetchRole = async () => {
      try {
        const data = await getUserByClerkId(user.id)
        if (data) {
          setUserRole((data as any).role || "user")
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchRole()
  }, [user, isLoaded, isSignedIn])

  const stats = [
    {
      title: "Total Users",
      value: "—",
      icon: Users,
      description: "All registered users",
    },
    {
      title: "Active Today",
      value: "—",
      icon: Activity,
      description: "Users active today",
    },
    {
      title: "Your Role",
      value: userRole || "—",
      icon: Shield,
      description: "Current access level",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the platform, users, and content.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{stat.title}</CardTitle>
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {stat.value === "—" ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <span className="capitalize text-primary">{stat.value}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

