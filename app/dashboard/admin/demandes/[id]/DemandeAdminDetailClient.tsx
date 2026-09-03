// ROLE: ADMIN — Client component for demande details

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, User, Wrench, AlertCircle, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import { DemandeAdminDrawer } from '@/components/demandes/DemandeAdminDrawer'
import { DeleteDemandeDialog } from '@/components/demandes/DeleteDemandeDialog'
import { DemandeAssignTechnicienSelect } from '@/components/demandes/DemandeAssignTechnicienSelect'
import { InfoRow } from '@/components/ui/info-row'
import type { DemandeWithRelations } from '@/types/demande'
import { useState } from 'react'

interface DemandeAdminDetailClientProps {
  demande: DemandeWithRelations
}

export function DemandeAdminDetailClient({ demande }: DemandeAdminDetailClientProps) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/demandes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            Demande #{demande.idDemande}
          </h1>
          <p className="text-muted-foreground">Détails de la demande de maintenance</p>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Priorité:</span>
              <PrioriteBadge priorite={demande.priorite} />
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Statut:</span>
              <StatutBadge statut={demande.statut} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Description"
              value={demande.description}
            />
            <InfoRow
              label="Date de création"
              value={new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
              icon={Calendar}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Nom"
              value={`${demande.client.firstName} ${demande.client.lastName}`}
              icon={User}
            />
            <InfoRow
              label="Email"
              value={demande.client.email}
            />
            <InfoRow
              label="Rôle"
              value={demande.client.role}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Équipement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Nom"
              value={demande.equipement.nom}
              icon={Wrench}
            />
            <InfoRow
              label="Type"
              value={demande.equipement.type}
            />
            <InfoRow
              label="N° Série"
              value={demande.equipement.numeroSerie}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interventions</CardTitle>
            <CardDescription>{demande.interventions.length} intervention(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {demande.interventions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <ClipboardList className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune intervention enregistrée</p>
              </div>
            ) : (
              <ul className="divide-y rounded-md border">
                {demande.interventions.map((intervention) => (
                  <li key={intervention.idIntervention} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>Intervention #{intervention.idIntervention}</span>
                    <span className="text-muted-foreground">
                      {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <DemandeAssignTechnicienSelect
          demandeId={demande.idDemande}
          currentTechnicienId={demande.technician?.id || null}
          equipementType={demande.equipement.type}
          onAssigned={() => router.refresh()}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        
        <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          Supprimer la demande
        </Button>
      </div>

      

      <DeleteDemandeDialog
        demandeId={demande.idDemande}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => router.replace('/dashboard/admin/demandes')}
      />
    </div>
  )
}
