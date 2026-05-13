"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import type { DemandeListItem, StatutDemande } from "@/types/demande"
import type { EquipmentType } from "@/types/equipement"
import { PrioriteBadge } from "./badges/PrioriteBadge"
import { StatutBadge } from "./badges/StatutBadge"
import { EquipementTypeBadge } from "./badges/EquipementTypeBadge"

// =============================================================================
// ALL STATUT VALUES
// =============================================================================
const STATUT_OPTIONS: StatutDemande[] = [
  "EN_ATTENTE",
  "VALIDEE",
  "EN_COURS",
  "TRAITEE",
  "REJETEE",
  "ANNULEE",
]

// =============================================================================
// PROPS
// =============================================================================
interface DemandeAdminDrawerProps {
  open: boolean
  onClose: () => void
  demande: DemandeListItem | null
  onSuccess: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================
export function DemandeAdminDrawer({ open, onClose, demande, onSuccess }: DemandeAdminDrawerProps) {
  const [statut, setStatut] = useState<StatutDemande>(demande?.statut ?? "EN_ATTENTE")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const { data: session } = useSession()

  // Sync statut when demande changes
  if (demande && statut !== demande.statut) {
    setStatut(demande.statut)
  }

  const handleSubmit = async () => {
    if (!demande) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/demandes/${demande.idDemande}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la mise à jour")
      }

      toast.success("Demande mise à jour")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaimRequest = async () => {
    if (!demande) return

    setIsClaiming(true)
    try {
      const response = await fetch(`/api/demandes/${demande.idDemande}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la prise en charge')
      }

      toast.success('Demande prise en charge avec succès')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsClaiming(false)
    }
  }

  // Determine if the current user can claim this demande (based on specialization compatibility)
  const canClaim = session?.user?.specialization && 
                   demande?.equipement?.type === session.user.specialization &&
                   demande?.technician?.id === null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-130 sm:max-w-130 border-l">
        <SheetHeader className="pb-4">
          <SheetTitle>Modifier la demande #{demande?.idDemande}</SheetTitle>
          <SheetDescription>
            Consultez les détails et modifiez le statut de la demande
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {/* ===== READ-ONLY INFO CARDS ===== */}

          {/* Équipement */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Équipement</p>
            <p className="font-medium">{demande?.equipement.nom ?? "—"}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <EquipementTypeBadge type={demande?.equipement.type as EquipmentType} />
              <span className="text-xs text-muted-foreground">Série : {demande?.equipement.numeroSerie ?? "—"}</span>
            </div>
          </div>

          {/* Créé par */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Créé par</p>
            <p className="font-medium">
              {demande?.client.firstName} {demande?.client.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{demande?.client.email}</p>
          </div>

          {/* Date */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Date de création</p>
            <p className="font-medium">
              {demande?.dateDemande
                ? new Date(demande.dateDemande).toLocaleDateString("fr-FR")
                : "—"}
            </p>
          </div>

          {/* Description */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{demande?.description ?? "—"}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Spécialisation</p>
            <p className="text-sm whitespace-pre-wrap">{demande?.equipement?.type ?? "—"}</p>
          </div>

          {/* Priorité */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Priorité</p>
            <PrioriteBadge priorite={demande?.priorite ?? "BASSE"} />
          </div>

          {/* ===== EDITABLE SECTION ===== */}
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Statut</p>
            <Select
              value={statut}
              onValueChange={(v) => setStatut(v as StatutDemande)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SelectValue placeholder="Sélectionnez un statut" />
                )}
              </SelectTrigger>
              <SelectContent>
                {STATUT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Claim button section */}
            {session?.user && demande?.technician?.id === null && (
              <div className="pt-4">
                {!canClaim && session?.user?.specialization ? (
                  <p className="text-xs text-muted-foreground italic">
                    Spécialisation non compatible avec cet équipement
                  </p>
                ) : !session?.user?.specialization ? (
                  <p className="text-xs text-muted-foreground italic">
                    Aucune spécialisation définie pour votre compte
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClaimRequest}
                    disabled={isClaiming}
                    className="w-full"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2" />
                        Prise en charge...
                      </>
                    ) : (
                      "Prendre en charge"
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* TODO comment */}
            {/* <p className="text-xs text-muted-foreground mt-2 italic">
               // ASSIGN TECHNICIEN — wire here when Intervention module is ready
             </p> */}
          </div>
        </div>

        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Annuler
            </Button>
          </SheetClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}