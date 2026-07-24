import React, { useState } from 'react'
import { useUser, SignedOut, SignedIn, SignInButton } from "@clerk/clerk-react"
import { Navigate } from "react-router-dom"
import {
  Sparkles,
  RotateCcw,
  Mic,
  Trophy,
  BarChart3,
  MessageCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Tạo thẻ từ bằng AI',
    desc: 'Nhập một từ — AI gợi ý pinyin, nghĩa, câu ví dụ và ảnh minh hoạ. Thẻ vào thẳng luồng ôn tập, không cần tra cứu thêm.',
  },
  {
    icon: RotateCcw,
    title: 'Spaced Repetition',
    desc: 'Ôn đúng lúc sắp quên, sắp xếp theo từng cấp HSK, giúp Hán tự bám lâu hơn thay vì học dồn một lần.',
  },
  {
    icon: Mic,
    title: 'Luyện phát âm & thanh điệu AI',
    desc: 'Chấm điểm phát âm và 4 thanh theo thời gian thực — lỗi sai thường gặp được chỉ ra ngay để bạn sửa.',
  },
  {
    icon: Trophy,
    title: 'Gamification & đấu hạng',
    desc: 'Chuỗi ngày học, huy hiệu theo cấp độ và bảng xếp hạng tuần — thưởng cho ngày bạn chịu khó ôn đều.',
  },
  {
    icon: BarChart3,
    title: 'Thống kê & tiến độ',
    desc: 'Biểu đồ streak, số Hán tự đã thuộc theo từng cấp HSK và báo cáo tuần — nhìn thẳng vào thói quen học.',
  },
  {
    icon: MessageCircle,
    title: 'Cộng đồng học tiếng Trung',
    desc: 'Bảng tin chia sẻ mẹo học, minigame và động lực cùng những người học HSK khác mỗi ngày.',
  },
]

const DECKS = [
  { level: 'HSK 1', words: '150 từ', tag: 'Nhập môn' },
  { level: 'HSK 2', words: '300 từ', tag: 'Cơ bản' },
  { level: 'HSK 3', words: '600 từ', tag: 'Giao tiếp' },
  { level: 'HSK 4', words: '1.200 từ', tag: 'Trung cấp' },
  { level: 'HSK 5', words: '2.500 từ', tag: 'Nâng cao' },
  { level: 'HSK 6', words: '5.000 từ', tag: 'Thành thạo' },
]

const FAQS = [
  {
    q: 'Học bằng AI trong ZaiJianHSK khác gì flashcard thông thường?',
    a: 'Flashcard truyền thống chỉ giúp bạn "đọc lại — nhớ tạm". AI của ZaiJianHSK tạo ví dụ theo đúng ngữ cảnh HSK bạn đang học, và luyện phát âm để trí nhớ gắn với âm thanh thật, không chỉ mặt chữ.',
  },
  {
    q: 'Spaced repetition được áp dụng thế nào cho việc nhớ Hán tự và thanh điệu?',
    a: 'Mỗi thẻ có lịch ôn riêng dựa trên độ khó bạn thực tế gặp phải — từ dễ quên được đẩy lên ôn sớm hơn, từ đã nhớ chắc giãn ra xa hơn, tối ưu thời gian học mỗi ngày.',
  },
  {
    q: 'ZaiJianHSK có phù hợp với người mới bắt đầu học tiếng Trung không?',
    a: 'Có. Lộ trình bắt đầu từ HSK 1 với bộ từ giới hạn, phát âm được luyện chậm và rõ, phù hợp cho người chưa từng học chữ Hán trước đó.',
  },
  {
    q: 'Nên học bao nhiêu từ mới mỗi ngày là hợp lý?',
    a: 'Không có con số chuẩn cho tất cả mọi người. ZaiJianHSK gợi ý khối lượng dựa trên tốc độ ôn thực tế của bạn, để số từ mới không vượt quá khả năng ôn lại của những ngày sau.',
  },
  {
    q: 'Luyện phát âm AI đóng vai trò gì khi tiếng Trung có thanh điệu?',
    a: 'Sai thanh điệu đổi nghĩa của từ. AI chấm điểm riêng từng thanh trong khi bạn luyện nói, giúp bạn nhận ra lỗi ngay thay vì mang lỗi phát âm đi rất lâu mới sửa.',
  },
  {
    q: 'Streak và bảng xếp hạng có làm lệch mục tiêu học đúng không?',
    a: 'Đó là lý do gamification trong ZaiJianHSK luôn đi kèm chỉ số ôn đúng lịch, không chỉ số lượng — để chuỗi ngày học phản ánh trí nhớ thật, không phải chỉ thao tác nhanh cho đủ chỉ tiêu.',
  },
]

function FlashCard({
  hanzi,
  pinyin,
  meaning,
  rotate,
  className = '',
}: {
  hanzi: string
  pinyin: string
  meaning: string
  rotate: number
  className?: string
}) {
  return (
    <Card
      className={`absolute w-40 px-5 py-4 shadow-lg select-none border-border ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="text-3xl font-bold leading-none text-foreground">{hanzi}</div>
      <div className="mt-1 text-sm font-semibold text-foreground/70">{pinyin}</div>
      <div className="text-xs mt-0.5 text-muted-foreground">{meaning}</div>
    </Card>
  )
}

function Seal() {
  return (
    <div
      className="absolute flex items-center justify-center w-24 h-24 rounded-full bg-foreground shadow-lg"
      style={{ transform: 'rotate(-9deg)' }}
    >
      <span
        className="text-lg font-bold text-background"
        style={{ writingMode: 'vertical-rl', letterSpacing: '2px' }}
      >
        再见
      </span>
    </div>
  )
}

function MarketingPage() {
  const [openFaq, setOpenFaq] = useState<string>('faq-0')

  return (
    <div className="bg-background text-foreground">
      {/* ---------------- Nav ---------------- */}
      <header className="sticky top-0 z-30 backdrop-blur border-b border-border bg-background/90">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-foreground">
              <span className="text-sm font-bold text-background">汉</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">ZaiJianHSK</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#tinh-nang" className="hover:text-foreground transition-colors">
              Tính năng
            </a>
            <a href="#bo-tu" className="hover:text-foreground transition-colors">
              Bộ từ HSK
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              Câu hỏi thường gặp
            </a>
          </nav>

          <SignInButton mode="modal">
            <Button variant="outline" className="rounded-full">
              Đăng nhập
            </Button>
          </SignInButton>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 bg-muted text-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Học Hán tự cùng AI, miễn phí để bắt đầu
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-6">
            Học từ vựng tiếng Trung
            <br />
            cùng ZaiJianHSK
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-md text-muted-foreground">
            Kết hợp AI, lặp lại ngắt quãng và luyện phát âm chuẩn thanh điệu để bạn
            ghi nhớ Hán tự lâu hơn — tự tin chinh phục HSK 1 đến 6.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <SignInButton mode="modal">
              <Button size="lg" className="rounded-full">
                Bắt đầu học miễn phí
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button size="lg" variant="ghost">
                Đã có tài khoản? Đăng nhập →
              </Button>
            </SignInButton>
          </div>

          <div className="flex items-center gap-8">
            {[
              ['6', 'Cấp độ HSK'],
              ['9.700+', 'Từ vựng có sẵn'],
              ['4', 'Thanh điệu luyện AI'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="text-2xl font-black">{n}</div>
                <div className="text-xs mt-0.5 text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual: fanned flashcards + seal stamp, monochrome */}
        <div className="relative h-96 hidden sm:block">
          <FlashCard hanzi="你好" pinyin="nǐ hǎo" meaning="xin chào" rotate={-10} className="top-8 left-5" />
          <FlashCard hanzi="谢谢" pinyin="xiè xie" meaning="cảm ơn" rotate={6} className="top-2 left-48" />
          <FlashCard hanzi="加油" pinyin="jiā yóu" meaning="cố lên" rotate={-3} className="top-44 left-24" />
          <div className="absolute top-52 left-80">
            <Seal />
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="tinh-nang" className="border-t border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-xl mb-14">
            <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">
              Tính năng nổi bật
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Mọi thứ bạn cần để chinh phục HSK
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Tất cả gói trong một ứng dụng — không cần nhảy qua nhiều app khác nhau
              để học từ, luyện phát âm và theo dõi tiến độ.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="p-6 border-border transition hover:-translate-y-1 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-foreground">
                  <f.icon className="h-[19px] w-[19px] text-background" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Deck showcase ---------------- */}
      <section id="bo-tu" className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">
              Bộ từ theo cấp độ
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Bắt đầu ngay với bộ từ HSK có sẵn
            </h2>
          </div>
          <SignInButton mode="modal">
            <Button variant="link" className="gap-1.5 px-0">
              Xem tất cả bộ từ <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </SignInButton>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DECKS.map((d) => (
            <Card
              key={d.level}
              className="p-6 flex items-center justify-between transition hover:-translate-y-1 cursor-pointer border-border bg-muted/40"
            >
              <div>
                <div className="text-xl font-black">{d.level}</div>
                <div className="text-sm mt-1 text-muted-foreground">
                  {d.words} · {d.tag}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center border border-border bg-background">
                <ArrowRight className="h-[15px] w-[15px]" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------- CTA banner ---------------- */}
      <section className="border-y border-border bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Sẵn sàng nâng cấp vốn Hán tự của bạn?
          </h2>
          <p className="mb-8 text-background/70">
            Tham gia ZaiJianHSK và bắt đầu lộ trình ôn tập cá nhân hoá ngay hôm nay.
          </p>
          <SignInButton mode="modal">
            <Button size="lg" variant="secondary" className="rounded-full">
              Bắt đầu học miễn phí
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </SignInButton>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">
            Câu hỏi thường gặp
          </div>
          <h2 className="text-3xl font-black tracking-tight">Cách ZaiJianHSK vận hành</h2>
        </div>

        <Accordion
          type="single"
          collapsible
          value={openFaq}
          onValueChange={(v) => setOpenFaq(v ?? '')}
        >
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base sm:text-lg font-medium hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-foreground">
              <span className="text-xs font-bold text-background">汉</span>
            </div>
            <span className="text-sm font-semibold">ZaiJianHSK</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZaiJianHSK. Học tiếng Trung mỗi ngày.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser()

  // Show nothing while Clerk is loading
  if (!isLoaded) {
    return null
  }

  // If user is signed in, redirect to /user dashboard
  if (isSignedIn) {
    return <Navigate to="/user" replace />
  }

  // Otherwise show the marketing landing page
  return <MarketingPage />
}

