// =============================================================================
// TECHNICIEN DASHBOARD HOME PAGE - SGME
// =============================================================================
// This is the main dashboard page for technicians.
// It displays:
// - Welcome message with user info
// - Quick access to profile
// - Recent activity (placeholder for future features)
//
// Technicians have limited access and can only view their own profile.
// They cannot access admin features or manage other users.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  User, 
  Settings, 
  Activity,
  Calendar,
  Clock,
  Wrench
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// =============================================================================
// TECHNICIEN DASHBOARD PAGE COMPONENT
// =============================================================================
// Main component for the technicien dashboard home page.
// Displays welcome message and quick access to profile.
// =============================================================================
export default async function TechnicienDashboardPage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  // Check if user is technicien
  if (session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }
    if (session.user.mustChangePassword){ 
    redirect("/change-password")
  }


  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session.user.name || session.user.email}
          </p>
        </div>
      </div>

      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue sur votre tableau de bord</CardTitle>
          <CardDescription>
            Vous êtes connecté en tant que technicien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            En tant que technicien, vous pouvez consulter et modifier votre profil personnel.
            Pour toute demande ou modification, veuillez contacter votre administrateur.
          </p>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mon profil
            </CardTitle>
            <CardDescription>
              Consultez et modifiez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{session.user.name || "Utilisateur"}</p>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                  <p className="text-sm text-primary">Technicien</p>
                </div>
              </div>
              <Link href="/dashboard/profile">
                <Button className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Gérer mon profil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Activity card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activité récente
            </CardTitle>
            <CardDescription>
              Vos dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Dernière connexion</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Compte créé</p>
                  <p className="text-sm text-muted-foreground">
                    Récemment
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information card */}
      <Card>
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
          <CardDescription>
            Ce que vous devez savoir en tant que technicien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Vous pouvez consulter et modifier votre profil personnel
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Vous pouvez changer votre mot de passe à tout moment
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Pour toute demande spécifique, contactez votre administrateur
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Vos modifications sont sauvegardées automatiquement
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
