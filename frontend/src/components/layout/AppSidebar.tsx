import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, PlusCircle, Users, Sparkles, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ onClose }) => {
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
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="px-4 py-5">
        <Link to="/" className="flex items-center gap-3 px-2" onClick={onClose}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-black tracking-tight text-primary-foreground shadow-md">
            再
          </div>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-lg font-black tracking-tight text-foreground">
              ZaiJian<span className="text-primary">HSK</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Chinh Phục Tiếng Trung
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/user'
                  ? location.pathname === '/user'
                  : location.pathname.startsWith(item.path)

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      'h-auto rounded-xl px-3.5 py-3 text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                    render={
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className="flex w-full items-center gap-3.5"
                      >
                        {isActive && (
                          <span className="h-5 w-1 rounded-r-full bg-primary" />
                        )}
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isActive ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0 my-2 bg-border/60" />

      <SidebarFooter className="flex flex-col gap-3 border-t border-border/60 px-3 py-4">
        <Card className="border border-border/60 bg-muted/40 p-3.5 shadow-none">
          <CardContent className="p-0 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <span>Cộng đồng ZaiJianHSK</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Chia sẻ từ vựng HSK, kinh nghiệm luyện đề mỗi ngày
            </p>
            <Link
              to="/user/community"
              onClick={onClose}
              className="mt-2.5 flex h-7 w-full items-center justify-center rounded-md bg-primary px-2.5 text-[10px] font-bold text-primary-foreground"
            >
              Tham gia ngay &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-muted/40 p-3.5 shadow-none">
          <CardContent className="p-0 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              <span>Đánh giá ZaiJianHSK</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Chia sẻ cảm nhận để góp phần cải thiện app tốt hơn
            </p>
            <Link
              to="/user/community"
              onClick={onClose}
              className="mt-2.5 flex h-7 w-full items-center justify-center rounded-md bg-secondary px-2.5 text-[10px] font-bold text-secondary-foreground"
            >
              Gửi đánh giá &rarr;
            </Link>
          </CardContent>
        </Card>
      </SidebarFooter>
    </Sidebar>
  )
}
