// =============================================================================
// DASHBOARD PAGE - SGME
// =============================================================================
// This page serves as the main dashboard entry point.
// It redirects users to their role-specific dashboard:
// - ADMIN → /dashboard/admin
// - EMPLOYE → /dashboard/employe
// - TECHNICIEN → /dashboard/technicien
//
// This ensures each user type lands on their dedicated dashboard
// when accessing /dashboard directly.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

// =============================================================================
// DASHBOARD PAGE COMPONENT
// =============================================================================
// Main dashboard page that redirects to role-specific dashboard.
// =============================================================================
export default async function DashboardPage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {  
    redirect("/login")
  }
  if (session?.user.mustChangePassword){ 
    redirect("/change-password")
  }


  // Redirect to role-specific dashboard based on user role
  const role = session.user.role

  switch (role) {
    case "ADMIN":
      redirect("/dashboard/admin")
    case "EMPLOYE":
      redirect("/dashboard/employe")
    case "TECHNICIEN":
      redirect("/dashboard/technicien")
    default:
      // Default to employe dashboard if role is not recognized
      redirect("/dashboard/employe")
  }
}
