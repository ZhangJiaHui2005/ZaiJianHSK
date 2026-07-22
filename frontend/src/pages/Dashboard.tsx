import { useUser, SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const { user } = useUser()

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-black">ZaiJianHSK</CardTitle>
          <CardDescription className="text-base">
            Learn Chinese with confidence. Master HSK vocabulary and grammar.
          </CardDescription>
        </CardHeader>
      </Card>

      <SignedOut>
        <Card className="text-center py-6">
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-lg font-medium text-muted-foreground">Please sign in to get started</p>
            <SignInButton mode="modal">
              <Button size="lg" className="font-bold">Sign In</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link to="/user">
            <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">User Dashboard</CardTitle>
                <CardDescription>
                  View your learning progress and study materials.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {user && (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Welcome Back</CardTitle>
                <CardDescription>
                  Signed in as <strong>{user?.username || user?.firstName || user?.emailAddresses?.[0]?.emailAddress}</strong>
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </SignedIn>
    </div>
  )
}


