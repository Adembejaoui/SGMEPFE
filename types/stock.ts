// =============================================================================
// STOCK/MATERIEL TYPES - SGME
// =============================================================================
// TypeScript type definitions for stock and material management operations.
// =============================================================================

import type { User } from "./equipement"

// =============================================================================
// PRISMA ENUM RE-EXPORTS
// =============================================================================

export type MaterielType = "PIECE_DETACHEE" | "CONSOMMABLE" | "OUTIL"
export type StatutCommande = "EN_ATTENTE" | "RECUE" | "ANNULEE"

// =============================================================================
// MATERIEL (BASE TYPE)
// =============================================================================
// Core material/item stored in stock.

export type Materiel = {
  id: number
  reference: string
  nom: string
  description: string | null
  type: MaterielType
  quantiteStock: number
  seuilAlerte: number
  unite: string
  emplacement: string | null
  prixUnitaire: number | null
  adminId: string
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// MATERIEL WITH RELATIONS
// =============================================================================

export type MaterielWithAdmin = Materiel & {
  admin: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    utilisations: number
    commandes: number
  }
}

// =============================================================================
// MATERIEL LIST ITEM
// =============================================================================

export type MaterielListItem = Materiel & {
  admin: {
    id: string
    firstName: string
    lastName: string
  }
  _count: {
    utilisations: number
    commandes: number
  }
}

// =============================================================================
// MATERIEL CREATE / UPDATE INPUT
// =============================================================================

export type MaterielCreateInput = {
  reference: string
  nom: string
  description?: string | null
  type: MaterielType
  quantiteStock?: number
  seuilAlerte?: number
  unite?: string
  emplacement?: string | null
  prixUnitaire?: number | null
  adminId: string
}

export type MaterielUpdateInput = Partial<Omit<MaterielCreateInput, "reference">> & {
  reference?: string
}

// =============================================================================
// UTILISATION MATERIEL
// =============================================================================
// Records material consumption during interventions.

export type UtilisationMateriel = {
  id: number
  materielId: number
  interventionId: number
  quantiteUtilisee: number
  motif: string | null
  createdAt: Date
}

export type UtilisationMaterielWithMateriel = UtilisationMateriel & {
  materiel: {
    id: number
    reference: string
    nom: string
    type: MaterielType
    unite: string
  }
}

// =============================================================================
// USAGE RECORD INPUT
// =============================================================================

export type UtilisationCreateInput = {
  materielId: number
  interventionId: number
  quantiteUtilisee: number
  motif?: string | null
}

// =============================================================================
// COMMANDE STOCK
// =============================================================================
// Purchase/reorder orders for materials.

export type CommandeStock = {
  id: number
  materielId: number
  quantiteCommandee: number
  fournisseur: string | null
  statut: StatutCommande
  dateCommande: Date
  dateReception: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CommandeStockWithMateriel = CommandeStock & {
  materiel: {
    id: number
    reference: string
    nom: string
    unite: string
  }
}

export type CommandeStockCreateInput = {
  materielId: number
  quantiteCommandee: number
  fournisseur?: string | null
  statut?: StatutCommande
  dateReception?: Date | null
}

// =============================================================================
// DASHBOARD / STATS
// =============================================================================

export type StockAlert = {
  materiel: Materiel
  quantiteManquante: number
  estEnAlerte: boolean
}

export type StockStats = {
  totalMateriels: number
  totalValeurStock: number
  alertes: number
  enAlerte: Materiel[]
  faibleStock: Materiel[]
  ruptureStock: Materiel[]
  commandesEnAttente: number
}
