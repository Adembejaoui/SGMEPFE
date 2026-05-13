// ROLE: TECHNICIEN — Client component for technician reports with two-pane layout
// Shows list of reports on the left, details on the right

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, FileText, Wrench, ClipboardList, Printer } from 'lucide-react'
import useSWR from 'swr'
import { toast } from 'sonner'
import type { RapportWithRelations, RapportResultat } from '@/types/intervention'
import type { PrioriteDemande, StatutDemande } from '@/types/demande'
import type { EquipmentType } from '@/types/equipement'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error('Erreur lors de la récupération des rapports')
    }
    return res.json()
  })

const resultatColor: Record<RapportResultat, string> = {
  'Problème résolu': 'bg-green-100 text-green-800',
  'Partiellement résolu': 'bg-yellow-100 text-yellow-800',
  'Non résolu — pièce manquante': 'bg-orange-100 text-orange-800',
  'Non résolu — intervention supplémentaire requise': 'bg-red-100 text-red-800',
}

const prioriteColor: Record<PrioriteDemande, string> = {
  BASSE: 'bg-blue-100 text-blue-800',
  MOYENNE: 'bg-yellow-100 text-yellow-800',
  HAUTE: 'bg-orange-100 text-orange-800',
  URGENTE: 'bg-red-100 text-red-800',
}

const statutDemandeColor: Record<StatutDemande, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-800',
  VALIDEE: 'bg-blue-100 text-blue-800',
  EN_COURS: 'bg-purple-100 text-purple-800',
  TRAITEE: 'bg-green-100 text-green-800',
  REJETEE: 'bg-red-100 text-red-800',
  ANNULEE: 'bg-gray-100 text-gray-800',
}

export function RapportsTechnicienClient() {
  const [selectedRapportId, setSelectedRapportId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'informations' | 'rapport' | 'resume'>('informations')
  const { data, error, isLoading, mutate } = useSWR<{
    data: RapportWithRelations[]
    pagination: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
  }>('/api/rapports', fetcher, { revalidateOnFocus: false, revalidateOnReconnect: false })

  const rapports = data?.data || []
  const selectedRapport = rapports.find((r) => r.idRapport === selectedRapportId) || null

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
  }

  const handleExportPDF = () => {
    if (!selectedRapport) return
    // Get the associated intervention ID to export
    const interventionId = selectedRapport.demande.interventions?.[0]?.idIntervention
    if (!interventionId) {
      toast.error('Aucune intervention associée')
      return
    }
    window.open(`/api/interventions/${interventionId}/export`, '_blank')
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur lors du chargement des rapports</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports d'intervention</h1>
          <p className="text-muted-foreground">Consultez et gérez vos rapports de maintenance</p>
        </div>
      </div>

      {/* Main content: two-pane layout */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left pane: Report list */}
        <div className="w-full md:w-96 lg:w-[400px] flex flex-col border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Liste des rapports</h2>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Chargement...' : `${rapports.length} rapport(s)`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : rapports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mb-2 opacity-50" />
                <p>Aucun rapport</p>
                <p className="text-sm">Les rapports apparaîtront ici une fois complétés.</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {rapports.map((rapport) => (
                  <button
                    key={rapport.idRapport}
                    onClick={() => {
                      setSelectedRapportId(rapport.idRapport)
                      setActiveTab('informations')
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRapportId === rapport.idRapport
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card hover:bg-muted/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          Demande #{rapport.demande.idDemande}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {rapport.demande.equipement.nom}
                        </p>
                      </div>
                      <Badge className={`text-xs shrink-0 ${resultatColor[rapport.resultat as RapportResultat]}`}>
                        {rapport.resultat.split(' ')[0]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(rapport.dateModification)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Detail view */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
          {!selectedRapport ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez un rapport</p>
              <p className="text-sm">Choisissez un rapport dans la liste pour voir les détails.</p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="p-4 border-b space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      Rapport #{selectedRapport.idRapport}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Demande #{selectedRapport.demande.idDemande} · {selectedRapport.demande.equipement.nom}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={resultatColor[selectedRapport.resultat as RapportResultat]}>
                    {selectedRapport.resultat}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Dernière modification: {formatDate(selectedRapport.dateModification)}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex-1 overflow-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="informations" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Informations
                      </TabsTrigger>
                      <TabsTrigger value="rapport" className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Rapport
                      </TabsTrigger>
                      <TabsTrigger value="resume" className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Résumé
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* Tab: Informations */}
                  <TabsContent value="informations" className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Demande info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Demande
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">N° Demande</p>
                            <p>#{selectedRapport.demande.idDemande}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Date de demande</p>
                            <p>{formatDate(selectedRapport.demande.dateDemande)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Priorité</p>
                            <Badge className={prioriteColor[selectedRapport.demande.priorite]}>{selectedRapport.demande.priorite}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Statut</p>
                            <Badge className={statutDemandeColor[selectedRapport.demande.statut]}>{selectedRapport.demande.statut.replace('_', ' ')}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Description</p>
                            <p className="text-sm">{selectedRapport.demande.description}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Client info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            {selectedRapport.demande.client.prenom[0]}{selectedRapport.demande.client.nom[0]}
                            Client
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Nom</p>
                            <p>{selectedRapport.demande.client.prenom} {selectedRapport.demande.client.nom}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Email</p>
                            <p>{selectedRapport.demande.client.email}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Equipment info - full width */}
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            Équipement concerné
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Nom</p>
                              <p>{selectedRapport.demande.equipement.nom}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Type</p>
                              <p>{selectedRapport.demande.equipement.type}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Marque / Modèle</p>
                              <p>{selectedRapport.demande.equipement.marque} {selectedRapport.demande.equipement.modele}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">N° Série</p>
                              <p>{selectedRapport.demande.equipement.numeroSerie}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Localisation</p>
                              <p>{selectedRapport.demande.equipement.localisation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Tab: Rapport */}
                  <TabsContent value="rapport" className="p-4 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Diagnostic</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedRapport.diagnostic}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Actions effectuées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{selectedRapport.actionsEffectuees}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Résultat</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={resultatColor[selectedRapport.resultat as RapportResultat]}>
                          {selectedRapport.resultat}
                        </Badge>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Tab: Résumé (Timeline) */}
                  <TabsContent value="resume" className="p-4">
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
                            {formatDate(selectedRapport.demande.dateDemande)} · par {selectedRapport.demande.client.prenom} {selectedRapport.demande.client.nom}
                          </p>
                        </div>
                      </div>

                      {/* Intervention */}
                      {selectedRapport.demande.interventions && selectedRapport.demande.interventions.length > 0 && (
                        <div className="relative flex items-start gap-4 pb-8">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                            <span className="text-primary-foreground text-xs">2</span>
                          </div>
                          <div>
                            <p className="font-medium">Intervention effectuée</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedRapport.demande.interventions[0].description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Rapport soumis */}
                      <div className="relative flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center relative z-10">
                          <span className="text-white text-xs">3</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <p className="font-medium">Rapport soumis</p>
                          <div className="text-sm text-muted-foreground">
                            <p>Créé le {formatDate(selectedRapport.dateCreation)}</p>
                            <p>Modifié le {formatDate(selectedRapport.dateModification)}</p>
                          </div>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Diagnostic</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{selectedRapport.diagnostic}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Actions effectuées</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{selectedRapport.actionsEffectuees}</p>
                            </CardContent>
                          </Card>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Résultat</p>
                            <Badge className={resultatColor[selectedRapport.resultat as RapportResultat]}>
                              {selectedRapport.resultat}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
