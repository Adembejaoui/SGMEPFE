// =============================================================================
// ADMIN EQUIPMENT LIST PAGE - SGME
// =============================================================================
// This page displays a list of all equipment in the system.
// It provides:
// - Search and filter functionality
// - Equipment table with key information
// - Actions for each equipment (view, edit, delete)
// - Responsive design for all screen sizes
//
// Only administrators can access this page.
// This is a Server Component - no client-side JavaScript is bundled.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { EquipementListItem } from "@/types/equipement"
import { EquipmentListClient } from "@/components/equipements/EquipmentListClient"

export default async function EquipmentListPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const equipements = await prisma.equipement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      },
      demandesMaintenance: true
    }
  }) as unknown as (EquipementListItem & { demandesMaintenance: any[] })[]

  return <EquipmentListClient initialEquipements={equipements} />
}