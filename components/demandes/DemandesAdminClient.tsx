// ROLE: ADMIN — Client component for demandes management

'use client'

import { useMemo, useState } from 'react'
import { Eye, Edit, Trash2, Search, Filter, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDemandes } from '@/hooks/useDemandes'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import { DemandeAdminDrawer } from '@/components/demandes/DemandeAdminDrawer'
import { DeleteDemandeDialog } from '@/components/demandes/DeleteDemandeDialog'
import type { DemandeListItem, PrioriteDemande, StatutDemande } from '@/types/demande'
import { EquipementTypeBadge } from './badges/EquipementTypeBadge'
import { EquipmentType } from '@/types/equipement'

export function DemandesAdminClient() {
  const [statutFilter, setStatutFilter] = useState<string>('ALL')
  const [prioriteFilter, setPrioriteFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDemande, setSelectedDemande] = useState<DemandeListItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { demandes, isLoading, error, mutate } = useDemandes({
    statut: statutFilter === 'ALL' ? undefined : statutFilter || undefined,
    priorite: prioriteFilter === 'ALL' ? undefined : prioriteFilter || undefined,
  })

  const filteredDemandes = useMemo(() => {
    if (!searchQuery) return demandes
    const query = searchQuery.toLowerCase()
    return demandes.filter(
      (d) =>
        d.description.toLowerCase().includes(query) ||
        d.client.firstName.toLowerCase().includes(query) ||
        d.client.lastName.toLowerCase().includes(query) ||
        d.equipement.nom.toLowerCase().includes(query)
    )
  }, [demandes, searchQuery])

  const stats = useMemo(() => {
    return {
      total: demandes.length,
      enAttente: demandes.filter((d) => d.statut === 'EN_ATTENTE').length,
      urgente: demandes.filter((d) => d.priorite === 'URGENTE').length,
      traitee: demandes.filter((d) => d.statut === 'TRAITEE').length,
    }
  }, [demandes])

  const handleUpdateSuccess = () => {
    mutate()
    toast.success('Demande mise à jour avec succès')
  }

  const handleDeleteSuccess = () => {
    mutate()
    setDeleteDialogOpen(false)
    setSelectedDemande(null)
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur lors du chargement des demandes</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des demandes</h1>
        <p className="text-muted-foreground">Administrez toutes les demandes de maintenance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.enAttente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.urgente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Traitées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.traitee}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrer les demandes</CardTitle>
          <CardDescription>Affinez votre recherche avec les filtres ci-dessous</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par description, client ou équipement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                  <SelectItem value="VALIDEE">Validée</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TRAITEE">Traitée</SelectItem>
                  <SelectItem value="REJETEE">Rejetée</SelectItem>
                  <SelectItem value="ANNULEE">Annulée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
                <SelectTrigger className="w-45">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les priorités</SelectItem>
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="MOYENNE">Moyenne</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des demandes</CardTitle>
<CardDescription>
               {filteredDemandes.length} demande(s) correspondant à votre recherche
               {(statutFilter !== 'ALL' || prioriteFilter !== 'ALL') && ' (filtré)'}
             </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune demande trouvée</p>
              <p className="text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">#</TableHead>
                      <TableHead className="hidden sm:table-cell">Créé par</TableHead>
                      <TableHead>Équipement</TableHead>
                      <TableHead className="hidden sm:table-cell">type</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Technicien</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                    {filteredDemandes.map((demande) => (
                      <TableRow key={demande.idDemande}>
                        <TableCell className="font-medium hidden sm:table-cell">{demande.idDemande}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {demande.client.firstName} {demande.client.lastName}
                        </TableCell>
                         <TableCell>{demande.equipement.nom}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <EquipementTypeBadge type={demande.equipement.type as EquipmentType} />
                        </TableCell>
                       <TableCell>
                         <StatutBadge statut={demande.statut} />
                       </TableCell>

                         <TableCell className="font-medium hidden sm:table-cell">{demande.technician?.firstName} {demande.technician?.lastName}</TableCell>
                       <TableCell className="hidden sm:table-cell">
                         {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Button variant="ghost" size="sm" asChild>
                             <Link href={`/dashboard/admin/demandes/${demande.idDemande}`}>
                               <Eye className="w-4 h-4" />
                             </Link>
                           </Button>
                           
                           <Button
                             variant="ghost"
                             size="sm"
                             className="text-destructive hover:text-destructive"
                             onClick={() => {
                               setSelectedDemande(demande)
                               setDeleteDialogOpen(true)
                             }}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DemandeAdminDrawer
        demande={selectedDemande}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleUpdateSuccess}
      />

      <DeleteDemandeDialog
        demandeId={selectedDemande?.idDemande ?? null}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}