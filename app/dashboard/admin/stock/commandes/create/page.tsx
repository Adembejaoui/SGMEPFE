// =============================================================================
// COMMANDE CREATE PAGE - SGME
// =============================================================================
// Server component for creating a new purchase order.

import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CommandeForm } from "@/components/stock/CommandeForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getMateriels() {
  const materiels = await prisma.materiel.findMany({
    select: {
      id: true,
      reference: true,
      nom: true,
      quantiteStock: true,
      unite: true,
    },
    orderBy: { reference: "asc" },
  })
  return materiels
}

export default async function CommandeCreatePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const materiels = await getMateriels()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/admin/stock/commandes">
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle commande</h1>
          <p className="text-muted-foreground">
            Créez une commande d'approvisionnement
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <CommandeForm materiels={materiels} />
      </div>
    </div>
  )
}
