"use client"

import { useMemo, useState } from "react"
import { Package, Plus, Search, Eye, Edit, Trash2, ClipboardList, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"
import type { CommandeStockWithMateriel } from "@/types/stock"

interface CommandeStockListClientProps {
  initialCommandes: CommandeStockWithMateriel[]
}

export function CommandeStockListClient({ initialCommandes }: CommandeStockListClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredCommandes = useMemo(() => {
    let filtered = initialCommandes

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((c) =>
        c.fournisseur?.toLowerCase().includes(query) ||
        c.materiel.reference.toLowerCase().includes(query) ||
        c.materiel.nom.toLowerCase().includes(query)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter((c) => c.statut === filterStatus)
    }

    return filtered
  }, [initialCommandes, searchQuery, filterStatus])

  const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage)
  const paginatedCommandes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredCommandes.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredCommandes, currentPage])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterStatus = (value: string) => {
    setFilterStatus(value)
    setCurrentPage(1)
  }

  const handleDelete = async (id: number, fournisseur: string | null) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette commande${fournisseur ? ` de "${fournisseur}"` : ""} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/commandes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la suppression")
      }

      toast.success("Commande supprimée avec succès")
      toast.info("Rafraîchissez la page pour voir les changements")
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue")
    }
  }

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <ClipboardList className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      case "RECUE":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Package className="w-3 h-3 mr-1" />
            Reçue
          </Badge>
        )
      case "ANNULEE":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Trash2 className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        )
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes d'approvisionnement</CardTitle>
        <CardDescription>
          {filteredCommandes.length} commande(s) trouvée(s)
          {searchQuery && ` pour "${searchQuery}"`}
          {filterStatus && ` (${filterStatus === "EN_ATTENTE" ? "En attente" : filterStatus === "RECUE" ? "Reçue" : "Annulée"})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par fournisseur, référence, nom..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => handleFilterStatus(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="RECUE">Reçue</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium">Réf.</th>
                <th className="text-left py-3 px-4 font-medium">Matériel</th>
                <th className="text-left py-3 px-4 font-medium">Quantité</th>
                <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Fournisseur</th>
                <th className="text-left py-3 px-4 font-medium">Statut</th>
                <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCommandes.map((commande) => (
                <tr key={commande.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium">#{commande.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{commande.materiel.nom}</p>
                      <p className="text-xs text-muted-foreground font-mono">{commande.materiel.reference}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {commande.quantiteCommandee} {commande.materiel.unite}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                    {commande.fournisseur || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(commande.statut)}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                    {new Date(commande.dateCommande).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/admin/stock/commandes/${commande.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/admin/stock/commandes/${commande.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      {commande.statut !== "RECUE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(commande.id, commande.fournisseur)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedCommandes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
