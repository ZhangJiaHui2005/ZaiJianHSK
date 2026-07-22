import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { TopHeader } from '@/components/layout/TopHeader'

export default function UserLayout() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Fixed Left Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navigation Header */}
        <TopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Dynamic Route Outlet */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  )
}
