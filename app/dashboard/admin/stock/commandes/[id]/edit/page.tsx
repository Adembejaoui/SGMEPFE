// =============================================================================
// COMMANDE EDIT PAGE - SGME
// =============================================================================
// Server component for editing an existing purchase order.

import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { CommandeForm } from "@/components/stock/CommandeForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

async function getCommande(id: string) {
  const commandeId = parseInt(id, 10)
  if (isNaN(commandeId)) return null

  const commande = await prisma.commandeStock.findUnique({
    where: { id: commandeId },
  })

  return commande
}

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

export default async function CommandeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const commande = await getCommande(id)

  if (!commande) {
    notFound()
  }

  const materiels = await getMateriels()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/admin/stock/commandes/${id}`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Modifier la commande #{commande.id}</h1>
          <p className="text-muted-foreground">
            Modifiez les détails de la commande
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <CommandeForm
          initialData={{
            id: commande.id,
            materielId: commande.materielId,
            quantiteCommandee: commande.quantiteCommandee,
            fournisseur: commande.fournisseur,
            statut: commande.statut,
            dateReception: commande.dateReception,
          }}
          materiels={materiels}
        />
      </div>
    </div>
  )
}
