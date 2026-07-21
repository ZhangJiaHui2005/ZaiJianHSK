import React from 'react'
import { Search, Sun, Moon, Globe, LogIn } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TopHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  searchQuery = '',
  onSearchChange,
}) => {
  const { user } = useUser()
  const [isDarkMode, setIsDarkMode] = React.useState(true)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0e1322]/90 px-6 backdrop-blur-md">
      {/* Search Input Bar */}
      <div className="relative flex flex-1 max-w-md items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 z-10" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Tìm trong thư viện HSK (ví dụ: HSK 4, Reading, 成语...)"
          className="w-full rounded-xl border border-slate-800 bg-[#161c2e] py-2 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500 transition-colors"
        />
        <kbd className="absolute right-3 hidden rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
          /
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl border-slate-800 bg-[#161c2e] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          title="Đổi giao diện"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#161c2e] px-3 py-1.5 text-xs font-semibold text-slate-300">
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <span>VN</span>
        </div>

        {/* Clerk Authentication */}
        <div className="flex items-center gap-2 pl-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl px-4 flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
              >
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs font-medium text-slate-300 md:inline-block">
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
