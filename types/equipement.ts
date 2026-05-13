// =============================================================================
// EQUIPMENT TYPES - SGME
// =============================================================================
// TypeScript type definitions for equipment-related operations.
// =============================================================================

import { DemandeMaintenance } from "./demande"


// =============================================================================
// EQUIPMENT TYPE ENUM
// =============================================================================
// Defines the types of equipment for technician specialization:
// - PRINTER: Printers and printing equipment
// - NETWORK: Network equipment (routers, switches, etc.)
// - HVAC: Heating, ventilation, and air conditioning systems
// - ELECTRICAL: Electrical systems and equipment
// - SECURITY: Security systems (cameras, alarms, access control)
// =============================================================================
export type EquipmentType = 
  | "PRINTER" 
  | "NETWORK" 
  | "HVAC" 
  | "ELECTRICAL" 
  | "SECURITY"

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
  // Technician specialization (only for TECHNICIEN role)
  specialization: EquipmentType | null
}

// =============================================================================
// DEMANDE MAINTENANCE TYPE (MINIMAL)
// =============================================================================
// Matches the current Prisma DemandeMaintenance model.
// For full types, see types/demande.ts.

export type DemandeMaintenanceBase = {
  idDemande: number
  description: string
  priorite: "BASSE" | "MOYENNE" | "HAUTE" | "URGENTE"
  statut: "EN_ATTENTE" | "VALIDEE" | "EN_COURS" | "TRAITEE" | "REJETEE" | "ANNULEE"
  dateDemande: Date
  clientId: string
  equipementId: number
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// BASE EQUIPMENT TYPE
// =============================================================================
export type Equipement = {
  id: number
  nom: string
  type: EquipmentType
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
    client: User | null
  })[]
  admin: User | null
}

// Equipement list item (lightweight, for listing)
export type EquipementListItem = Equipement & {
  admin: {
    id: string
    firstName: string
    lastName: string
  } | null
  demandesMaintenance: { id: number }[]
}

// =============================================================================
// EQUIPMENT CREATE INPUT TYPE
// =============================================================================
// Used for creating new equipment. All required fields must be provided.
// =============================================================================
export type EquipementCreateInput = {
  nom: string
  type: EquipmentType
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
