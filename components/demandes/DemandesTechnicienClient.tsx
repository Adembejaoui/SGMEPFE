// ROLE: TECHNICIEN — Client component for technicien demandes management

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
import { useDemandes } from '@/hooks/useDemandes'
import { useSession } from 'next-auth/react'
import { PrioriteBadge } from '@/components/demandes/badges/PrioriteBadge'
import { StatutBadge } from '@/components/demandes/badges/StatutBadge'
import { EquipementTypeBadge } from '@/components/demandes/badges/EquipementTypeBadge'
import type { StatutDemande } from '@/types/demande'

export function DemandesTechnicienClient() {
  const [statutFilter, setStatutFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({})
  const { data: session } = useSession()

  const { demandes, isLoading, error, mutate } = useDemandes({
    statut: statutFilter === 'ALL' ? undefined : statutFilter || undefined,
  })

  const filteredDemandes = useMemo(() => {
    if (!searchQuery) return demandes
    const query = searchQuery.toLowerCase()
    return demandes.filter(
      (d) =>
        d.description.toLowerCase().includes(query) ||
        d.equipement.nom.toLowerCase().includes(query)
    )
  }, [demandes, searchQuery])

   const handleStatutChange = async (idDemande: number, nouveauStatut: StatutDemande) => {
     setSavingRows((prev) => ({ ...prev, [idDemande]: true }))

     try {
       const response = await fetch(`/api/demandes/${idDemande}`, {
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
       setSavingRows((prev) => ({ ...prev, [idDemande]: false }))
     }
   }

   const handleClaimRequest = async (idDemande: number) => {
     setSavingRows((prev) => ({ ...prev, [idDemande]: true }))

     try {
       const response = await fetch(`/api/demandes/${idDemande}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
       })

       if (!response.ok) {
         const errorData = await response.json()
         throw new Error(errorData.error || 'Erreur lors de la prise en charge')
       }

       toast.success('Demande prise en charge avec succès')
       mutate()
     } catch (error: any) {
       toast.error(error.message || 'Une erreur est survenue')
     } finally {
       setSavingRows((prev) => ({ ...prev, [idDemande]: false }))
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Demandes</h1>
        <p className="text-muted-foreground">Gérez le statut des demandes assignées</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrer les demandes</CardTitle>
          <CardDescription>Filtrez par statut</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par description ou équipement..."
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
                   <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                   <SelectItem value="VALIDEE">Validée</SelectItem>
                   <SelectItem value="EN_COURS">En cours</SelectItem>
                   <SelectItem value="TRAITEE">Traitée</SelectItem>
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
               <p className="text-lg font-medium">Aucune intervention assignée</p>
               <p className="text-muted-foreground">Pour le moment</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Équipement</TableHead>
                      <TableHead className="hidden sm:table-cell">Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut actuel</TableHead>
                      <TableHead className="hidden sm:table-cell">Compatibilité</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="hidden sm:table-cell">Date intervention</TableHead>
                    </TableRow>
                  </TableHeader>
                 <TableBody>
                   {filteredDemandes.map((demande) => {
                     // Determine compatibility status
                     let compatibiliteText = '';
                     let compatibiliteClass = '';
                     let showClaimButton = false;
                     
                     if (demande.technician !== null) {
                       // Already claimed
                       compatibiliteText = 'Déjà prise en charge';
                       compatibiliteClass = 'bg-gray-200 text-gray-800';
                     } else if (session?.user?.specialization && demande.equipement.type === session.user.specialization) {
                       // Compatible and unclaimed
                       compatibiliteText = 'Compatible';
                       compatibiliteClass = 'bg-green-100 text-green-800';
                       showClaimButton = true;
                     } else if (session?.user?.specialization) {
                       // Incompatible
                       compatibiliteText = 'Non compatible';
                       compatibiliteClass = 'bg-red-100 text-red-800';
                     } else {
                       // No specialization set
                       compatibiliteText = 'Spécialisation non définie';
                       compatibiliteClass = 'bg-yellow-100 text-yellow-800';
                     }
                     
                     return (
                       <TableRow key={demande.idDemande}>
                         <TableCell className="font-medium">{demande.equipement.nom}</TableCell>
                         <TableCell>
                           <EquipementTypeBadge type={demande.equipement.type as any} />
                         </TableCell>
                         <TableCell className="max-w-xs truncate">
                           {demande.description.length > 50
                             ? `${demande.description.substring(0, 50)}...`
                             : demande.description}
                         </TableCell>
                         <TableCell>
                           <PrioriteBadge priorite={demande.priorite} />
                         </TableCell>
                         <TableCell>
                           <StatutBadge statut={demande.statut} />
                         </TableCell>
                         <TableCell>
                           <span className={`px-2 py-1 rounded-full text-sm font-medium ${compatibiliteClass}`}>
                             {compatibiliteText}
                           </span>
                         </TableCell>
                         <TableCell>
                           {showClaimButton && !savingRows[demande.idDemande] ? (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleClaimRequest(demande.idDemande)}
                               className="w-full"
                             >
                               Prendre en charge
                             </Button>
                           ) : savingRows[demande.idDemande] ? (
                             <Loader2 className="w-4 h-4 animate-spin" />
                           ) : null}
                         </TableCell>
                         <TableCell>
                           {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                         </TableCell>
                       </TableRow>
                     );
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