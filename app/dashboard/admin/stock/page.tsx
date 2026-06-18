// =============================================================================
// STOCK LIST PAGE - SGME
// =============================================================================
// Server component for admin stock management listing.
// =============================================================================

import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EquipmentStockListClient } from "@/components/stock/EquipmentStockListClient"
import { ArrowLeft, AlertTriangle, Package, Boxes, AlertCircle } from "lucide-react"

async function getStockData() {
  const totalMateriels = await prisma.materiel.count()

  const alertCount = await prisma.materiel.count({
    where: {
      quantiteStock: { lte: prisma.materiel.fields.seuilAlerte },
    },
  })

  const ruptureCount = await prisma.materiel.count({
    where: { quantiteStock: 0 },
  })

  const commandesEnCours = await prisma.commandeStock.count({
    where: { statut: "EN_ATTENTE" },
  })

  const valueResult = await prisma.materiel.findMany({
    where: { prixUnitaire: { not: null } },
    select: {
      prixUnitaire: true,
      quantiteStock: true,
    },
  })

  const totalValueNum = valueResult.reduce(
    (sum, m) => sum + (m.prixUnitaire ?? 0) * m.quantiteStock,
    0
  )

  return {
    stats: {
      totalMateriels,
      alertCount,
      ruptureCount,
      commandesEnCours,
      totalValue: totalValueNum,
    },
  }
}

export default async function StockPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }

  const { stats } = await getStockData()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Stock</h1>
          <p className="text-muted-foreground">Gérez les matériels, pièces détachées et consommables</p>
        </div>
        {session.user.role === "ADMIN" && (
          <Button asChild>
            <Link href="/dashboard/admin/stock/create">
              <Package className="w-4 h-4 mr-2" />
              Ajouter un matériel
            </Link>
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalMateriels}</p>
            <p className="text-xs text-muted-foreground">matériels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.alertCount}</p>
            <p className="text-xs text-muted-foreground">stock bas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Rupture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.ruptureCount}</p>
            <p className="text-xs text-muted-foreground">en rupture</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-500" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.commandesEnCours}</p>
            <p className="text-xs text-muted-foreground">en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">DZD (estimé)</p>
          </CardContent>
        </Card>
      </div>

      {/* Material list */}
      <EquipmentStockListClient role={session.user.role} />
    </div>
  )
}
