import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { TopHeader } from '@/components/layout/TopHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function UserLayout() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-1 bg-background font-sans text-foreground antialiased">
        <AppSidebar />

        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

          <main className="flex-1 p-6 lg:p-8 *:w-full *:max-w-none">
            <Outlet context={{ searchQuery }} />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
