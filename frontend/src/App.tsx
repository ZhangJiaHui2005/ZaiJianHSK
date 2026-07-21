import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { useEffect, useState } from "react"
import { Button } from "./components/ui/button"
import { syncUserToDB } from "./lib/api"

export function App() {
  const { user } = useUser()
  const [syncing, setSyncing] = useState(false)

  // Đồng bộ user lên MongoDB khi đăng nhập Clerk thành công
  useEffect(() => {
    if (!user || syncing) return

    const syncUser = async () => {
      setSyncing(true)
      try {
        const email = user.primaryEmailAddress?.emailAddress
        if (!email) {
          console.warn("User has no email address")
          return
        }

        const result = await syncUserToDB({
          clerkId: user.id,
          username: user.username,
          email,
        })
        console.log("✅ User synced to MongoDB:", result.message)
      } catch (error) {
        console.error("❌ Failed to sync user:", error)
      } finally {
        setSyncing(false)
      }
    }

    syncUser()
  }, [user])

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        {/* Clerk Auth UI */}
        <div className="flex items-center justify-between">
          <h1 className="font-medium">ZaiJianHSK</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <SignedOut>
          <div className="rounded-lg border p-4 text-center">
            <p className="mb-3">Please sign in to continue</p>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div>
            <h1 className="font-medium">Welcome, {user?.username || user?.firstName || "User"}!</h1>
            <p className="mt-1 text-muted-foreground">
              {syncing ? "Syncing to database..." : "✅ User data saved to MongoDB"}
            </p>
          </div>
        </SignedIn>

        <div className="font-mono text-xs text-muted-foreground">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
