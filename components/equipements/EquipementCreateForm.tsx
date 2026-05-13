// =============================================================================
// CREATE EQUIPMENT FORM - SGME
// =============================================================================
// This component provides a form for creating and editing equipment.
// It includes:
// - Name, type, brand, model fields
// - Serial number (required and unique)
// - State selection (AVAILABLE, UNDER_MAINTENANCE, OUT_OF_SERVICE, BROKEN)
// - Location field
// - Admin assignment field
//
// The form uses Zod for validation and handles form submission.
// =============================================================================

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import {
  Tag,
  Factory,
  Barcode,
  MapPin,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wrench,
  Ban
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EquipmentType } from "@/types/equipement"

// =============================================================================
// FORM VALIDATION SCHEMA
// =============================================================================
// Validates all form fields using Zod.
// Ensures data integrity before submission.
// =============================================================================
const equipementFormSchema = z.object({
   nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
   type: z.enum(["PRINTER", "NETWORK", "HVAC", "ELECTRICAL", "SECURITY"]),
   marque: z.string().min(2, "La marque doit contenir au moins 2 caractères"),
   modele: z.string().min(1, "Le modèle est requis"),
   numeroSerie: z.string().min(6).optional(),
   etat: z.enum(["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"], {
     message: "Veuillez sélectionner un état valide"
   }),
   localisation: z.string().min(2, "La localisation doit contenir au moins 2 caractères"),
   adminId: z.string().optional().nullable(),
})

type EquipementFormData = z.infer<typeof equipementFormSchema>

// =============================================================================
// EQUIPMENT STATUS CONFIGURATION
// =============================================================================
const etatOptions = [
  { value: "DISPONIBLE", label: "Disponible", icon: CheckCircle },
  { value: "EN_PANNE", label: "En panne", icon: AlertCircle },
  { value: "EN_MAINTENANCE", label: "En maintenance", icon: Wrench },
  { value: "HORS_SERVICE", label: "Hors service", icon: Ban },
]

// =============================================================================
// CREATE EQUIPMENT FORM COMPONENT
// =============================================================================
// Main form component for creating and editing equipment.
// =============================================================================
interface EquipementCreateFormProps {
    onSuccess?: () => void
    onCancel?: () => void
    initialData?: Partial<EquipementFormData> & { id?: number }
    users?: Array<{ id: string; firstName: string; lastName: string }>
}

// Generate a serial number: 2 digits followed by 4 uppercase letters (total 6 chars)
function generateSerialNumber(): string {
    const digits = Math.floor(10 + Math.random() * 90).toString(); // 2 digits: 10-99
    let letters = '';
    for (let i = 0; i < 4; i++) {
        letters += String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    }
    return digits + letters;
}
const serialNumber = generateSerialNumber();
export function EquipementCreateForm({ 
   onSuccess, 
   onCancel, 
   initialData,
   users = []
}: EquipementCreateFormProps) {
   const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [selectedEtat, setSelectedEtat] = useState<string>(initialData?.etat || "DISPONIBLE")
    const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(initialData?.adminId || undefined)
    const [selectedType, setSelectedType] = useState<string>(initialData?.type || "")

    // =============================================================================
    // HANDLE FORM SUBMISSION
    // =============================================================================
    // Handles form submission and creates/updates equipment.
    // Validates form data and sends it to the API.
    // =============================================================================
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsLoading(true)
      setError("")
      setSuccess("")

      const formData = new FormData(event.currentTarget)
      
        // Extract form data
        const data: EquipementFormData = {
          nom: formData.get("nom") as string,
          type: selectedType as EquipmentType, // Use the state for type
          marque: formData.get("marque") as string,
          modele: formData.get("modele") as string,
          numeroSerie:serialNumber || initialData?.numeroSerie,
          etat: selectedEtat as any,
          localisation: formData.get("localisation") as string,
          adminId: selectedAdminId || undefined,
        }

      // Validate form data
      const validationResult = equipementFormSchema.safeParse(data)
      
      if (!validationResult.success) {
        setError(validationResult.error.issues[0].message)
        setIsLoading(false)
        return
      }

      try {
        const isEditing = initialData?.id
        const url = isEditing 
          ? `/api/equipements/${initialData.id}`
          : "/api/equipements"
        const method = isEditing ? "PUT" : "POST"

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Erreur lors de l'opération")
          setIsLoading(false)
          return
        }

        setSuccess(
          isEditing 
            ? "Équipement mis à jour avec succès" 
            : "Équipement créé avec succès"
        )
        
        if (onSuccess) {
          onSuccess()
        }
        
        // Redirect to equipment list after 2 seconds
        if (!onSuccess) {
          setTimeout(() => {
            router.push("/dashboard/admin/equipment")
          }, 2000)
        }
      } catch (err) {
        setError("Une erreur est survenue. Veuillez réessayer.")
        setIsLoading(false)
      }
    }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 text-green-500 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <FieldGroup>
        {/* Basic Information */}
        <div className="space-y-4">
          <Field>
            <FieldLabel >
              <Barcode className="w-4 h-4" />
              Nom de l'equipement
            </FieldLabel>
            <Input
              name="nom"
              placeholder="Ex: Tournevis électrique"
              defaultValue={initialData?.nom}
              required
            />
          </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel >
                  <Factory className="w-4 h-4" />
                  Type
                </FieldLabel>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRINTER">Imprimantes</SelectItem>
                    <SelectItem value="NETWORK">Équipements réseau</SelectItem>
                    <SelectItem value="HVAC">Chauffage, ventilation, climatisation</SelectItem>
                    <SelectItem value="ELECTRICAL">Systèmes électriques</SelectItem>
                    <SelectItem value="SECURITY">Systèmes de sécurité</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

            <Field>
              <FieldLabel >
                <Tag className="w-4 h-4" />
                Marque
              </FieldLabel>
              <Input
                name="marque"
                placeholder="Ex: Bosch"
                defaultValue={initialData?.marque}
                required
              />
            </Field>
          </div>
            <div className="grid gap-4 md:grid-cols-2">
            <Field>
            <FieldLabel >
              <Barcode className="w-4 h-4" />
              Model
            </FieldLabel>
            <Input
              name="modele"
              placeholder="Ex: Tournevis électrique"
              defaultValue={initialData?.modele}
              required
            />
          </Field>
          </div>
        </div>

        {/* State and Location */}
        <div className="space-y-4">
          <Field>
            <FieldLabel >
              État
            </FieldLabel>
            <Select
              value={selectedEtat}
              onValueChange={setSelectedEtat}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un état" />
              </SelectTrigger>
              <SelectContent>
{etatOptions.map((option) => (
  <SelectItem key={option.value} value={option.value}>
    <div className="flex items-center gap-2">
      <option.icon className="w-4 h-4" />
      {option.label}
    </div>
  </SelectItem>
))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel >
              <MapPin className="w-4 h-4" />
              Localisation
            </FieldLabel>
            <Input
              name="localisation"
              placeholder="Ex: Atelier principal, étagère 3"
              defaultValue={initialData?.localisation}
              required
            />
            <FieldDescription>
              Emplacement précis où se trouve l'équipement
            </FieldDescription>
          </Field>
        </div>

        {/* Admin Assignment */}
        {users.length > 0 && (
          <Field>
            <FieldLabel>
              <User className="w-4 h-4" />
              Gestionnaire
            </FieldLabel>
            <Select value={selectedAdminId || ""} onValueChange={(val) => setSelectedAdminId(val || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un gestionnaire (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Personne responsable de l'équipement (optionnel)
            </FieldDescription>
          </Field>
        )}
      </FieldGroup>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => {})}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {initialData?.id ? "Mise à jour..." : "Création..."}
            </>
          ) : (
            initialData?.id ? "Mettre à jour" : "Créer l'équipement"
          )}
        </Button>
      </div>
    </form>
  )
}