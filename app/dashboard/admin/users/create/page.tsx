// =============================================================================
// ADMIN CREATE USER PAGE - SGME
// =============================================================================
// This page allows administrators to create new users.
// It provides a form with all required fields:
// - First name
// - Last name
// - Email
// - Phone (optional)
// - Role (ADMIN, EMPLOYE, TECHNICIEN)
// - Temporary password
// - Status (active/inactive)
//
// When creating a user, mustChangePassword is set to true by default.
// This forces the user to change their password on first login.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CreateUserForm } from "@/components/admin/create-user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// =============================================================================
// CREATE USER PAGE COMPONENT
// =============================================================================
// Main component for the create user page.
// Renders the create user form with all necessary fields.
// =============================================================================
export default async function CreateUserPage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer un utilisateur</h1>
          <p className="text-muted-foreground">
            Créez un nouveau compte utilisateur
          </p>
        </div>
      </div>

      {/* Create user form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'utilisateur</CardTitle>
          <CardDescription>
            Remplissez tous les champs obligatoires pour créer un nouvel utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
    </div>
  )
}
