// =============================================================================
// USER DETAIL CLIENT - SGME
// =============================================================================
// Client component for displaying user details with action buttons.
// Provides:
// - User information display (name, email, phone, role, etc.)
// - Edit and delete actions
// - Back navigation to user list
// =============================================================================

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Edit,
  Mail,
  Phone,
  Shield,
  Trash2,
  User,
  UserCheck,
  Clock,
  Activity,
  Lock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InfoRow } from "@/components/ui/info-row"
import { toast } from "sonner"
import { EquipmentType } from "@/app/generated/prisma/enums"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: "ADMIN" | "EMPLOYE" | "TECHNICIEN"
  specialization: EquipmentType | null
  isActive: boolean
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
}

const roleLabels: Record<User["role"], string> = {
  ADMIN: "Administrateur",
  EMPLOYE: "Employé",
  TECHNICIEN: "Technicien",
}

const roleBadgeClasses: Record<User["role"], string> = {
  ADMIN: "bg-primary/10 text-primary",
  EMPLOYE: "bg-blue-500/10 text-blue-500",
  TECHNICIEN: "bg-green-500/10 text-green-500",
}

const specializationLabels: Record<EquipmentType, string> = {
  PRINTER: "Imprimantes",
  NETWORK: "Équipements réseau",
  HVAC: "Chauffage, ventilation, climatisation",
  ELECTRICAL: "Systèmes électriques",
  SECURITY: "Systèmes de sécurité",
}

interface UserDetailClientProps {
  user: User
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.firstName} ${user.lastName}" ? Cette action est irréversible.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to delete user")
      }

      toast.success("Utilisateur supprimé avec succès")
      router.push("/dashboard/admin/users")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la suppression"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-muted-foreground">Détails de l\u2019utilisateur</p>
        </div>
      </div>

      {/* Status bar */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rôle:</span>
              <Badge
                variant="secondary"
                className={roleBadgeClasses[user.role]}
              >
                {roleLabels[user.role]}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Statut:</span>
              <Badge
                variant={user.isActive ? "default" : "destructive"}
              >
                {user.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
            {user.role === "TECHNICIEN" && user.specialization && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Spécialisation:</span>
                <Badge variant="outline">
                  {specializationLabels[user.specialization]}
                </Badge>
              </div>
            )}
            {user.mustChangePassword && (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-yellow-500">
                  Doit changer son mot de passe
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Personal information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Nom complet"
              value={`${user.firstName} ${user.lastName}`}
              icon={User}
            />
            <InfoRow
              label="Email"
              value={user.email}
              icon={Mail}
            />
            <InfoRow
              label="Téléphone"
              value={user.phone || "Non renseigné"}
              icon={Phone}
            />
           
          </CardContent>
        </Card>

        {/* Role & status */}
        <Card>
          <CardHeader>
            <CardTitle>Rôle et statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Rôle"
              value={roleLabels[user.role]}
              icon={Shield}
            />
            {user.role === "TECHNICIEN" && user.specialization && (
              <InfoRow
                label="Spécialisation"
                value={specializationLabels[user.specialization]}
                icon={Activity}
              />
            )}
            <InfoRow
              label="Statut du compte"
              value={user.isActive ? "Actif" : "Inactif"}
              icon={UserCheck}
            />
            <InfoRow
              label="Changement de mot de passe requis"
              value={
                user.mustChangePassword ? (
                  <span className="text-yellow-500 font-medium">
                    Oui
                  </span>
                ) : (
                  "Non"
                )
              }
              icon={Lock}
            />
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>
              Dates de création et de modification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Créé le"
              value={new Date(user.createdAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              icon={Calendar}
            />
            <InfoRow
              label="Modifié le"
              value={new Date(user.updatedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              icon={Clock}
            />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/dashboard/admin/users/${user.id}/edit`}>
          <Button size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </Link>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting || user.id === undefined}
        >
          {isDeleting ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
