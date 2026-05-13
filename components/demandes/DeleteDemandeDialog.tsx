"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

// =============================================================================
// PROPS
// =============================================================================
interface DeleteDemandeDialogProps {
  open: boolean
  onClose: () => void
  demandeId: number | null
  onSuccess: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================
export function DeleteDemandeDialog({ open, onClose, demandeId, onSuccess }: DeleteDemandeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (demandeId === null) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/demandes/${demandeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la suppression")
      }

      toast.success("Demande supprimée")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la demande</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Les interventions liées seront aussi supprimées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Confirmer la suppression
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}