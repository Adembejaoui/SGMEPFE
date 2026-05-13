// =============================================================================
// EDIT EQUIPMENT PAGE - SGME
// =============================================================================
// This page allows administrators and technicians to edit existing equipment.
// It provides a form pre-filled with the equipment's current data.
//
// Only administrators and technicians can access this page.
// This is a Server Component that fetches needed data (equipment details and users for assignment).
// The form itself is a Client Component (handles submission).
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EquipementCreateForm } from "@/components/equipements/EquipementCreateForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// =============================================================================
// EDIT EQUIPMENT PAGE COMPONENT
// =============================================================================
// Main component for the edit equipment page.
// Fetches equipment and user data on the server and renders the edit form.
// =============================================================================
export default async function EditEquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Get the current session
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/api/auth/signin")
  }

  // Check if user is admin or technician
  if (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const equipmentId = parseInt(id, 10)

  if (isNaN(equipmentId)) {
    // Redirect to equipment list if invalid ID
    redirect("/dashboard/admin/equipment")
  }

  // Fetch equipment data
  const equipment = await prisma.equipement.findUnique({
    where: { id: equipmentId },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  })

  // Redirect to equipment list if not found
  if (!equipment) {
    redirect("/dashboard/admin/equipment")
  }

  // Fetch users for admin assignment (only active admins)
  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: { lastName: "asc" }
  })

  // Prepare initial data for the form
  const initialData = {
    id: equipment.id,
    nom: equipment.nom,
    type: equipment.type,
    marque: equipment.marque,
    modele: equipment.modele,
    numeroSerie: equipment.numeroSerie,
    etat: equipment.etat,
    localisation: equipment.localisation,
    adminId: equipment.adminId || undefined,
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/equipment">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier l'équipement</h1>
          <p className="text-muted-foreground">
            Modifiez les informations de l'équipement "{equipment.nom}"
          </p>
        </div>
      </div>

      {/* Edit equipment form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'équipement</CardTitle>
          <CardDescription>
            Modifiez les champs souhaités puis sauvegardez vos changements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipementCreateForm 
            initialData={initialData}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  )
}