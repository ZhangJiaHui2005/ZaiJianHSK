import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { UserButton, useClerk, useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"
import { getUserByClerkId } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutDashboard, LogOut, Users, FileClock } from "lucide-react"

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Manage Users", icon: Users },
  { path: "/admin/pending-vocabulary", label: "Pending", icon: FileClock },
]

export default function AdminLayout() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const location = useLocation()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return

    const fetchRole = async () => {
      try {
        const userData = await getUserByClerkId(user.id)
        if (userData) {
          setUserRole((userData as any).role || "user")
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [user, isLoaded, isSignedIn])

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-4">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  if (userRole !== "admin") {
    return <Navigate to="/user" replace />
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link
            to="/"
            className="flex items-center gap-2 px-2 text-lg font-semibold"
          >
            <span className="truncate group-data-[collapsible=icon]:hidden">
              ZaiJianHSK Admin
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.path}
                        tooltip={item.label}
                        render={<Link to={item.path} />}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger className={"w-full"}>
                  <span className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-accent">
                    <span className="flex items-center gap-3">
                      <UserButton />
                      <span className="truncate text-sm">{user.username}</span>
                    </span>
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" className="w-48">
                  <DropdownMenuItem
                    onClick={() => signOut(() => window.location.assign("/"))}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground">
            Admin Panel
          </span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
