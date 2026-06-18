// =============================================================================
// COMMANDE DETAIL PAGE - SGME
// =============================================================================
// Server component for single purchase order detail view.

import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Pencil, ShoppingCart, Package, Calendar, Truck, AlertTriangle, ClipboardList, CheckCircle, XCircle } from "lucide-react"
import { formatDateFR } from "@/lib/utils"
import { cn } from "@/lib/utils"

async function getCommande(id: string) {
  const commandeId = parseInt(id, 10)
  if (isNaN(commandeId)) return null

  const commande = await prisma.commandeStock.findUnique({
    where: { id: commandeId },
    include: {
      materiel: {
        select: {
          id: true,
          reference: true,
          nom: true,
          unite: true,
          type: true,
          quantiteStock: true,
          seuilAlerte: true,
          emplacement: true,
          prixUnitaire: true,
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  })

  return commande
}

export default async function CommandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    EN_ATTENTE: {
      label: "En attente",
      className: "bg-yellow-100 text-yellow-800",
      icon: <ClipboardList className="w-3 h-3" />,
    },
    RECUE: {
      label: "Reçue",
      className: "bg-green-100 text-green-800",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    ANNULEE: {
      label: "Annulée",
      className: "bg-red-100 text-red-800",
      icon: <XCircle className="w-3 h-3" />,
    },
  }

  const status = statusConfig[commande.statut] || { label: commande.statut, className: "bg-gray-100 text-gray-800", icon: null }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/stock/commandes">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Commande #{commande.id}</h1>
            <p className="text-muted-foreground">
              {commande.materiel.reference} — {commande.materiel.nom}
            </p>
          </div>
        </div>
        {session.user.role === "ADMIN" && (
          <Button asChild>
            <Link href={`/dashboard/admin/stock/commandes/${commande.id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Informations de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="font-mono text-sm font-medium">#{commande.id}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Badge className={status.className}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Quantité commandée</span>
              <span className="font-medium">{commande.quantiteCommandee}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Fournisseur</span>
              <span className="font-medium">{commande.fournisseur || "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Date de commande</span>
              <span className="font-medium">{formatDateFR(commande.dateCommande)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date de réception</span>
              <span className="font-medium">{commande.dateReception ? formatDateFR(commande.dateReception) : "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              Matériel concerné
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Référence</span>
              <span className="font-mono text-sm font-medium">{commande.materiel.reference}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Nom</span>
              <span className="font-medium">{commande.materiel.nom}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline">{commande.materiel.type}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Stock actuel</span>
              <span className={cn(
                "font-medium",
                commande.materiel.quantiteStock === 0 ? "text-red-600" :
                commande.materiel.quantiteStock <= commande.materiel.seuilAlerte ? "text-yellow-600" : ""
              )}>
                {commande.materiel.quantiteStock} {commande.materiel.unite}
              </span>
            </div>
            {commande.materiel.quantiteStock <= commande.materiel.seuilAlerte && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Stock bas ! Cette commande aidera à réapprovisionner.
                </p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gestionnaire</span>
              <span className="font-medium">
                {commande.materiel.admin.firstName} {commande.materiel.admin.lastName}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-muted-foreground">
        Créée le {formatDateFR(commande.createdAt)} · Modifiée le {formatDateFR(commande.updatedAt)}
      </div>
    </div>
  )
}
