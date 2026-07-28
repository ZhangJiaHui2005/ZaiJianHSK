import React from 'react'
import { Search, Sun, Moon, Globe, LogIn } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTheme } from '../theme-provider'

interface TopHeaderProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery = "",
  onSearchChange,
}) => {
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="md:hidden" />

        {/* Search Input Bar */}
        <div className="relative flex min-w-0 flex-1 max-w-md items-center">
          <Search className="absolute left-3.5 z-10 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Tìm trong thư viện HSK (ví dụ: HSK 4, Reading, 成语...)"
            className="w-full rounded-xl pl-10 pr-10 text-sm placeholder:text-muted-foreground transition-colors"
          />
          <kbd className="absolute right-3 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light Mode Toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl transition-colors"
          title="Đổi giao diện"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Language Selector */}
        <Badge variant="outline" className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span>VN</span>
        </Badge>

        {/* Clerk Authentication */}
        <div className="flex items-center gap-2 pl-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="font-bold rounded-xl px-4 flex items-center gap-1.5 shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-medium text-muted-foreground md:inline-block">
                {user?.username || user?.firstName || 'Học viên'}
              </span>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
}

