// =============================================================================
// ADMIN EQUIPMENT LIST PAGE - SGME
// =============================================================================
// This page displays a list of all equipment in the system.
// It provides:
// - Search and filter functionality
// - Equipment table with key information
// - Actions for each equipment (view, edit, delete)
// - Responsive design for all screen sizes
// - Slide-in drawer for creating/editing equipment
//
// Only administrators can access this page.
// =============================================================================

"use client"

import { useState } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  Package, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EquipementDrawer } from "@/components/equipements/EquipementDrawer"
import type { EquipementWithDemandes } from "@/types/equipement"

// =============================================================================
// MOCK EQUIPMENT DATA
// =============================================================================
const mockEquipements: EquipementWithDemandes[] = [
  {
    id: 1,
    nom: "Compresseur industriel",
    type: "Compresseur",
    marque: "Atlas Copco",
    modele: "GA110",
    numeroSerie: "SN-2024-001",
    etat: "DISPONIBLE",
    localisation: "Atelier A",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    nom: "Pompe hydraulique",
    type: "Pompe",
    marque: "KSB",
    modele: "MegaFlow 200",
    numeroSerie: "SN-2024-002",
    etat: "EN_MAINTENANCE",
    localisation: "Atelier B",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    nom: "Convoyeur principal",
    type: "Convoyeur",
    marque: "Siemens",
    modele: "C-2000",
    numeroSerie: "SN-2024-003",
    etat: "DISPONIBLE",
    localisation: "Zone de production",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    nom: "Générateur électrique",
    type: "Générateur",
    marque: "Caterpillar",
    modele: "XQ-500",
    numeroSerie: "SN-2024-004",
    etat: "EN_PANNE",
    localisation: "Salle des machines",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    nom: "Tour CNC",
    type: "Machine-outil",
    marque: "Haas",
    modele: "VF-2SS",
    numeroSerie: "SN-2024-005",
    etat: "DISPONIBLE",
    localisation: "Atelier C",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    nom: "Système de climatisation",
    type: "Climatisation",
    marque: "Carrier",
    modele: "Chiller-300",
    numeroSerie: "SN-2024-006",
    etat: "EN_MAINTENANCE",
    localisation: "Bureau principal",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    nom: "Pont roulant",
    type: "Manutention",
    marque: "Konecranes",
    modele: "SM50",
    numeroSerie: "SN-2024-007",
    etat: "DISPONIBLE",
    localisation: "Hall principal",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 8,
    nom: "Robot de soudure",
    type: "Robot",
    marque: "FANUC",
    modele: "ARC Mate 100iD",
    numeroSerie: "SN-2024-008",
    etat: "DISPONIBLE",
    localisation: "Zone de soudure",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 9,
    nom: "Ordinateur industriel",
    type: "Informatique",
    marque: "Dell",
    modele: "OptiPlex 7090",
    numeroSerie: "SN-2024-009",
    etat: "HORS_SERVICE",
    localisation: "Zone de soudure",
    adminId: null,
    admin: null,
    demandesMaintenance: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// =============================================================================
// EQUIPMENT LIST PAGE COMPONENT
// =============================================================================
export default function EquipmentListPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEquipement, setSelectedEquipement] = useState<EquipementWithDemandes | null>(null)

  const handleSuccess = () => {
    // Refresh the list after successful save
  }

  const handleAdd = () => {
    setSelectedEquipement(null)
    setDrawerOpen(true)
  }

  const handleEdit = (equipement: EquipementWithDemandes) => {
    setSelectedEquipement(equipement)
    setDrawerOpen(true)
  }

  const handleClose = () => {
    setDrawerOpen(false)
    setSelectedEquipement(null)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des équipements</h1>
          <p className="text-muted-foreground">
            Gérez tous les équipements du système
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un équipement
        </Button>
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un équipement</CardTitle>
          <CardDescription>
            Recherchez par nom, type, marque ou localisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher un équipement..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Equipment table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des équipements</CardTitle>
          <CardDescription>
            {mockEquipements.length} équipement(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {mockEquipements.map((equipement) => (
              <div
                key={equipement.id}
                className="flex flex-col gap-3 p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{equipement.nom}</p>
                      <p className="text-sm text-muted-foreground">{equipement.type}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      equipement.etat === "DISPONIBLE"
                        ? "bg-green-500/10 text-green-500"
                        : equipement.etat === "EN_PANNE"
                        ? "bg-red-500/10 text-red-500"
                        : equipement.etat === "EN_MAINTENANCE"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {equipement.etat}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Marque</p>
                    <p className="font-medium">{equipement.marque}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Modèle</p>
                    <p className="font-medium">{equipement.modele}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">N° Série</p>
                    <p className="font-medium">{equipement.numeroSerie}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Localisation</p>
                    <p className="font-medium">{equipement.localisation}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(equipement)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marque</TableHead>
                  <TableHead>Modèle</TableHead>
                  <TableHead>N° Série</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEquipements.map((equipement) => (
                  <TableRow key={equipement.id}>
                    <TableCell className="font-medium">{equipement.nom}</TableCell>
                    <TableCell>{equipement.type}</TableCell>
                    <TableCell>{equipement.marque}</TableCell>
                    <TableCell>{equipement.modele}</TableCell>
                    <TableCell className="font-mono text-sm">{equipement.numeroSerie}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          equipement.etat === "DISPONIBLE"
                            ? "bg-green-500/10 text-green-500"
                            : equipement.etat === "EN_PANNE"
                            ? "bg-red-500/10 text-red-500"
                            : equipement.etat === "EN_MAINTENANCE"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {equipement.etat}
                      </span>
                    </TableCell>
                    <TableCell>{equipement.localisation}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(equipement)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EquipementDrawer
        open={drawerOpen}
        onClose={handleClose}
        equipement={selectedEquipement}
        onSuccess={handleSuccess}
      />
    </div>
  )
}