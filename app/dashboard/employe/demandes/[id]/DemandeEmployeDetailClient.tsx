// ROLE: EMPLOYE — Client component for employe demande details

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import type { DemandeWithRelations } from '@/types/demande'
import { useState } from 'react'
import { toast } from 'sonner'

interface DemandeEmployeDetailClientProps {
  demande: DemandeWithRelations
}

export function DemandeEmployeDetailClient({ demande }: DemandeEmployeDetailClientProps) {
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    if (demande.statut !== 'EN_ATTENTE') return

    if (!confirm('Voulez-vous annuler cette demande ?')) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/demandes/${demande.idDemande}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'ANNULEE' }),
      })

      if (!response.ok) throw new Error('Erreur lors de l\'annulation')

      toast.success('Demande annulée avec succès')
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/employe/demandes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Demande #{demande.idDemande}
          </h1>
          <p className="text-muted-foreground">Détails de votre demande de maintenance</p>
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

      {demande.statut === 'EN_ATTENTE' && (
        <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
          {isCancelling ? 'Annulation...' : 'Annuler la demande'}
        </Button>
      )}
    </div>
  )
}