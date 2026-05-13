// =============================================================================
// DEMANDE MAINTENANCE TYPES - SGME
// =============================================================================
// TypeScript type definitions for maintenance request operations.
// =============================================================================

// =============================================================================
// PRISMA ENUM RE-EXPORTS
// =============================================================================

/**
 * Priority levels for maintenance requests.
 * Maps directly to the Prisma `PrioriteDemande` enum.
 */
export type PrioriteDemande = "BASSE" | "MOYENNE" | "HAUTE" | "URGENTE"

/**
 * Lifecycle statuses for maintenance requests.
 * Maps directly to the Prisma `StatutDemande` enum.
 */
export type StatutDemande = "EN_ATTENTE" | "VALIDEE" | "EN_COURS" | "TRAITEE" | "REJETEE" | "ANNULEE"

// =============================================================================
// DEMANDE MAINTENANCE (BASE TYPE)
// =============================================================================
// Mirrors the Prisma `DemandeMaintenance` model fields.

export type DemandeMaintenance = {
  idDemande: number
  dateDemande: Date
  description: string
  priorite: PrioriteDemande
  statut: StatutDemande
  clientId: string
  equipementId: number
  // Technician who claimed this request (null if unclaimed)
  technicianId: string | null
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// DEMANDE CREATE INPUT
// =============================================================================
// Used when creating a new maintenance request.
// `clientId` is derived from the session; `statut` defaults to EN_ATTENTE.
// `technicianId` is set when a technician claims the request.

export type DemandeCreateInput = {
  /** Free-text description of the maintenance issue */
  description: string
  /** Priority level of the request */
  priorite: PrioriteDemande
  /** Foreign key to the equipment requiring maintenance */
  equipementId: number
}

// =============================================================================
// DEMANDE UPDATE INPUT
// =============================================================================
// Used for partial updates to an existing maintenance request.
// All fields are optional so callers can update only what changed.

export type DemandeUpdateInput = Partial<{
  /** Updated free-text description */
  description: string
  /** Updated priority level */
  priorite: PrioriteDemande
  /** Updated status */
  statut: StatutDemande
  /** Updated equipment reference */
  equipementId: number
  /** Updated technician assignment */
  technicianId: string | null
}>

// =============================================================================
// DEMANDE LIST ITEM
// =============================================================================
// Lightweight type returned by list endpoints.
// Includes the request itself, a subset of client info, a subset of
// equipment info, technician info (if claimed), and an intervention count.

export type DemandeListItem = {
  idDemande: number
  description: string
  priorite: PrioriteDemande
  statut: StatutDemande
  dateDemande: Date

  /** Basic client info (id, name, email) */
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }

  /** Basic equipment info (id, name, type, numeroSerie) */
  equipement: {
    id: number
    nom: string
    type: string
    numeroSerie: string
  }

  /** Technician info (if claimed) */
  technician: {
    id: string
    firstName: string
    lastName: string
  } | null | null

  /** Aggregated counts */
  _count: {
    interventions: number
  }
}

// =============================================================================
// DEMANDE WITH RELATIONS
// =============================================================================
// Full `DemandeMaintenance` enriched with nested Prisma relations:
//   - client  → User (id, firstName, lastName, email, role)
//   - equipement → Equipement (id, nom, type, numeroSerie)
//   - technician → User (id, firstName, lastName, email, role)
//   - interventions → Intervention[]

export type DemandeWithRelations = DemandeMaintenance & {
  /** The user who created the request */
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: "ADMIN" | "EMPLOYE" | "TECHNICIEN"
  }

  /** The equipment the request concerns */
  equipement: {
    id: number
    nom: string
    type: string
    numeroSerie: string
  }

  /** The technician who claimed the request (if any) */
  technician: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: "ADMIN" | "EMPLOYE" | "TECHNICIEN"
  } | null

  /** All interventions linked to this request */
  interventions: Intervention[]
}

// =============================================================================
// INTERVENTION (REFERENCE TYPE)
// =============================================================================
// Minimal type used inside `DemandeWithRelations`. Mirrors the Prisma
// `Intervention` model.

export type Intervention = {
  idIntervention: number
  demandeId: number
  description: string
  statut: StatutIntervention
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// STATUT INTERVENTION ENUM
// =============================================================================
// Lifecycle statuses for interventions.

export type StatutIntervention = "OUVERTE" | "EN_COURS" | "TERMINEE" | "ANNULEE"

// =============================================================================
// INTERVENTION WITH RELATIONS
// =============================================================================
// Full `Intervention` enriched with nested Prisma relations:
//   - demande → DemandeMaintenance (with equipement & client info)

export type InterventionWithRelations = Intervention & {
  demande: {
    idDemande: number
    description: string
    priorite: PrioriteDemande
    statut: StatutDemande
    equipement: {
      id: number
      nom: string
      type: string
      numeroSerie: string
    }
    client: {
      id: string
      firstName: string
      lastName: string
    }
  }
}