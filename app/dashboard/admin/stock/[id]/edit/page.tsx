// =============================================================================
// STOCK EDIT PAGE - SGME
// =============================================================================
// Server component for editing existing materials.
// =============================================================================

import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { MaterielForm } from "@/components/stock/MaterielForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getMateriel(id: string) {
  const materielId = parseInt(id, 10)
  if (isNaN(materielId)) return null

  const materiel = await prisma.materiel.findUnique({
    where: { id: materielId },
  })

  return materiel
}

async function getAdmins() {
  const users = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  })
  return users
}

export default async function StockEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const materiel = await getMateriel(id)

  if (!materiel) {
    notFound()
  }

  const users = await getAdmins()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/admin/stock/${id}`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Modifier le matériel</h1>
          <p className="text-muted-foreground">
            {materiel.nom} (Réf: {materiel.reference})
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <MaterielForm
          initialData={{
            id: materiel.id,
            reference: materiel.reference,
            nom: materiel.nom,
            description: materiel.description ?? undefined,
            type: materiel.type,
            quantiteStock: materiel.quantiteStock,
            seuilAlerte: materiel.seuilAlerte,
            unite: materiel.unite,
            emplacement: materiel.emplacement ?? undefined,
            prixUnitaire: materiel.prixUnitaire ?? undefined,
            adminId: materiel.adminId,
          }}
          users={users}
        />
      </div>
    </div>
  )
}
