import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const { user } = useUser()

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border p-6">
        <h1 className="text-2xl font-bold">ZaiJianHSK</h1>
        <p className="mt-2 text-muted-foreground">Learn Chinese with confidence. Master HSK vocabulary and grammar.</p>
      </div>

      <SignedOut>
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-4 text-lg">Please sign in to get started</p>
          <SignInButton mode="modal">
            <Button size="lg">Sign In</Button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            to="/user"
            className="rounded-lg border p-6 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-lg font-semibold">User Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View your learning progress and study materials.
            </p>
          </Link>

          {user && (
            <div className="rounded-lg border p-6">
              <h2 className="text-lg font-semibold">Welcome Back</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as <strong>{user?.username || user?.firstName || user?.emailAddresses?.[0]?.emailAddress}</strong>
              </p>
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  )
}

