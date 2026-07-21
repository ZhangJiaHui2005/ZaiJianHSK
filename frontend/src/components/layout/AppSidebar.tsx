import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  PlusCircle,
  Gamepad2,
  Sprout,
  Users,
  Sparkles,
} from 'lucide-react'

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
      label: 'Giải trí',
      path: '/user/arcade',
      icon: Gamepad2,
    },
    {
      label: 'Trại ươm',
      path: '/user/garden',
      icon: Sprout,
    },
  ]

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col justify-between border-r border-slate-800/80 bg-[#0b0f19] px-4 py-5 text-slate-300 shrink-0">
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950 shadow-lg shadow-emerald-500/20 text-xl tracking-tight">
            再
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
              ZaiJian<span className="text-emerald-400">HSK</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
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
              (item.path === '/user' && location.pathname === '/user')

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-emerald-400" />
                )}
                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Promotional Banners */}
      <div className="flex flex-col gap-3 pt-4">
        {/* Banner 1: Community */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-950/80 p-3.5 border border-blue-500/20 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-200">
            <Users className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Cộng đồng ZaiJianHSK</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-300/80 leading-snug">
            Chia sẻ từ vựng HSK, kinh nghiệm luyện đề mỗi ngày
          </p>
          <button className="mt-2 inline-flex items-center rounded-lg bg-blue-500 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-blue-400">
            Tham gia ngay &rarr;
          </button>
        </div>

        {/* Banner 2: Feedback */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900/60 to-pink-950/80 p-3.5 border border-purple-500/20 text-xs">
          <div className="flex items-center gap-2 font-bold text-purple-200">
            <Sparkles className="h-4 w-4 text-pink-400 shrink-0" />
            <span>Đánh giá ZaiJianHSK</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-300/80 leading-snug">
            Chia sẻ cảm nhận để góp phần cải thiện app tốt hơn
          </p>
          <button className="mt-2 inline-flex items-center rounded-lg bg-pink-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-pink-500">
            Gửi đánh giá &rarr;
          </button>
        </div>
      </div>
    </aside>
  )
}
