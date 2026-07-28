import { useUser } from "@clerk/clerk-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function UserDashboard() {
  const { user } = useUser()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Welcome back, {user?.username || user?.firstName || "User"}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is your personal learning dashboard.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Vocabulary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">words learned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-primary">0</p>
            <p className="text-xs text-muted-foreground mt-1">lessons completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-500">0 days</p>
            <p className="text-xs text-muted-foreground mt-1">keep it up!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


