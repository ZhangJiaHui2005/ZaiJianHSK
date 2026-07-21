import React from "react"
import { Button } from "@/components/ui/button"

/**
 * AppErrorBoundary – a class-based React error boundary that wraps
 * the entire app to catch any uncaught render errors and prevent
 * the white screen of death.
 *
 * NOTE: We do NOT use React Router's errorElement or useRouteError
 * because React Router v7's <Navigate> throws internal redirect
 * responses (ErrorResponseImpl) that would be caught and cause
 * cascading error boundary triggers. Instead, we replaced all
 * <Navigate> usage with useNavigate() via a useEffect pattern.
 */
interface AppErrorBoundaryProps {
  children: React.ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, _info: React.ErrorInfo) {
    // Silently suppress ErrorResponseImpl / redirect responses from
    // React Router v7 – these are not real errors.
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as any).status === "number" &&
      (error as any).status >= 300 &&
      (error as any).status < 400
    ) {
      return
    }
    console.error("[AppErrorBoundary] Uncaught error:", error, _info)
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error

      // If the error is a redirect/navigation response, silently recover
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof (error as any).status === "number" &&
        (error as any).status >= 300 &&
        (error as any).status < 400
      ) {
        this.state = { hasError: false, error: null }
        return this.props.children
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
              <span className="text-3xl">⚠</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Application Error
            </h2>
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please refresh the page to try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="w-full rounded-lg border bg-muted/30 p-3 text-left text-xs break-all whitespace-pre-wrap text-destructive">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            )}
            <Button variant="default" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
