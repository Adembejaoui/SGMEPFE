"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { AlertCircle, CheckCircle, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Materiel } from "@/types/stock"

const commandeFormSchema = z.object({
  materielId: z.number().int().positive("Le matériel est requis"),
  quantiteCommandee: z.coerce.number().int().positive("La quantité doit être positive"),
  fournisseur: z.string().optional().nullable(),
  dateReception: z.coerce.date().optional().nullable(),
})

interface CommandeFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: {
    id?: number
    materielId: number
    quantiteCommandee: number
    fournisseur?: string | null
    statut?: string
    dateReception?: Date | null
  }
  materiels: Array<{
    id: number
    reference: string
    nom: string
    quantiteStock: number
    unite: string
  }>
}

export function CommandeForm({ onSuccess, onCancel, initialData, materiels = [] }: CommandeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedMaterielId, setSelectedMaterielId] = useState<string>(
    initialData?.materielId ? String(initialData.materielId) : ""
  )
  const [selectedStatut, setSelectedStatut] = useState<string>(initialData?.statut || "EN_ATTENTE")

  const [isEditing, setIsEditing] = useState(!!initialData?.id)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(event.currentTarget)
    const data = {
      materielId: parseInt(formData.get("materielId") as string, 10),
      quantiteCommandee: parseInt(formData.get("quantiteCommandee") as string, 10),
      fournisseur: (formData.get("fournisseur") as string) || null,
      dateReception: formData.get("dateReception") ? new Date(formData.get("dateReception") as string) : null,
      statut: selectedStatut,
    }

    const validationResult = commandeFormSchema.safeParse(data)
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      const editingId = initialData?.id
      const url = editingId ? `/api/commandes/${editingId}` : "/api/commandes"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erreur lors de l'opération")
        setIsLoading(false)
        return
      }

      setSuccess(isEditing ? "Commande mise à jour" : "Commande créée avec succès")

      if (onSuccess) {
        onSuccess()
      } else if (!isEditing) {
        setTimeout(() => router.push("/dashboard/admin/stock/commandes"), 1500)
      }
    } catch (err) {
      setError("Une erreur est survenue")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 text-green-500 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="materielId">Matériel *</FieldLabel>
          <Select value={selectedMaterielId} onValueChange={setSelectedMaterielId} required disabled={!!initialData}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un matériel" />
            </SelectTrigger>
            <SelectContent>
              {materiels.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.reference} — {m.nom} (Stock: {m.quantiteStock} {m.unite})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Le matériel à commander</FieldDescription>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantiteCommandee">Quantité commandée *</FieldLabel>
            <Input
              name="quantiteCommandee"
              type="number"
              min="1"
              placeholder="Ex: 10"
              defaultValue={initialData?.quantiteCommandee || ""}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="fournisseur">Fournisseur</FieldLabel>
            <Input
              name="fournisseur"
              placeholder="Ex: Fournisseur ABC"
              defaultValue={initialData?.fournisseur ?? ""}
            />
          </Field>
        </div>

        {isEditing && (
          <Field>
            <FieldLabel htmlFor="statut">Statut</FieldLabel>
            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="RECUE">Reçue</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {isEditing && (
          <Field>
            <FieldLabel htmlFor="dateReception">Date de réception</FieldLabel>
            <Input
              name="dateReception"
              type="date"
              defaultValue={
                initialData?.dateReception
                  ? new Date(initialData.dateReception).toISOString().split("T")[0]
                  : ""
              }
            />
            <FieldDescription>Laisser vide si non encore reçue</FieldDescription>
          </Field>
        )}
      </FieldGroup>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel || (() => {})} disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {initialData?.id ? "Mise à jour..." : "Création..."}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {initialData?.id ? "Mettre à jour" : "Créer la commande"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
