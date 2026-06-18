// =============================================================================
// COMMANDES LIST PAGE - SGME
// =============================================================================
// Server component for admin purchase order listing.

import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CommandeStockListClient } from "@/components/stock/CommandeStockListClient"
import type { CommandeStockWithMateriel } from "@/types/stock"
import { ArrowLeft, ClipboardList, ShoppingCart, CheckCircle, XCircle } from "lucide-react"

async function getCommandesData() {
  const [commandes, totalCommandes, pendingCount, receivedCount, cancelledCount] = await Promise.all([
    prisma.commandeStock.findMany({
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
    }),
    prisma.commandeStock.count(),
    prisma.commandeStock.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.commandeStock.count({ where: { statut: "RECUE" } }),
    prisma.commandeStock.count({ where: { statut: "ANNULEE" } }),
  ])

  return {
    commandes: commandes as CommandeStockWithMateriel[],
    stats: {
      totalCommandes,
      pendingCount,
      receivedCount,
      cancelledCount,
    },
  }
}

export default async function CommandesPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { commandes, stats } = await getCommandesData()

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
            <h1 className="text-3xl font-bold tracking-tight">Commandes d'approvisionnement</h1>
            <p className="text-muted-foreground">Gérez les commandes de matériels et pièces détachées</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/stock/commandes/create">
            <ClipboardList className="w-4 h-4 mr-2" />
            Nouvelle commande
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCommandes}</p>
            <p className="text-xs text-muted-foreground">commandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-yellow-500" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
            <p className="text-xs text-muted-foreground">en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Reçues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.receivedCount}</p>
            <p className="text-xs text-muted-foreground">reçues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.cancelledCount}</p>
            <p className="text-xs text-muted-foreground">annulées</p>
          </CardContent>
        </Card>
      </div>

      <CommandeStockListClient initialCommandes={commandes} />
    </div>
  )
}
