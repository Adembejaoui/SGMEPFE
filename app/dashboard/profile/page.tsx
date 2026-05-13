// =============================================================================
// DASHBOARD PROFILE PAGE - SGME
// =============================================================================
// This page allows all users to view and edit their profile from the dashboard.
// It provides:
// - User information display
// - Edit profile form
// - Change password option
//
// All authenticated users can access this page.
// Users can only edit their own profile.
// =============================================================================

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, Shield, Calendar, Clock } from "lucide-react"

// =============================================================================
// DASHBOARD PROFILE PAGE COMPONENT
// =============================================================================
// Main component for the dashboard profile page.
// Fetches user data and displays the profile form.
// =============================================================================
export default async function DashboardProfilePage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  // Fetch user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Vos informations de compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.firstName}
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div>
                <p className="text-xl font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  user.role === "ADMIN" 
                    ? "bg-primary/10 text-primary"
                    : user.role === "EMPLOYE"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-green-500/10 text-green-500"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">
                    {user.phone || "Non renseigné"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Statut</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Membre depuis</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dernière mise à jour</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit profile form */}
        <Card>
          <CardHeader>
            <CardTitle>Modifier mon profil</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
