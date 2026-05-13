// =============================================================================
// EQUIPMENT LIST CLIENT - SGME
// =============================================================================
// Client component for equipment list with search, filter, and pagination.
// =============================================================================

"use client"

import { useMemo, useState } from "react"
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"
import type { EquipementListItem } from "@/types/equipement"

interface EquipmentListClientProps {
  initialEquipements: (EquipementListItem & { demandesMaintenance: any[] })[]
}

export function EquipmentListClient({ initialEquipements }: EquipmentListClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEtat, setFilterEtat] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredEquipements = useMemo(() => {
    let filtered = initialEquipements

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((eq) =>
        eq.nom.toLowerCase().includes(query) ||
        eq.numeroSerie.toLowerCase().includes(query) ||
        eq.type.toLowerCase().includes(query) ||
        eq.modele.toLowerCase().includes(query)
      )
    }

    if (filterEtat) {
      filtered = filtered.filter((eq) => eq.etat === filterEtat)
    }

    return filtered
  }, [initialEquipements, searchQuery, filterEtat])

  const totalPages = Math.ceil(filteredEquipements.length / itemsPerPage)
  const paginatedEquipements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredEquipements.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredEquipements, currentPage])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterEtat = (value: string) => {
    setFilterEtat(value)
    setCurrentPage(1)
  }

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${nom}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      const response = await fetch(`/api/equipements/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la suppression")
      }

      toast.success(`Équipement "${nom}" supprimé avec succès`)
      toast.info("Rafraîchissez la page pour voir les changements")
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de la suppression")
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      DISPONIBLE: { label: "Disponible", className: "bg-green-500/10 text-green-500", icon: CheckCircle },
      EN_MAINTENANCE: { label: "En maintenance", className: "bg-blue-500/10 text-blue-500", icon: Wrench },
      EN_PANNE: { label: "En panne", className: "bg-red-500/10 text-red-500", icon: AlertTriangle },
      HORS_SERVICE: { label: "Hors service", className: "bg-yellow-500/10 text-yellow-500", icon: AlertTriangle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DISPONIBLE
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des équipements</h1>
          <p className="text-muted-foreground">Gérez tous les équipements du système</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/equipment/create">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un équipement
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher un équipement</CardTitle>
          <CardDescription>Recherchez par nom, référence, type ou modèle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher par nom, type, modèle..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterEtat}
                onChange={(e) => handleFilterEtat(e.target.value)}
              >
                <option value="">Tous les états</option>
                <option value="DISPONIBLE">Disponible</option>
                <option value="EN_PANNE">En panne</option>
                <option value="EN_MAINTENANCE">En maintenance</option>
                <option value="HORS_SERVICE">Hors service</option>
              </select>
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des équipements</CardTitle>
          <CardDescription>
            {filteredEquipements.length} équipement(s) correspondant{filteredEquipements.length > 1 ? "ent" : ""}
            {searchQuery && ` à "${searchQuery}"`}
            {filterEtat && ` (état: ${filterEtat})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:hidden">
            {paginatedEquipements.map((equipment) => (
              <div key={equipment.id} className="flex flex-col gap-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{equipment.nom}</p>
                      <p className="text-sm text-muted-foreground">{equipment.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={equipment.etat} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Modèle</p>
                    <p className="font-medium">{equipment.modele}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">localisation</p>
                    <p className="font-medium">{equipment.localisation}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dernière maintenance</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(equipment.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Dossiers</p>
                    <p className="font-medium">{equipment.demandesMaintenance.length}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/admin/equipment/${equipment.id}`}>
                      <Eye className="w-4 h-4 mr-1" /> Voir
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/dashboard/admin/equipment/${equipment.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1" /> Modifier
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(equipment.id, equipment.nom)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Équipement</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Marque</th>
                  <th className="text-left py-3 px-4 font-medium">Modèle</th>
                  <th className="text-left py-3 px-4 font-medium">N° Série</th>
                  <th className="text-left py-3 px-4 font-medium">Localisation</th>
                  <th className="text-left py-3 px-4 font-medium">Statut</th>
                  <th className="text-left py-3 px-4 font-medium">Dossiers</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipements.map((equipment) => (
                  <tr key={equipment.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{equipment.nom}</p>
                          <p className="text-sm text-muted-foreground">{equipment.numeroSerie}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{equipment.type}</td>
                    <td className="py-3 px-4">{equipment.marque}</td>
                    <td className="py-3 px-4">{equipment.modele}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{equipment.numeroSerie}</Badge>
                    </td>
                    <td className="py-3 px-4">{equipment.localisation}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={equipment.etat} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{equipment.demandesMaintenance.length}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/equipment/${equipment.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/equipment/${equipment.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(equipment.id, equipment.nom)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</p>
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
    </div>
  )
}