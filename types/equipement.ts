// =============================================================================
// EQUIPMENT TYPES - SGME
// =============================================================================
// TypeScript type definitions for equipment-related operations.
// =============================================================================

// =============================================================================
// EQUIPMENT STATE TYPE
// =============================================================================
export type EtatEquipement = "DISPONIBLE" | "EN_PANNE" | "EN_MAINTENANCE" | "HORS_SERVICE"

// =============================================================================
// USER TYPE (MINIMAL)
// =============================================================================
export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "ADMIN" | "EMPLOYE" | "TECHNICIEN"
}

// =============================================================================
// DEMANDE MAINTENANCE TYPE (MINIMAL)
// =============================================================================
export type DemandeMaintenance = {
  id: number
  titre: string
  description: string | null
  priorite: string
  statut: string
  dateDemande: Date
  dateEcheance: Date | null
  dateResolution: Date | null
  equipementId: number
  employeId: string | null
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// BASE EQUIPMENT TYPE
// =============================================================================
export type Equipement = {
  id: number
  nom: string
  type: string
  marque: string
  modele: string
  numeroSerie: string
  etat: EtatEquipement
  localisation: string
  adminId: string | null
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// EQUIPMENT WITH RELATIONS TYPES
// =============================================================================

// Equipement with demandes de maintenance included
export type EquipementWithDemandes = Equipement & {
  demandesMaintenance: (DemandeMaintenance & {
    employe: User | null
  })[]
  admin: User | null
}

// Equipement list item (lightweight, for listing)
export type EquipementListItem = Equipement & {
  admin: User | null
  _count: {
    demandesMaintenance: number
  }
}

// =============================================================================
// EQUIPMENT CREATE INPUT TYPE
// =============================================================================
// Used for creating new equipment. All required fields must be provided.
// =============================================================================
export type EquipementCreateInput = {
  nom: string
  type: string
  marque: string
  modele: string
  numeroSerie: string
  etat?: EtatEquipement
  localisation: string
  adminId?: string
}

// =============================================================================
// EQUIPMENT UPDATE INPUT TYPE
// =============================================================================
// Used for updating existing equipment. All fields are optional for partial updates.
// =============================================================================
export type EquipementUpdateInput = Partial<Omit<EquipementCreateInput, "numeroSerie">> & {
  numeroSerie?: string
}
