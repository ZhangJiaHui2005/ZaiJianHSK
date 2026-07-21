import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { syncUserToDB } from "./lib/api"

export function App() {
  const { user } = useUser()
  const [syncing, setSyncing] = useState(false)

  // Sync user to MongoDB on Clerk login
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
    <div className="min-h-svh">
      <Outlet />
    </div>
  )
}

export default App
