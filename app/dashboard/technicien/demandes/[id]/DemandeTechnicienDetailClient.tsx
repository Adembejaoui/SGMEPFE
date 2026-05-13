// ROLE: TECHNICIEN — Client component for technicien demande details

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import type { DemandeWithRelations, StatutDemande } from '@/types/demande'
import { useState } from 'react'
import { toast } from 'sonner'

interface DemandeTechnicienDetailClientProps {
  demande: DemandeWithRelations
}

export function DemandeTechnicienDetailClient({ demande }: DemandeTechnicienDetailClientProps) {
  const [statut, setStatut] = useState<StatutDemande>(demande.statut)
  const [isSaving, setIsSaving] = useState(false)

  const handleStatutChange = async (nouveauStatut: StatutDemande) => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/demandes/${demande.idDemande}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })

      if (!response.ok) throw new Error('Erreur lors de la mise à jour')

      toast.success('Statut mis à jour')
      setStatut(nouveauStatut)
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/technicien/demandes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Demande #{demande.idDemande}
          </h1>
          <p className="text-muted-foreground">Détails de la demande d'intervention</p>
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
                  <StatutBadge statut={statut} />
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

      <div className="space-y-2">
        <p className="text-sm font-medium">Changer le statut</p>
        <Select value={statut} onValueChange={(v) => handleStatutChange(v as StatutDemande)} disabled={isSaving}>
          <SelectTrigger className="w-[200px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SelectValue />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN_COURS">En cours</SelectItem>
            <SelectItem value="TRAITEE">Traitée</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}