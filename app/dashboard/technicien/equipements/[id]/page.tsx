// =============================================================================
// TECHNICIEN EQUIPMENT DETAIL PAGE - SGME
// =============================================================================
// Server component for viewing equipment details.
// Technicians can only view equipment of their specialization.
// =============================================================================

import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, AlertCircle, Package, Wrench } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EquipementWithDemandes } from "@/types/equipement"

async function getEquipment(id: string): Promise<EquipementWithDemandes | null> {
  const equipementId = parseInt(id, 10)

  if (isNaN(equipementId)) {
    return null
  }

  const equipement = await prisma.equipement.findUnique({
    where: { id: equipementId },
    include: {
      demandesMaintenance: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  }) as unknown as EquipementWithDemandes | null

  return equipement
}

export default async function TechnicienEquipementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/api/auth/signin")
  }

  if (session.user.role !== "TECHNICIEN") {
    redirect("/dashboard")
  }

  if (session.user.mustChangePassword) {
    redirect("/change-password")
  }

  const { id } = await params
  const equipment = await getEquipment(id)

  if (!equipment) {
    notFound()
  }

  if (equipment.type !== session.user.specialization) {
    redirect("/dashboard/technicien/equipements")
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR")
  }

  const getStateBadgeClass = (etat: string) => {
    switch (etat) {
      case "DISPONIBLE":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "EN_PANNE":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "EN_MAINTENANCE":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "HORS_SERVICE":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStateLabel = (etat: string) => {
    switch (etat) {
      case "DISPONIBLE":
        return "Disponible"
      case "EN_PANNE":
        return "En Panne"
      case "EN_MAINTENANCE":
        return "En Maintenance"
      case "HORS_SERVICE":
        return "Hors Service"
      default:
        return etat
    }
  }

  const getPriorityBadgeClass = (priorite: string) => {
    switch (priorite) {
      case "BASSE":
        return "bg-gray-500/10 text-gray-500"
      case "MOYENNE":
        return "bg-blue-500/10 text-blue-500"
      case "HAUTE":
        return "bg-orange-500/10 text-orange-500"
      case "URGENTE":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusBadgeClass = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "bg-yellow-500/10 text-yellow-500"
      case "VALIDEE":
        return "bg-blue-500/10 text-blue-500"
      case "EN_COURS":
        return "bg-purple-500/10 text-purple-500"
      case "TRAITEE":
        return "bg-green-500/10 text-green-500"
      case "REJETEE":
        return "bg-red-500/10 text-red-500"
      case "ANNULEE":
        return "bg-gray-500/10 text-gray-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "En attente"
      case "VALIDEE":
        return "Validée"
      case "EN_COURS":
        return "En cours"
      case "TRAITEE":
        return "Traitée"
      case "REJETEE":
        return "Rejetée"
      case "ANNULEE":
        return "Annulée"
      default:
        return statut
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/technicien/equipements">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Équipement</p>
            <h1 className="text-3xl font-bold tracking-tight">{equipment.nom}</h1>
            <Badge className={cn("mt-2 text-sm py-1 px-3 border", getStateBadgeClass(equipment.etat))}>
              <div className="flex items-center gap-1.5">
                {equipment.etat === "DISPONIBLE" && <CheckCircle className="w-3.5 h-3.5" />}
                {equipment.etat === "EN_PANNE" && <AlertCircle className="w-3.5 h-3.5" />}
                {equipment.etat === "EN_MAINTENANCE" && <Wrench className="w-3.5 h-3.5" />}
                {equipment.etat === "HORS_SERVICE" && <AlertTriangle className="w-3.5 h-3.5" />}
                {getStateLabel(equipment.etat)}
              </div>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <Badge variant="outline" className="text-sm">
            Ref: {equipment.numeroSerie}
          </Badge>
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
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="font-medium">{equipment.type}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Marque</span>
                <span className="font-medium">{equipment.marque}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Modèle</span>
                <span className="font-medium">{equipment.modele}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Numéro de série</span>
                <span className="font-mono text-sm font-medium">{equipment.numeroSerie}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Localisation</span>
                <span className="font-medium">{equipment.localisation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Badge className={cn("text-lg py-2 px-4 border", getStateBadgeClass(equipment.etat))}>
                <div className="flex items-center gap-2">
                  {equipment.etat === "DISPONIBLE" && <CheckCircle className="w-5 h-5" />}
                  {equipment.etat === "EN_PANNE" && <AlertCircle className="w-5 h-5" />}
                  {equipment.etat === "EN_MAINTENANCE" && <Wrench className="w-5 h-5" />}
                  {equipment.etat === "HORS_SERVICE" && <AlertTriangle className="w-5 h-5" />}
                  {getStateLabel(equipment.etat)}
                </div>
              </Badge>
            </CardTitle>
            <CardDescription>État actuel de l&apos;équipement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Dernière mise à jour</span>
                <span className="font-medium">{formatDate(equipment.updatedAt)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">Date de création</span>
                <span className="font-medium">{formatDate(equipment.createdAt)}</span>
              </div>
            </div>
            {equipment.admin && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Gestionnaire</p>
                <p className="font-medium">{equipment.admin.firstName} {equipment.admin.lastName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Demandes de maintenance liées
          </CardTitle>
          <CardDescription>
            {equipment.demandesMaintenance.length} demande{equipment.demandesMaintenance.length > 1 ? "s" : ""} trouvée{equipment.demandesMaintenance.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipment.demandesMaintenance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                Aucune demande de maintenance pour cet équipement
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Priorité</TableHead>
                    <TableHead className="w-28">Statut</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.demandesMaintenance.map((demande) => (
                    <TableRow key={demande.idDemande}>
                      <TableCell className="font-mono text-sm">{demande.idDemande}</TableCell>
                      <TableCell>{formatDate(demande.dateDemande)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {demande.description.length > 60
                            ? `${demande.description.substring(0, 60)}...`
                            : demande.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getPriorityBadgeClass(demande.priorite))}>
                          {demande.priorite}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(getStatusBadgeClass(demande.statut))}>
                          {getStatusLabel(demande.statut)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/technicien/demandes/${demande.idDemande}`}>
                            Voir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
