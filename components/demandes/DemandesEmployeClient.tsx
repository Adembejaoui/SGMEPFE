// ROLE: EMPLOYE — Client component for employe demandes management

'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, AlertCircle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDemandes } from '@/hooks/useDemandes'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import { DemandeDrawer } from '@/components/demandes/DemandeDrawer'
import { EquipementTypeBadge } from './badges/EquipementTypeBadge'
import { EquipmentType } from '@/types/equipement'

export function DemandesEmployeClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { demandes, isLoading, error, mutate } = useDemandes()

  const filteredDemandes = useMemo(() => {
    if (!searchQuery) return demandes
    const query = searchQuery.toLowerCase()
    return demandes.filter(
      (d) =>
        d.description.toLowerCase().includes(query) ||
        d.equipement.nom.toLowerCase().includes(query)
    )
  }, [demandes, searchQuery])

  const handleCancel = async (idDemande: number, statut: string) => {
    if (statut !== 'EN_ATTENTE') return

    if (!confirm('Voulez-vous annuler cette demande ?')) return

    try {
      const response = await fetch(`/api/demandes/${idDemande}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'ANNULEE' }),
      })

      if (!response.ok) throw new Error('Erreur lors de l\'annulation')

      toast.success('Demande annulée avec succès')
      mutate()
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes demandes</h1>
          <p className="text-muted-foreground">Gérez vos demandes de maintenance</p>
        </div>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher vos demandes</CardTitle>
          <CardDescription>Filtrez par description ou équipement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par description ou équipement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste de vos demandes</CardTitle>
          <CardDescription>
            {filteredDemandes.length} demande(s)
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Vous n'avez aucune demande</p>
              <p className="text-muted-foreground mb-4">
                Créez votre première demande de maintenance
              </p>
               <Button onClick={() => setDrawerOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une demande
                </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Équipement</TableHead>
                     <TableHead>Description</TableHead>
                     <TableHead className="hidden sm:table-cell">Priorité</TableHead>
                     <TableHead className="hidden sm:table-cell">Statut</TableHead>
                     <TableHead className="hidden sm:table-cell">Date</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filteredDemandes.map((demande) => (
                    <TableRow key={demande.idDemande}>
                       <TableCell className="font-medium">{demande.equipement.nom}</TableCell>
                       <TableCell className="max-w-xs truncate">
                         {demande.description.length > 50
                           ? `${demande.description.substring(0, 50)}...`
                           : demande.description}
                       </TableCell>
                       <TableCell>
                         <EquipementTypeBadge type={demande.equipement.type as EquipmentType} />
                       </TableCell>
                       <TableCell>
                         <PrioriteBadge priorite={demande.priorite} />
                       </TableCell>
                      <TableCell>
                        {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/employe/demandes/${demande.idDemande}`}>
                              Voir
                            </Link>
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

      <DemandeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={mutate} />
    </div>
  )
}