// =============================================================================
// INTERVENTION TYPES - SGME
// =============================================================================
// TypeScript type definitions for intervention operations.
// =============================================================================

import type { StatutIntervention, PrioriteDemande, StatutDemande } from "@/types/demande"
import type { EtatEquipement, EquipmentType } from "@/types/equipement"

// =============================================================================
// INTERVENTION BASE TYPE
// =============================================================================
export type Intervention = {
  idIntervention: number
  demandeId: number
  technicienId: string
  description: string
  statut: StatutIntervention
  observation: string | null
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// RAPPORT MAINTENANCE TYPE
// =============================================================================
export type RapportMaintenance = {
  idRapport: number
  demandeId: number
  diagnostic: string
  actionsEffectuees: string
  resultat: string
  dateCreation: Date
  dateModification: Date
}

// =============================================================================
// INTERVENTION WITH RELATIONS
// =============================================================================
export type InterventionWithRelations = Intervention & {
  demande: {
    idDemande: number
    description: string
    priorite: PrioriteDemande
    statut: StatutDemande
    dateDemande: Date
    client: {
      nom: string
      prenom: string
      email: string
    }
    equipement: {
      idEquipement: number
      nom: string
      type: EquipmentType
      marque: string
      modele: string
      numeroSerie: string
      etat: EtatEquipement
      localisation: string
    }
    technician?: {
      id: string
      nom: string
      prenom: string
      email: string
    } | null
  }
  rapportMaintenance: RapportMaintenance | null
}

// =============================================================================
// RAPPORT FORM INPUT TYPE
// =============================================================================
export type RapportFormInput = {
  observation?: string
  diagnostic: string
  actionsEffectuees: string
  resultat: RapportResultat
  statut: StatutIntervention
}

// =============================================================================
// RAPPORT RESULTAT TYPE
// =============================================================================
export type RapportResultat =
  | "Problème résolu"
  | "Partiellement résolu"
  | "Non résolu — pièce manquante"
  | "Non résolu — intervention supplémentaire requise"

// =============================================================================
// RAPPORT WITH RELATIONS TYPE
// =============================================================================
// Used for displaying report details with all associated data.
// =============================================================================
export type RapportWithRelations = RapportMaintenance & {
  demande: {
    interventions: any
    idDemande: number
    description: string
    priorite: PrioriteDemande
    
    statut: StatutDemande
    dateDemande: Date
    technicien:{
      firstname: string
      lastname: string
    }
    client: {
      nom: string
      prenom: string
      email: string
    }
     equipement: {
       idEquipement: number
       nom: string
       type: EquipmentType
       marque: string
       modele: string
       numeroSerie: string
       localisation: string
     }
   }
 }