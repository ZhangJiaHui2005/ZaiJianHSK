import { useUser } from "@clerk/clerk-react"

export default function UserDashboard() {
  const { user } = useUser()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {user?.username || user?.firstName || "User"}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          This is your personal dashboard.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Vocabulary</h2>
          <p className="mt-1 text-sm text-muted-foreground">0 words learned</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Lessons</h2>
          <p className="mt-1 text-sm text-muted-foreground">0 lessons completed</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Streak</h2>
          <p className="mt-1 text-sm text-muted-foreground">0 days</p>
        </div>
      </div>
    </div>
  )
}

