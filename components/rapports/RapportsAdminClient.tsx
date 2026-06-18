// ROLE: ADMIN — Client component for admin reports management with full overview

'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Search, FileText, ClipboardList, Printer } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { toast } from 'sonner'
import type { RapportResultat } from '@/types/intervention'
import type { PrioriteDemande, StatutDemande } from '@/types/demande'

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const err = res.json().then((data: any) => data.error || 'Erreur')
      return err.then((e) => { throw new Error(e) })
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

interface RapportListItem {
  idRapport: number
  demandeId: number
  diagnostic: string
  actionsEffectuees: string
  resultat: RapportResultat
  dateCreation: Date
  dateModification: Date
  demande: {
    idDemande: number
    description: string
    priorite: PrioriteDemande
    statut: StatutDemande
    dateDemande: Date
    client: { nom: string; prenom: string; email: string }
    equipement: {
      idEquipement: number
      nom: string
      type: string
      marque: string
      modele: string
      numeroSerie: string
      localisation: string
    }
    interventions: Array<{ idIntervention: number; description: string; statut: string }>
    technician?: { id: string; nom: string; prenom: string; email: string } | null
  }
}

export function RapportsAdminClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [prioriteFilter, setPrioriteFilter] = useState<string>('ALL')
  const [technicianFilter, setTechnicianFilter] = useState<string>('ALL')
  const [selectedRapportId, setSelectedRapportId] = useState<number | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{
    data: RapportListItem[]
    pagination: { total: number; page: number; limit: number; totalPages: number }
  }>(
    `/api/rapports?${new URLSearchParams({
      search: searchQuery,
      priorite: prioriteFilter === 'ALL' ? '' : prioriteFilter,
      technicianId: technicianFilter === 'ALL' ? '' : technicianFilter,
    })}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  )

  const rapports = data?.data || []
  const selectedRapport = rapports.find((r) => r.idRapport === selectedRapportId) || null

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
  }

  const handleExportPDF = () => {
    if (!selectedRapport) return
    const interventionId = selectedRapport.demande.interventions?.[0]?.idIntervention
    if (!interventionId) {
      toast.error('Aucune intervention associée')
      return
    }
    window.open(`/api/interventions/${interventionId}/export`, '_blank')
  }

  // Stats
  const stats = useMemo(() => {
    return {
      total: rapports.length,
      resolu: rapports.filter((r) => r.resultat === 'Problème résolu').length,
      partiel: rapports.filter((r) => r.resultat === 'Partiellement résolu').length,
      nonResolu: rapports.filter((r) => r.resultat.includes('Non résolu')).length,
    }
  }, [rapports])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports d'intervention</h1>
          <p className="text-muted-foreground">Consultez tous les rapports de maintenance du système</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total rapports</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{stats.resolu}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partiellement résolus</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-yellow-600">{stats.partiel}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non résolus</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{stats.nonResolu}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer les rapports</CardTitle>
          <CardDescription>Recherchez et filtrez par priorité ou technicien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par diagnostic, équipement, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes</SelectItem>
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="MOYENNE">Moyenne</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Technicien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les techniciens</SelectItem>
                  {/* Technicians will be populated from API in a real app; hardcoded for now */}
                  <SelectItem value="tech-1">Jean Dupont</SelectItem>
                  <SelectItem value="tech-2">Marie Curie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-pane layout */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left: Table - takes remaining space */}
        <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Liste des rapports</h2>
            <p className="text-sm text-muted-foreground">{isLoading ? 'Chargement...' : `${rapports.length} rapport(s)`}</p>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
              </div>
            ) : rapports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mb-2 opacity-50" />
                <p>Aucun rapport</p>
              </div>
            ) : (
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>#</TableHead>
                     <TableHead>Équipement</TableHead>
                     <TableHead className="hidden sm:table-cell">Client</TableHead>
                     <TableHead className="hidden sm:table-cell">Technicien</TableHead>
                     <TableHead>Résultat</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Action</TableHead>
                   </TableRow>
                 </TableHeader>
                  <TableBody>
                    {rapports.map((rapport) => (
                      <TableRow
                        key={rapport.idRapport}
                        className={selectedRapportId === rapport.idRapport ? 'bg-primary/10 cursor-pointer' : 'cursor-pointer'}
                        onClick={() => {
                          setSelectedRapportId(rapport.idRapport)
                        }}
                      >
                      <TableCell className="font-medium">#{rapport.idRapport}</TableCell>
                      <TableCell>
                        <div>
                          <p>{rapport.demande.equipement.nom}</p>
                          <p className="text-xs text-muted-foreground">{rapport.demande.equipement.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rapport.demande.client.prenom} {rapport.demande.client.nom}
                      </TableCell>
                       <TableCell>
                         {rapport.demande.technician
                           ? `${rapport.demande.technician.prenom} ${rapport.demande.technician.nom}`
                           : <span className="text-muted-foreground text-sm">—</span>
                         }
                       </TableCell>
                      <TableCell>
                        <Badge className={resultatColor[rapport.resultat as RapportResultat]}>
                          {rapport.resultat.split(' ')[0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(rapport.dateModification)}
                      </TableCell>
                       <TableCell>
                         <Button variant="ghost" size="sm" asChild>
                           <Link href={`/dashboard/admin/interventions/${rapport.demande.interventions?.[0]?.idIntervention}`}>
                             <Eye className="w-4 h-4" />
                           </Link>
                         </Button>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Right: Detail pane - PDF style */}
        <div className="w-[500px] flex-col border rounded-lg bg-background overflow-hidden hidden xl:block">
          {!selectedRapport ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez un rapport</p>
              <p className="text-sm">Cliquez sur une ligne pour voir le rapport complet.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b bg-muted/30">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Rapport d'Intervention #{selectedRapport.idRapport}</h2>
                    <p className="text-muted-foreground mt-1">
                      Demande #{selectedRapport.demande.idDemande} · {selectedRapport.demande.equipement.nom}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Résultat:</span>
                  <Badge className={resultatColor[selectedRapport.resultat as RapportResultat]}>
                    {selectedRapport.resultat}
                  </Badge>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">

                  {/* Section: Informations Générales */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Informations Générales</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">N° Demande:</span> #{selectedRapport.demande.idDemande}</div>
                      <div><span className="text-muted-foreground">Date de demande:</span> {formatDate(selectedRapport.demande.dateDemande)}</div>
                      <div><span className="text-muted-foreground">Priorité:</span> <Badge className={prioriteColor[selectedRapport.demande.priorite]}>{selectedRapport.demande.priorite}</Badge></div>
                      <div><span className="text-muted-foreground">Statut demande:</span> <Badge className={statutDemandeColor[selectedRapport.demande.statut]}>{selectedRapport.demande.statut.replace('_', ' ')}</Badge></div>
                    </div>
                  </section>

                  {/* Section: Client */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Client</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Nom:</span> {selectedRapport.demande.client.prenom} {selectedRapport.demande.client.nom}</div>
                      <div><span className="text-muted-foreground">Email:</span> {selectedRapport.demande.client.email}</div>
                    </div>
                  </section>

                  {/* Section: Technicien Assigné */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Technicien Assigné</h3>
                    {selectedRapport.demande.technician ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-muted-foreground">Nom:</span> {selectedRapport.demande.technician.prenom} {selectedRapport.demande.technician.nom}</div>
                        <div><span className="text-muted-foreground">Email:</span> {selectedRapport.demande.technician.email}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun technicien assigné</p>
                    )}
                  </section>

                  {/* Section: Équipement */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Équipement Concerné</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Nom:</span> {selectedRapport.demande.equipement.nom}</div>
                      <div><span className="text-muted-foreground">Type:</span> {selectedRapport.demande.equipement.type}</div>
                      <div><span className="text-muted-foreground">Marque:</span> {selectedRapport.demande.equipement.marque}</div>
                      <div><span className="text-muted-foreground">Modèle:</span> {selectedRapport.demande.equipement.modele}</div>
                      <div><span className="text-muted-foreground">N° Série:</span> {selectedRapport.demande.equipement.numeroSerie}</div>
                      <div><span className="text-muted-foreground">Localisation:</span> {selectedRapport.demande.equipement.localisation}</div>
                    </div>
                  </section>

                  {/* Section: Diagnostic */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Diagnostic</h3>
                    <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedRapport.diagnostic}
                    </div>
                  </section>

                  {/* Section: Actions Effectuées */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Actions Effectuées</h3>
                    <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                      {selectedRapport.actionsEffectuees}
                    </div>
                  </section>

                  {/* Section: Résultat */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Résultat</h3>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-base px-4 py-2 ${resultatColor[selectedRapport.resultat as RapportResultat]}`}>
                        {selectedRapport.resultat}
                      </Badge>
                    </div>
                  </section>

                  {/* Section: Timeline */}
                  <section>
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4">Historique</h3>
                    <div className="relative space-y-6 pl-6 border-l-2 border-muted">
                      <div className="relative -left-8 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Demande créée</p>
                          <p className="text-sm text-muted-foreground">{formatDate(selectedRapport.demande.dateDemande)}</p>
                        </div>
                      </div>
                      {selectedRapport.demande.interventions?.length > 0 && (
                        <div className="relative -left-8 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">2</span>
                          </div>
                          <div>
                            <p className="font-medium">Intervention</p>
                            <p className="text-sm text-muted-foreground">{selectedRapport.demande.interventions[0].description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(selectedRapport.dateCreation)}</p>
                          </div>
                        </div>
                      )}
                      <div className="relative -left-8 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                          <span className="text-white text-xs">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Rapport soumis</p>
                          <p className="text-sm text-muted-foreground">Créé le {formatDate(selectedRapport.dateCreation)}</p>
                          <p className="text-xs text-muted-foreground">Dernière modification: {formatDate(selectedRapport.dateModification)}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
