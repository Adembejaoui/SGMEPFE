export type MaterielFormData = {
  reference: string
  nom: string
  description?: string | null
  type: "PIECE_DETACHEE" | "CONSOMMABLE" | "OUTIL"
  quantiteStock?: number
  seuilAlerte?: number
  unite?: string
  emplacement?: string | null
  prixUnitaire?: number | null
  adminId: string
}
