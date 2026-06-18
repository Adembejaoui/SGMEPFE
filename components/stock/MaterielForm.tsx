"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { AlertCircle, CheckCircle, Loader2, Boxes } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MaterielFormData } from "./materiel-form-data"

const materielFormSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional().nullable(),
  type: z.enum(["PIECE_DETACHEE", "CONSOMMABLE", "OUTIL"]),
  quantiteStock: z.coerce.number().int().nonnegative().optional(),
  seuilAlerte: z.coerce.number().int().nonnegative().optional(),
  unite: z.string().default("unité"),
  emplacement: z.string().optional().nullable(),
  prixUnitaire: z.coerce.number().nonnegative().optional().nullable(),
  adminId: z.string().optional(),
})

const typeOptions = [
  { value: "PIECE_DETACHEE", label: "Pièce détachée", icon: Boxes },
  { value: "CONSOMMABLE", label: "Consommable", icon: Boxes },
  { value: "OUTIL", label: "Outil", icon: Boxes },
]

interface MaterielFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<MaterielFormData> & { id?: number }
  users?: Array<{ id: string; firstName: string; lastName: string }>
}

export function MaterielForm({ onSuccess, onCancel, initialData, users = [] }: MaterielFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedType, setSelectedType] = useState<string>(initialData?.type || "")
  const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(initialData?.adminId)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(event.currentTarget)
    const data: MaterielFormData = {
      reference: formData.get("reference") as string,
      nom: formData.get("nom") as string,
      description: (formData.get("description") as string) || null,
      type: selectedType as "PIECE_DETACHEE" | "CONSOMMABLE" | "OUTIL",
      quantiteStock: formData.get("quantiteStock") ? parseInt(formData.get("quantiteStock") as string) : 0,
      seuilAlerte: formData.get("seuilAlerte") ? parseInt(formData.get("seuilAlerte") as string) : 0,
      unite: (formData.get("unite") as string) || "unité",
      emplacement: (formData.get("emplacement") as string) || null,
      prixUnitaire: formData.get("prixUnitaire") ? parseFloat(formData.get("prixUnitaire") as string) : null,
      adminId: selectedAdminId || initialData?.adminId || "",
    }

    const validationResult = materielFormSchema.safeParse(data)
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      const isEditing = initialData?.id
      const url = isEditing ? `/api/materiels/${initialData.id}` : "/api/materiels"
      const method = isEditing ? "PUT" : "POST"

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

      setSuccess(isEditing ? "Matériel mis à jour" : "Matériel créé avec succès")

      if (onSuccess) {
        onSuccess()
      } else if (!isEditing) {
        setTimeout(() => router.push("/dashboard/admin/stock"), 1500)
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
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="reference">Référence *</FieldLabel>
            <Input name="reference" placeholder="Ex: PCB-001" defaultValue={initialData?.reference} required />
            <FieldDescription>Identifiant unique du matériel</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="nom">Nom *</FieldLabel>
            <Input name="nom" placeholder="Ex: Carte mère Dell Latitude" defaultValue={initialData?.nom} required />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="type">Type *</FieldLabel>
          <Select value={selectedType} onValueChange={setSelectedType} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Input name="description" placeholder="Description optionnelle" defaultValue={initialData?.description ?? ""} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="quantiteStock">Quantité en stock</FieldLabel>
            <Input name="quantiteStock" type="number" min="0" placeholder="0" defaultValue={initialData?.quantiteStock ?? 0} />
          </Field>
          <Field>
            <FieldLabel htmlFor="seuilAlerte">Seuil d'alerte</FieldLabel>
            <Input name="seuilAlerte" type="number" min="0" placeholder="0" defaultValue={initialData?.seuilAlerte ?? 0} />
            <FieldDescription>Quantité minimale avant alerte</FieldDescription>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="unite">Unité</FieldLabel>
            <Input name="unite" placeholder="Ex: pièce, kit, litre" defaultValue={initialData?.unite ?? "unité"} />
          </Field>
          <Field>
            <FieldLabel htmlFor="emplacement">Emplacement</FieldLabel>
            <Input name="emplacement" placeholder="Ex: Atelier A, casier 3" defaultValue={initialData?.emplacement ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="prixUnitaire">Prix unitaire (DZD)</FieldLabel>
            <Input name="prixUnitaire" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={initialData?.prixUnitaire ?? ""} />
          </Field>
          {users.length > 0 && (
            <Field>
              <FieldLabel htmlFor="adminId">Gestionnaire</FieldLabel>
              <Select value={selectedAdminId} onValueChange={(val) => setSelectedAdminId(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un gestionnaire" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
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
            initialData?.id ? "Mettre à jour" : "Créer le matériel"
          )}
        </Button>
      </div>
    </form>
  )
}
