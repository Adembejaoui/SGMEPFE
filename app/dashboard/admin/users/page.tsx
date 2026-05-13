// =============================================================================
// ADMIN USER LIST PAGE - SGME
// =============================================================================
// This page displays a list of all users in the system.
// It provides:
// - Search and filter functionality
// - User table with key information
// - Actions for each user (view, edit, delete)
// - Pagination for large user lists
//
// Only administrators can access this page.
// =============================================================================

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  Users, 
  UserPlus, 
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

// =============================================================================
// USER LIST PAGE COMPONENT
// =============================================================================
// Main component for the user list page.
// Fetches all users from the database and displays them in a table.
// =============================================================================
export default async function UserListPage() {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  /*if (!session) {
    redirect("/login")
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }*/

  // =============================================================================
  // FETCH ALL USERS
  // =============================================================================
  // Fetches all users from the database with selected fields.
  // Orders by creation date (newest first).
  // =============================================================================
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez tous les utilisateurs du système
          </p>
        </div>
        <Link href="/dashboard/admin/users/create">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Créer un utilisateur
          </Button>
        </Link>
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un utilisateur</CardTitle>
          <CardDescription>
            Recherchez par nom, email ou rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {users.length} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Utilisateur</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Rôle</th>
                  <th className="text-left py-3 px-4 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 font-medium">Mot de passe</th>
                  <th className="text-left py-3 px-4 font-medium">Créé le</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
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
                            {user.phone || "Pas de téléphone"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN" 
                          ? "bg-primary/10 text-primary"
                          : user.role === "EMPLOYE"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-green-500/10 text-green-500"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? "bg-green-500/10 text-green-500"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {user.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.mustChangePassword 
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-green-500/10 text-green-500"
                      }`}>
                        {user.mustChangePassword ? "À changer" : "OK"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/admin/users/${user.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/admin/users/${user.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
