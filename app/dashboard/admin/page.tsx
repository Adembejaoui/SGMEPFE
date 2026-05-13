// =============================================================================
// ADMIN DASHBOARD HOME PAGE - SGME
// =============================================================================
// This is the main dashboard page for administrators.
// It displays:
// - Statistics cards (total users, active users, etc.)
// - Recent users list
// - Quick actions
//
// The page fetches data from the database and displays it in a clean,
// professional dashboard layout.
// =============================================================================

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield,
  TrendingUp,
  Activity
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// =============================================================================
// ADMIN DASHBOARD PAGE COMPONENT
// =============================================================================
// Main component for the admin dashboard home page.
// Fetches statistics and recent users from the database.
// =============================================================================
export default async function AdminDashboardPage() {
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

  // =============================================================================
  // FETCH STATISTICS
  // =============================================================================
  // Fetches user statistics from the database.
  // These statistics are displayed in the dashboard cards.
  // =============================================================================
  const totalUsers = await prisma.user.count()
  const activeUsers = await prisma.user.count({
    where: { isActive: true }
  })
  const inactiveUsers = await prisma.user.count({
    where: { isActive: false }
  })
  const adminUsers = await prisma.user.count({
    where: { role: "ADMIN" }
  })
  const employeUsers = await prisma.user.count({
    where: { role: "EMPLOYE" }
  })
  const technicienUsers = await prisma.user.count({
    where: { role: "TECHNICIEN" }
  })

  // =============================================================================
  // FETCH RECENT USERS
  // =============================================================================
  // Fetches the 5 most recently created users.
  // This provides a quick overview of new user activity.
  // =============================================================================
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  })

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
        <Link href="/dashboard/admin/users/create">
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Créer un utilisateur
          </Button>
        </Link>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total users card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total utilisateurs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Tous les utilisateurs inscrits
            </p>
          </CardContent>
        </Card>

        {/* Active users card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs actifs
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Comptes actifs
            </p>
          </CardContent>
        </Card>

        {/* Inactive users card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs inactifs
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Comptes désactivés
            </p>
          </CardContent>
        </Card>

        {/* Admin users card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administrateurs
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Comptes admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Role breakdown card */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par rôle</CardTitle>
            <CardDescription>
              Nombre d'utilisateurs par rôle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Administrateurs</span>
              </div>
              <span className="font-medium">{adminUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Employés</span>
              </div>
              <span className="font-medium">{employeUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Techniciens</span>
              </div>
              <span className="font-medium">{technicienUsers}</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions card */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/users/create" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Créer un employé
              </Button>
            </Link>
            <Link href="/dashboard/admin/users/create" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Créer un technicien
              </Button>
            </Link>
            <Link href="/dashboard/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                Voir tous les utilisateurs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs récents</CardTitle>
          <CardDescription>
            Les 5 derniers utilisateurs créés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN" 
                      ? "bg-primary/10 text-primary"
                      : user.role === "EMPLOYE"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-green-500/10 text-green-500"
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
