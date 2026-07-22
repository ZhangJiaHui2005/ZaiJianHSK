import { useEffect, useState, useRef } from "react"
import { Outlet } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { syncUserToDB } from "./lib/api"

export function App() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [syncing, setSyncing] = useState(false)
  const syncedRef = useRef(false)

  // Sync user to MongoDB once after Clerk has fully loaded
  useEffect(() => {
    // Only proceed once Clerk has finished loading AND user is signed in
    if (!isLoaded || !isSignedIn || !user || syncing || syncedRef.current)
      return

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
        syncedRef.current = true
      } catch (error) {
        console.error("❌ Failed to sync user:", error)
      } finally {
        setSyncing(false)
      }
    }

    syncUser()
  }, [user, isLoaded, isSignedIn]) // depend on isLoaded to ensure Clerk is ready

  // Reset sync flag when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      syncedRef.current = false
    }
  }, [isLoaded, isSignedIn])

  return (
    <div className="min-h-svh">
      <Outlet />
    </div>
  )
}

export default App
