import { Outlet, Link, useLocation } from "react-router-dom"
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"

export default function UserLayout() {
  const { user } = useUser()
  const location = useLocation()

  return (
    <div className="flex min-h-svh flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">
            ZaiJianHSK
          </Link>
          <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/user"
            className={`transition-colors hover:text-foreground ${
              location.pathname === "/user" ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="text-sm text-muted-foreground">
              {user?.username || user?.firstName || "User"}
            </span>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

