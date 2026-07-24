import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  PlusCircle,
  Gamepad2,
  Sprout,
  Users,
  Sparkles,
  Compass,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = () => {
  const location = useLocation()

  const navItems = [
    {
      label: 'Thư viện',
      path: '/user',
      icon: BookOpen,
    },
    {
      label: 'Thêm từ',
      path: '/user/add-word',
      icon: PlusCircle,
    },
    {
      label: 'Cộng đồng',
      path: '/user/community',
      icon: Compass,
    },
  ]

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground shrink-0">
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground shadow-md text-xl tracking-tight">
            再
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-foreground flex items-center gap-1">
              ZaiJian<span className="text-primary">HSK</span>
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
              Chinh Phục Tiếng Trung
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path === '/user' && location.pathname === '/user') ||
              (item.path !== '/user' && location.pathname.startsWith(item.path))

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Promotional Banners */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Banner 1: Community */}
        <Card className="border border-border/60 bg-muted/40 p-3.5 shadow-none">
          <CardContent className="p-0 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <span>Cộng đồng ZaiJianHSK</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Chia sẻ từ vựng HSK, kinh nghiệm luyện đề mỗi ngày
            </p>
            <Button size="sm" className="mt-2.5 h-7 text-[10px] font-bold px-2.5 rounded-md w-full">
              <Link to='/user/community'>
                Tham gia ngay &rarr;
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Banner 2: Feedback */}
        <Card className="border border-border/60 bg-muted/40 p-3.5 shadow-none">
          <CardContent className="p-0 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>Đánh giá ZaiJianHSK</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Chia sẻ cảm nhận để góp phần cải thiện app tốt hơn
            </p>
            <Button variant="secondary" size="sm" className="mt-2.5 h-7 text-[10px] font-bold px-2.5 rounded-md w-full">
              Gửi đánh giá &rarr;
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
