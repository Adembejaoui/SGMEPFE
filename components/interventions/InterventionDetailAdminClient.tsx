// ROLE: ADMIN — Read-only intervention detail component

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Wrench, ClipboardList, Printer, ArrowLeft, Calendar, User, Hash, AlertTriangle, Flag } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import type { InterventionWithRelations, RapportResultat } from '@/types/intervention'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { InfoRow } from '@/components/ui/info-row'
import { AssignTechnicienSelect } from '@/components/interventions/AssignTechnicienSelect'
import type { StatutIntervention, StatutDemande } from '@/types/demande'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Erreur lors de la récupération de l\'intervention')
    }
    return res.json()
  })

const resultatColor: Record<RapportResultat, string> = {
  'Problème résolu': 'bg-green-100 text-green-800',
  'Partiellement résolu': 'bg-yellow-100 text-yellow-800',
  'Non résolu — pièce manquante': 'bg-orange-100 text-orange-800',
  'Non résolu — intervention supplémentaire requise': 'bg-red-100 text-red-800',
}

export function InterventionDetailAdminClient({ interventionId }: { interventionId: number }) {
  const [activeTab, setActiveTab] = useState('informations')
  const { data: intervention, error, isLoading } = useSWR<InterventionWithRelations>(
    `/api/interventions/${interventionId}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background border-b pb-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-40 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted rounded animate-pulse" />
          <div className="md:col-span-2 h-40 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !intervention) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur lors du chargement de l'intervention</p>
            <Link href="/dashboard/admin/rapports" className="text-primary hover:underline mt-2 inline-block">
              Retour aux rapports
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dateIntervention = intervention.demande?.dateDemande || intervention.createdAt
  const rapportExists = !!intervention.rapportMaintenance

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/rapports">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              Intervention #{intervention.idIntervention}
            </h1>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">{intervention.demande.equipement.nom}</span>
            <PrioriteBadge priorite={intervention.demande.priorite} />
            <StatutInterventionBadge statut={intervention.statut} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informations" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="rapport" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Rapport de panne
          </TabsTrigger>
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Résumé
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Informations */}
        <TabsContent value="informations" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Détails de l'intervention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Détails de l'intervention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Type d'intervention" value={intervention.description || 'Intervention'} icon={Wrench} />
                <InfoRow label="Date intervention" value={formatDate(dateIntervention)} icon={Calendar} />
                <InfoRow label="Statut" value={<StatutInterventionBadge statut={intervention.statut} />} icon={Flag} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observation</p>
                  {intervention.observation ? (
                    <blockquote className="mt-1 text-sm border-l-4 border-muted pl-4 italic">
                      {intervention.observation}
                    </blockquote>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">Aucune observation</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demande associée */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Demande associée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Demande" value={`#${intervention.demande.idDemande}`} icon={Hash} />
                <InfoRow label="Date de demande" value={formatDate(intervention.demande.dateDemande)} icon={Calendar} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm max-h-32 overflow-y-auto">{intervention.demande.description}</p>
                </div>
                <InfoRow label="Priorité" value={<PrioriteBadge priorite={intervention.demande.priorite} />} icon={AlertTriangle} />
                <InfoRow label="Statut demande" value={<StatutDemandeBadge statut={intervention.demande.statut} />} icon={Flag} />
                <InfoRow label="Créé par" value={`${intervention.demande.client.prenom} ${intervention.demande.client.nom}`} icon={User} />
              </CardContent>
            </Card>

            {/* Équipement concerné - full width */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Équipement concerné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border-l-4 border-primary">
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Nom:</span> {intervention.demande.equipement.nom}</p>
                    <p><span className="text-muted-foreground">Type:</span> {intervention.demande.equipement.type}</p>
                    <p><span className="text-muted-foreground">Marque:</span> {intervention.demande.equipement.marque}</p>
                    <p><span className="text-muted-foreground">Modèle:</span> {intervention.demande.equipement.modele}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">N° Série:</span> {intervention.demande.equipement.numeroSerie}</p>
                    <p><span className="text-muted-foreground">Localisation:</span> {intervention.demande.equipement.localisation}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge className="text-base px-4 py-2 bg-primary/20 text-primary">
                      {intervention.demande.equipement.etat.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignation technicien */}
            <AssignTechnicienSelect
              interventionId={intervention.idIntervention}
              currentTechnicienId={intervention.demande.technician?.id || null}
            />
          </div>
        </TabsContent>

        {/* Tab 2: Rapport de panne (read-only) */}
        <TabsContent value="rapport" className="space-y-6">
          {!rapportExists ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun rapport soumis</p>
              <p className="text-muted-foreground">Aucun rapport n'a encore été créé pour cette intervention.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Dernière modification: {format(new Date(intervention.rapportMaintenance!.dateModification), 'dd MMMM yyyy HH:mm', { locale: fr })}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Diagnostic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{intervention.rapportMaintenance!.diagnostic}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions effectuées</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{intervention.rapportMaintenance!.actionsEffectuees}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Résultat</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={resultatColor[intervention.rapportMaintenance!.resultat as RapportResultat]}>
                    {intervention.rapportMaintenance!.resultat}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Résumé */}
        <TabsContent value="resume" className="space-y-6">
          {!rapportExists ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun rapport soumis</p>
              <p className="text-muted-foreground mb-4">Remplissez l'onglet Rapport de panne.</p>
              <Button onClick={() => setActiveTab('rapport')}>
                Voir le rapport →
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {/* Demande créée */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Demande créée</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(intervention.demande.dateDemande)} · par {intervention.demande.client.prenom} {intervention.demande.client.nom}
                    </p>
                  </div>
                </div>

                {/* Intervention planifiée */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Intervention planifiée</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(dateIntervention)} · {intervention.description || 'Intervention'}
                    </p>
                  </div>
                </div>

                {/* Rapport soumis */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">3</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="font-medium">Rapport soumis</p>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Diagnostic</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{intervention.rapportMaintenance!.diagnostic}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Actions effectuées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{intervention.rapportMaintenance!.actionsEffectuees}</p>
                      </CardContent>
                    </Card>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Résultat</p>
                      <Badge className={resultatColor[intervention.rapportMaintenance!.resultat as RapportResultat]}>
                        {intervention.rapportMaintenance!.resultat}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Clôture */}
                {intervention.statut === 'TERMINEE' && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center relative z-10">
                      <span className="text-white text-xs">4</span>
                    </div>
                    <div>
                      <p className="font-medium">Clôture</p>
                      <p className="text-sm text-muted-foreground">Demande marquée comme TRAITÉE</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Print/Export buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.print()} className="flex-1 md:w-auto">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button variant="outline" onClick={() => window.open(`/api/interventions/${interventionId}/export`, '_blank')} className="flex-1 md:w-auto">
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Print styles (reuse from technician version) */}
      <style jsx global>{`
        @media print {
          [data-radix-tabs-content] > div:not(.space-y-6) {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

// Helper badge components
function StatutInterventionBadge({ statut }: { statut: StatutIntervention }) {
  const config: Record<StatutIntervention, string> = {
    OUVERTE: 'bg-yellow-100 text-yellow-800',
    EN_COURS: 'bg-purple-100 text-purple-800',
    TERMINEE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
  }
  return (
    <Badge className={config[statut]}>
      {statut.replace('_', ' ')}
    </Badge>
  )
}

function StatutDemandeBadge({ statut }: { statut: StatutDemande }) {
  const config: Record<StatutDemande, { label: string; className: string }> = {
    EN_ATTENTE: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
    VALIDEE: { label: 'Validée', className: 'bg-blue-100 text-blue-800' },
    EN_COURS: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
    TRAITEE: { label: 'Traitée', className: 'bg-green-100 text-green-800' },
    REJETEE: { label: 'Rejetée', className: 'bg-red-100 text-red-800' },
    ANNULEE: { label: 'Annulée', className: 'bg-gray-100 text-gray-800' },
  }
  return (
    <Badge className={config[statut].className}>
      {config[statut].label}
    </Badge>
  )
}
