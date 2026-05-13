// ROLE: ADMIN — Client component for demande details

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import { DemandeAdminDrawer } from '@/components/demandes/DemandeAdminDrawer'
import { DeleteDemandeDialog } from '@/components/demandes/DeleteDemandeDialog'
import type { DemandeWithRelations } from '@/types/demande'
import { useState } from 'react'

interface DemandeAdminDetailClientProps {
  demande: DemandeWithRelations
}

export function DemandeAdminDetailClient({ demande }: DemandeAdminDetailClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/demandes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Demande #{demande.idDemande}
          </h1>
          <p className="text-muted-foreground">Détails de la demande de maintenance</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="mt-1">{demande.description}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Priorité</p>
                <div className="mt-1">
                  <PrioriteBadge priorite={demande.priorite} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <div className="mt-1">
                  <StatutBadge statut={demande.statut} />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de création</p>
              <p className="mt-1">{new Date(demande.dateDemande).toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="text-muted-foreground">Nom:</span> {demande.client.firstName} {demande.client.lastName}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {demande.client.email}
            </p>
            <p>
              <span className="text-muted-foreground">Rôle:</span> {demande.client.role}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Équipement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="text-muted-foreground">Nom:</span> {demande.equipement.nom}
            </p>
            <p>
              <span className="text-muted-foreground">Type:</span> {demande.equipement.type}
            </p>
            <p>
              <span className="text-muted-foreground">N° Série:</span> {demande.equipement.numeroSerie}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interventions</CardTitle>
            <CardDescription>{demande.interventions.length} intervention(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {demande.interventions.length === 0 ? (
              <p className="text-muted-foreground">Aucune intervention enregistrée</p>
            ) : (
              <ul className="space-y-2">
                {demande.interventions.map((intervention) => (
                  <li key={intervention.idIntervention} className="text-sm">
                    Intervention #{intervention.idIntervention} -{' '}
                    {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setDrawerOpen(true)}>Modifier le statut</Button>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          Supprimer la demande
        </Button>
      </div>

      <DemandeAdminDrawer
        demande={
          {
            idDemande: demande.idDemande,
            description: demande.description,
            priorite: demande.priorite,
            statut: demande.statut,
            dateDemande: demande.dateDemande,
            client: {
              id: demande.client.id,
              firstName: demande.client.firstName,
              lastName: demande.client.lastName,
              email: demande.client.email,
            },
            equipement: {
              id: demande.equipement.id,
              nom: demande.equipement.nom,
              type: demande.equipement.type,
              numeroSerie: demande.equipement.numeroSerie,
            },
            technician: demande.technician ? {
              id: demande.technician.id,
              firstName: demande.technician.firstName,
              lastName: demande.technician.lastName,
            } : null,
            _count: { interventions: demande.interventions.length },
          }
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {}}
      />

      <DeleteDemandeDialog
        demandeId={demande.idDemande}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  )
}