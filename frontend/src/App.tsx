import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { Button } from "./components/ui/button"

export function App() {
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
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>We&apos;ve already added the button component for you.</p>
            <Button className="mt-2">Button</Button>
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
