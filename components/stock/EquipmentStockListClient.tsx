"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Package, Plus, Search, Eye, Edit, Trash2, AlertTriangle, Boxes, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"
import type { MaterielListItem } from "@/types/stock"

interface EquipmentStockListClientProps {
  role?: string
}

interface PaginatedResponse {
  data: MaterielListItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function EquipmentStockListClient({ role }: EquipmentStockListClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [materiels, setMateriels] = useState<MaterielListItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10

  const fetchMateriels = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        type: filterType,
        search: searchQuery,
        lowStock: showLowStockOnly ? "true" : "false",
      })

      const response = await fetch(`/api/materiels?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch")
      }

      const result: PaginatedResponse = await response.json()
      setMateriels(result.data)
      setTotal(result.pagination.total)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      toast.error("Erreur lors du chargement des matériels")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterType, searchQuery, showLowStockOnly])

  useEffect(() => {
    fetchMateriels()
  }, [fetchMateriels])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterType = (value: string) => {
    setFilterType(value)
    setCurrentPage(1)
  }

  const handleToggleLowStock = () => {
    setShowLowStockOnly(!showLowStockOnly)
    setCurrentPage(1)
  }

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/materiels/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la suppression")
      }

      toast.success(`"${nom}" supprimé avec succès`)
      fetchMateriels()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue")
    }
  }

  const getStockBadge = (materiel: MaterielListItem) => {
    if (materiel.quantiteStock === 0) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Rupture
        </Badge>
      )
    }
    if (materiel.quantiteStock <= materiel.seuilAlerte) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Stock bas ({materiel.quantiteStock}/{materiel.seuilAlerte})
        </Badge>
      )
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        {materiel.quantiteStock} {materiel.unite}
      </Badge>
    )
  }

  const typeLabel: Record<string, string> = {
    PIECE_DETACHEE: "Pièce détachée",
    CONSOMMABLE: "Consommable",
    OUTIL: "Outil",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventaire des matériels</CardTitle>
        <CardDescription>
          {total} matériel(s) au total
          {searchQuery && ` · Recherche: "${searchQuery}"`}
          {filterType && ` · ${typeLabel[filterType] || filterType}`}
          {showLowStockOnly && " · Stock bas uniquement"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par référence ou nom..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => handleFilterType(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="PIECE_DETACHEE">Pièces détachées</option>
            <option value="CONSOMMABLE">Consommables</option>
            <option value="OUTIL">Outils</option>
          </select>
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            size="default"
            onClick={handleToggleLowStock}
            className="whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Stock bas
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Réf.</th>
                    <th className="text-left py-3 px-4 font-medium">Nom</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Stock</th>
                    <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Emplacement</th>
                    <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Utilisations</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materiels.map((materiel) => (
                    <tr key={materiel.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Boxes className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-medium">{materiel.reference}</p>
                            <p className="text-xs text-muted-foreground">{materiel.nom}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{materiel.nom}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge variant="outline">{typeLabel[materiel.type] || materiel.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getStockBadge(materiel)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground hidden sm:table-cell">
                        {materiel.emplacement || "—"}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <Badge variant="secondary">{materiel._count.utilisations}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/admin/stock/${materiel.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          {role === "ADMIN" && (
                            <>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/admin/stock/${materiel.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(materiel.id, materiel.nom)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {materiels.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        Aucun matériel trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} · {total} résultat(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}