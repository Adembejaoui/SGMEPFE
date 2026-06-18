// =============================================================================
// DASHBOARD LAYOUT - SGME
// =============================================================================
// This layout wraps all dashboard pages and provides:
// - Sidebar navigation with role-based menu items
// - Top navbar with user info
// - Responsive design for desktop/tablet/mobile
//
// The layout automatically adapts based on the user's role:
// - ADMIN: Full access to all menu items
// - EMPLOYE: Limited access to employé-specific items
// - TECHNICIEN: Limited access to technicien-specific items
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

// =============================================================================
// DASHBOARD LAYOUT COMPONENT
// =============================================================================
// Main layout component for all dashboard pages.
// Fetches the current session and passes it to child components.
// =============================================================================
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  // Redirect to change password if user must change password
  if (session.user.mustChangePassword) {
    redirect("/change-password")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        {/* Sidebar navigation */}
        <DashboardSidebar role={session.user.role} session={session} />
        
        {/* Main content area */}
        <main className="flex-1 flex-col min-h-[calc(100vh-4rem)] p-4 lg:p-6 ml-0 lg:ml-64">
          <div className="w-full max-w-7xl mx-auto flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
