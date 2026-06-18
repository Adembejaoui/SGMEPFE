// =============================================================================
// STOCK DETAIL PAGE - SGME
// =============================================================================
// Server component for single material detail view and editing.

import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Pencil, AlertTriangle, Package, ClipboardList, ShoppingCart, History } from "lucide-react"
import { formatDateFR } from "@/lib/utils"
import type { MaterielWithAdmin, CommandeStockWithMateriel } from "@/types/stock"
import { cn } from "@/lib/utils"

async function getMateriel(id: string): Promise<MaterielWithAdmin | null> {
  const materielId = parseInt(id, 10)
  if (isNaN(materielId)) return null

  const materiel = await prisma.materiel.findUnique({
    where: { id: materielId },
    include: {
      admin: { select: { id: true, firstName: true, lastName: true, email: true } },
      _count: {
        select: { utilisations: true, commandes: true },
      },
    },
  })

  return materiel as MaterielWithAdmin | null
}

async function getUtilisations(materielId: number) {
  const utilisations = await prisma.utilisationMateriel.findMany({
    where: { materielId },
    orderBy: { createdAt: "desc" },
    include: {
      intervention: {
        select: {
          idIntervention: true,
          description: true,
          technician: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          demande: {
            select: {
              description: true,
            },
          },
        },
      },
    },
    take: 20,
  })

  return utilisations
}

async function getCommandes(materielId: number): Promise<CommandeStockWithMateriel[]> {
  const commandes = await prisma.commandeStock.findMany({
    where: { materielId },
    orderBy: { dateCommande: "desc" },
    include: {
      materiel: {
        select: {
          id: true,
          reference: true,
          nom: true,
          unite: true,
          type: true,
        },
      },
    },
    take: 20,
  })

  return commandes as CommandeStockWithMateriel[]
}

export default async function StockDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const materiel = await getMateriel(id)

  if (!materiel) {
    notFound()
  }

  const [utilisations, commandes] = await Promise.all([
    getUtilisations(materiel.id),
    getCommandes(materiel.id),
  ])

  const typeLabels: Record<string, string> = {
    PIECE_DETACHEE: "Pièce détachée",
    CONSOMMABLE: "Consommable",
    OUTIL: "Outil",
  }

  const stockColor = materiel.quantiteStock === 0
    ? "text-red-600"
    : materiel.quantiteStock <= materiel.seuilAlerte
    ? "text-yellow-600"
    : "text-green-600"

  const commandeStatusBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case "RECUE":
        return <Badge className="bg-green-100 text-green-800">Reçue</Badge>
      case "ANNULEE":
        return <Badge className="bg-red-100 text-red-800">Annulée</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin/stock">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{materiel.nom}</h1>
            <p className="text-muted-foreground">
              Réf: <span className="font-mono">{materiel.reference}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.user.role === "ADMIN" && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/admin/stock/commandes/create?materielId=${materiel.id}`}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Commander
              </Link>
            </Button>
          )}
          {session.user.role === "ADMIN" && (
            <Button asChild>
              <Link href={`/dashboard/admin/stock/${materiel.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Référence</span>
              <span className="font-mono text-sm font-medium">{materiel.reference}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Nom</span>
              <span className="font-medium">{materiel.nom}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="outline">{typeLabels[materiel.type] || materiel.type}</Badge>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Description</span>
              <span className="font-medium text-sm">{materiel.description || "—"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Prix unitaire</span>
              <span className="font-medium">{materiel.prixUnitaire ? `${materiel.prixUnitaire} DZD` : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gestionnaire</span>
              <span className="font-medium">
                {materiel.admin.firstName} {materiel.admin.lastName}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-primary" />
              État du stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Quantité en stock</span>
              <span className={cn("text-2xl font-bold", stockColor)}>
                {materiel.quantiteStock} {materiel.unite}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Seuil d'alerte</span>
              <span className="font-medium">{materiel.seuilAlerte} {materiel.unite}</span>
            </div>
            {materiel.quantiteStock <= materiel.seuilAlerte && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Stock bas ! Pensez à réapprovisionner.
                </p>
              </div>
            )}
            {materiel.quantiteStock === 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Rupture de stock !
                </p>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Emplacement</span>
              <span className="font-medium">{materiel.emplacement || "Non défini"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm text-muted-foreground">Utilisations</span>
              <span className="font-medium">{materiel._count.utilisations} intervention(s)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Commandes</span>
              <span className="font-medium">{materiel._count.commandes} commande(s)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {utilisations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              Historique des utilisations
            </CardTitle>
            <CardDescription>
              Les {utilisations.length} dernières utilisations de ce matériel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Intervention</TableHead>
                    <TableHead>Technicien</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Motif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utilisations.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDateFR(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        #{u.intervention.idIntervention}
                        <span className="text-muted-foreground block text-xs">
                          {u.intervention.demande.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.intervention.technician.firstName} {u.intervention.technician.lastName}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        -{u.quantiteUtilisee} {materiel.unite}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.motif || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {commandes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-primary" />
              Commandes associées
            </CardTitle>
            <CardDescription>
              Les {commandes.length} dernières commandes de ce matériel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Réception</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commandes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-mono">
                        #{c.id}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {c.quantiteCommandee} {c.materiel.unite}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.fournisseur || "—"}
                      </TableCell>
                      <TableCell>{commandeStatusBadge(c.statut)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDateFR(c.dateCommande)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.dateReception ? formatDateFR(c.dateReception) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        Créé le {formatDateFR(materiel.createdAt)} · Modifié le {formatDateFR(materiel.updatedAt)}
      </div>
    </div>
  )
}
