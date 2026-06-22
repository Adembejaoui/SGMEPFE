// =============================================================================
// TECHNICIEN EQUIPMENT LIST PAGE - SGME
// =============================================================================
// Server component that fetches equipment filtered by technician's specialization.
// Provides equipment data to the client component for display with filters.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { EquipementListItem, EquipmentType } from "@/types/equipement"
import { EquipmentTechnicienClient } from "@/components/equipements/EquipmentTechnicienClient"

export default async function TechnicienEquipementsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }

  if (session.user.mustChangePassword) {
    redirect("/change-password")
  }

  const specialization = session.user.specialization as EquipmentType | null

  if (!specialization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes équipements</h1>
          <p className="text-muted-foreground">Équipements liés à votre spécialisation</p>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Aucune spécialisation assignée. Veuillez contacter votre administrateur.
          </p>
        </div>
      </div>
    )
  }

  const equipements = await prisma.equipement.findMany({
    where: {
      type: specialization as any,
    },
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      demandesMaintenance: true,
    },
  }) as unknown as (EquipementListItem & { demandesMaintenance: any[] })[]

  return <EquipmentTechnicienClient initialEquipements={equipements} specialization={specialization} />
}
