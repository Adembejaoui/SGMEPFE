// =============================================================================
// DASHBOARD SIDEBAR - SGME
// =============================================================================
// This component provides the sidebar navigation for the dashboard.
// It displays different menu items based on the user's role:
// - ADMIN: Full access to all features
// - EMPLOYE: Limited access to employé-specific features
// - TECHNICIEN: Limited access to technicien-specific features
//
// The sidebar is responsive and can be toggled on mobile devices.
// =============================================================================

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Settings, 
  User,
  Menu,
  X,
  ChevronDown,
  Wrench,
  ClipboardList,
  FileText,
  LogOut,
  Sun,
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Session } from "next-auth"

type MenuItem = {
  title: string
  href: string
  icon: any
  submenu?: ReadonlyArray<{
    title: string
    href: string
    icon: any
  }>
}

// =============================================================================
// SIDEBAR PROPS
// =============================================================================
// Props for the DashboardSidebar component.
// role: The user's role (ADMIN, EMPLOYE, TECHNICIEN)
// session: The current user session containing user information.
// =============================================================================
interface DashboardSidebarProps {
  role: string
  session: Session
}

// =============================================================================
// MENU ITEMS CONFIGURATION
// =============================================================================
// Defines all possible menu items with their roles and icons.
// Each item specifies which roles can access it.
// =============================================================================
export const menuByRole = {
  ADMIN: [
    {
      title: "Tableau de board",
      href: "/dashboard/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Mon profil",
      href: "/dashboard/profile",
      icon: Wrench,
    },
    {
      title: "Gestion des utilisateurs",
      href: "/dashboard/admin/users",
      icon: Users,
      submenu: [
        {
          title: "Liste des utilisateurs",
          href: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Créer un utilisateur",
          href: "/dashboard/admin/users/create",
          icon: UserPlus,
        },
      ],
    },
    {
      title: "Gestion des équipements",
      href: "/dashboard/admin/equipment",
      icon: Wrench,
    },
    {
      title: "Supervision des maintenances",
      href: "/dashboard/admin/maintenance",
      icon: ClipboardList,
    },
    {
      title: "Rapports & statistiques",
      href: "/dashboard/admin/reports",
      icon: FileText,
    },
    {
      title: "Paramètres système",
      href: "/dashboard/admin/settings",
      icon: Settings,
    },
  ],

  TECHNICIEN: [
    {
      title: "Tableau de board",
      href: "/dashboard/technicien",
      icon: LayoutDashboard,
    },
    {
      title: "Mes interventions",
      href: "/dashboard/technicien/interventions",
      icon: ClipboardList,
    },
    {
      title: "Équipements assignés",
      href: "/dashboard/technicien/equipment",
      icon: Wrench,
    },
    {
      title: "Rapports d’intervention",
      href: "/dashboard/technicien/reports",
      icon: FileText,
    },
    {
      title: "Mon profil",
      href: "/dashboard/profile",
      icon: User,
    },
  ],

  EMPLOYE: [
    {
      title: "Tableau de board",
      href: "/dashboard/employe",
      icon: LayoutDashboard,
    },
    {
      title: "Signaler une panne",
      href: "/dashboard/employe/requests/create",
      icon: ClipboardList,
    },
    {
      title: "Mes demandes",
      href: "/dashboard/employe/requests",
      icon: FileText,
    },
    {
      title: "Mon profil",
      href: "/dashboard/profile",
      icon: User,
    },
  ],
} as const

// =============================================================================
// DASHBOARD SIDEBAR COMPONENT
// =============================================================================
// Main sidebar component that renders navigation based on user role.
// =============================================================================
export function DashboardSidebar({ role, session }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme")
      if (saved === "dark") {
        setIsDark(true)
        document.documentElement.classList.add("dark")
      } else if (saved === "light") {
        setIsDark(false)
        document.documentElement.classList.remove("dark")
      } else {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        setIsDark(prefersDark)
        if (prefersDark) document.documentElement.classList.add("dark")
      }
    } catch (e) {
      // ignore (SSR safety)
    }
  }, [])

  const applyTheme = (dark: boolean) => {
    try {
      if (dark) document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", dark ? "dark" : "light")
    } catch (e) {
      // ignore
    }
  }

  // =============================================================================
  // TOGGLE EXPANDED ITEM
  // =============================================================================
  // Toggles the expanded state of menu items with submenus.
  // =============================================================================
  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  // =============================================================================
  // HANDLE SIGN OUT
  // =============================================================================
  // Signs out the user and redirects to the login page.
  // =============================================================================
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  // =============================================================================
  // GET USER INITIALS
  // =============================================================================
  // Gets user initials from name for avatar display.
  // =============================================================================
  const getUserInitials = () => {
    if (session.user?.name) {
      const names = session.user.name.split(" ")
      return names.map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return session.user?.email?.[0]?.toUpperCase() || "U"
  }

  // =============================================================================
  // FILTER MENU ITEMS BY ROLE
  // =============================================================================
  // Filters menu items to show only those accessible by the current user's role.
  // =============================================================================
  const filteredMenuItems = menuByRole[role as keyof typeof menuByRole] || []

  // =============================================================================
  // RENDER MENU ITEM
  // =============================================================================
  // Renders a single menu item with optional submenu.
  // =============================================================================
  const renderMenuItem = (item: MenuItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedItems.includes(item.title)

    return (
      <div key={item.title}>
        {/* Main menu item */}
        <Link
          href={hasSubmenu ? "#" : item.href}
          onClick={hasSubmenu ? () => toggleExpanded(item.title) : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="flex-1">{item.title}</span>
          {hasSubmenu && (
            <ChevronDown 
              className={cn(
                "w-4 h-4 transition-transform",
                isExpanded && "rotate-180"
              )} 
            />
          )}
        </Link>

        {/* Submenu */}
        {hasSubmenu && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.submenu?.map(subItem => (
              <Link
                key={subItem.href}
                href={subItem.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === subItem.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <subItem.icon className="w-4 h-4" />
                {subItem.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r border-border transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Menu</h2>
              <p className="text-sm text-muted-foreground">
                {role === "ADMIN" && "Administrateur"}
                {role === "EMPLOYE" && "Employé"}
                {role === "TECHNICIEN" && "Technicien"}
              </p>
            </div>

            {/* Theme toggle */}
            <div className="ml-2">
              <button
                aria-label="Toggle theme"
                title="Toggle theme"
                onClick={() => {
                  const next = !isDark
                  setIsDark(next)
                  applyTheme(next)
                }}
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map(renderMenuItem)}
          </nav>

          {/* User profile dropdown */}
          <div className="p-4 border-t border-border">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {session.user?.name || session.user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user?.role}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  profileDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Profile dropdown menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">
                        {session.user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {session.user?.role}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profil
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
