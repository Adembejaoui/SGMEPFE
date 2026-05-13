// =============================================================================
// CHANGE PASSWORD PAGE - SGME
// =============================================================================
// This page is displayed when a user must change their password on first login.
// It provides:
// - New password field
// - Confirm password field
// - Password validation
//
// After successful password change, the user is redirected to their dashboard.
// The mustChangePassword flag is set to false in the database.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChangePasswordForm } from "@/components/change-password-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertTriangle } from "lucide-react"

// =============================================================================
// CHANGE PASSWORD PAGE COMPONENT
// =============================================================================
// Main component for the change password page.
// Displays a form for changing the user's password.
// =============================================================================
export default async function ChangePasswordPage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  // If user doesn't need to change password, redirect to dashboard
  if (!session.user.mustChangePassword) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Changement de mot de passe requis</CardTitle>
            <CardDescription>
              Vous devez changer votre mot de passe avant de continuer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-sm text-yellow-700">
                Pour des raisons de sécurité, vous devez changer votre mot de passe temporaire 
                avant d'accéder à votre tableau de bord.
              </p>
            </div>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
