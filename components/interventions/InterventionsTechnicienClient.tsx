// ROLE: TECHNICIEN — Client component for technicien interventions management

'use client'

import { useMemo, useState } from 'react'
import { Search, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { toast } from 'sonner'
import { useInterventions } from '@/hooks/useInterventions'
import { useSession } from 'next-auth/react'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { EquipementTypeBadge } from '@/components/demandes/badges/EquipementTypeBadge'
import type { StatutIntervention } from '@/types/demande'

const statutInterventionConfig: Record<StatutIntervention, { label: string; className: string }> = {
  OUVERTE: {
    label: 'Ouverte',
    className: 'bg-yellow-100 text-yellow-800',
  },
  EN_COURS: {
    label: 'En cours',
    className: 'bg-purple-100 text-purple-800',
  },
  TERMINEE: {
    label: 'Terminée',
    className: 'bg-green-100 text-green-800',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-red-100 text-red-800',
  },
}

export function InterventionsTechnicienClient() {
  const [statutFilter, setStatutFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({})
  const { data: session } = useSession()

  const { interventions, isLoading, error, mutate } = useInterventions({
    statut: statutFilter === 'ALL' ? undefined : statutFilter || undefined,
  })

  const filteredInterventions = useMemo(() => {
    if (!searchQuery) return interventions
    const query = searchQuery.toLowerCase()
    return interventions.filter(
      (i) =>
        i.description.toLowerCase().includes(query) ||
        i.demande.description.toLowerCase().includes(query) ||
        i.demande.equipement.nom.toLowerCase().includes(query)
    )
  }, [interventions, searchQuery])

  const handleStatutChange = async (idIntervention: number, nouveauStatut: StatutIntervention) => {
    setSavingRows((prev) => ({ ...prev, [idIntervention]: true }))

    try {
      const response = await fetch(`/api/interventions/${idIntervention}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      toast.success('Statut mis à jour')
      mutate()
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setSavingRows((prev) => ({ ...prev, [idIntervention]: false }))
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur lors du chargement des interventions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes interventions</h1>
        <p className="text-muted-foreground">Gérez les interventions sur les demandes assignées</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrer les interventions</CardTitle>
          <CardDescription>Filtrez par statut</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par description, demande ou équipement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="OUVERTE">Ouverte</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TERMINEE">Terminée</SelectItem>
                  <SelectItem value="ANNULEE">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des interventions</CardTitle>
          <CardDescription>
            {filteredInterventions.length} intervention(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune intervention trouvée</p>
              <p className="text-muted-foreground">Aucune demande assignée pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Demande #</TableHead>
                      <TableHead>Équipement</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Client</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut intervention</TableHead>
                      <TableHead className="max-w-xs truncate">Description</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden sm:table-cell">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredInterventions.map((intervention) => {
                    const statutConfig = statutInterventionConfig[intervention.statut as StatutIntervention]

                    return (
                      <TableRow key={intervention.idIntervention}>
                        <TableCell className="font-medium">#{intervention.demande.idDemande}</TableCell>
                        <TableCell className="font-medium">{intervention.demande.equipement.nom}</TableCell>
                        <TableCell>
                          <EquipementTypeBadge type={intervention.demande.equipement.type as any} />
                        </TableCell>
                        <TableCell>
                          {intervention.demande.client.firstName} {intervention.demande.client.lastName}
                        </TableCell>
                        <TableCell>
                          <PrioriteBadge priorite={intervention.demande.priorite} />
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statutConfig.className}`}>
                            {statutConfig.label}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {intervention.description.length > 50
                            ? `${intervention.description.substring(0, 50)}...`
                            : intervention.description}
                        </TableCell>
                        <TableCell>
                          {new Date(intervention.createdAt).toLocaleDateString('fr-FR')}
                        </TableCell>
                         <TableCell>
                           <Select
                             value={intervention.statut}
                             onValueChange={(value) =>
                               handleStatutChange(intervention.idIntervention, value as StatutIntervention)
                             }
                             disabled={savingRows[intervention.idIntervention]}
                           >
                             <SelectTrigger className="w-35">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="OUVERTE">Ouverte</SelectItem>
                               <SelectItem value="EN_COURS">En cours</SelectItem>
                               <SelectItem value="TERMINEE">Terminée</SelectItem>
                               <SelectItem value="ANNULEE">Annulée</SelectItem>
                             </SelectContent>
                           </Select>
                           {savingRows[intervention.idIntervention] && (
                             <Loader2 className="w-4 h-4 animate-spin mt-1" />
                           )}
                         </TableCell>
                         <TableCell>
                           <Link href={`/dashboard/technicien/interventions/${intervention.idIntervention}`} className="text-primary hover:underline">
                             Détails
                           </Link>
                         </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}