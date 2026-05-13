// =============================================================================
// CREATE USER FORM - SGME
// =============================================================================
// This component provides a form for creating new users.
// It includes:
// - First name and last name fields
// - Email field with validation
// - Phone field (optional)
// - Role selection (ADMIN, EMPLOYE, TECHNICIEN)
// - Temporary password field
// - Status toggle (active/inactive)
//
// The form uses Zod for validation and handles form submission.
// =============================================================================

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

// =============================================================================
// FORM VALIDATION SCHEMA
// =============================================================================
// Validates all form fields using Zod.
// Ensures data integrity before submission.
// =============================================================================
const createUserSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYE", "TECHNICIEN"], {
    message: "Veuillez sélectionner un rôle"
  }),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  isActive: z.boolean(),
})

// =============================================================================
// CREATE USER FORM COMPONENT
// =============================================================================
// Main form component for creating new users.
// =============================================================================
export function CreateUserForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // =============================================================================
  // HANDLE FORM SUBMISSION
  // =============================================================================
  // Handles form submission and creates a new user.
  // Validates form data and sends it to the API.
  // =============================================================================
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(event.currentTarget)
    
    // Extract form data
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || undefined,
      role: formData.get("role") as string,
      password: formData.get("password") as string,
      isActive: formData.get("isActive") === "true",
    }

    // Validate form data
    const validationResult = createUserSchema.safeParse(data)
    
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      // Send request to API
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erreur lors de la création de l'utilisateur")
        setIsLoading(false)
        return
      }

      setSuccess("Utilisateur créé avec succès")
      
      // Redirect to user list after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/admin/users")
      }, 2000)
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 text-green-500 text-sm">
          {success}
        </div>
      )}

      <FieldGroup>
        {/* Name fields */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>
              <User className="w-4 h-4" />
              Prénom
            </FieldLabel>
            <Input
              name="firstName"
              placeholder="Entrez le prénom"
              required
            />
          </Field>

          <Field>
            <FieldLabel>
              <User className="w-4 h-4" />
              Nom
            </FieldLabel>
            <Input
              name="lastName"
              placeholder="Entrez le nom"
              required
            />
          </Field>
        </div>

        {/* Email field */}
        <Field>
          <FieldLabel>
            <Mail className="w-4 h-4" />
            Email
          </FieldLabel>
          <Input
            name="email"
            type="email"
            placeholder="exemple@email.com"
            required
          />
          <FieldDescription>
            L'adresse email doit être unique
          </FieldDescription>
        </Field>

        {/* Phone field */}
        <Field>
          <FieldLabel>
            <Phone className="w-4 h-4" />
            Téléphone (optionnel)
          </FieldLabel>
          <Input
            name="phone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
          />
        </Field>

        {/* Role selection */}
        <Field>
          <FieldLabel>
            <Shield className="w-4 h-4" />
            Rôle
          </FieldLabel>
          <select
            name="role"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="">Sélectionnez un rôle</option>
            <option value="EMPLOYE">Employé</option>
            <option value="TECHNICIEN">Technicien</option>
            <option value="ADMIN">Administrateur</option>
          </select>
          <FieldDescription>
            Le rôle détermine les permissions de l'utilisateur
          </FieldDescription>
        </Field>

        {/* Password field */}
        <Field>
          <FieldLabel>
            <Lock className="w-4 h-4" />
            Mot de passe temporaire
          </FieldLabel>
          <Input
            name="password"
            type="password"
            placeholder="Minimum 8 caractères"
            required
          />
          <FieldDescription>
            L'utilisateur devra changer ce mot de passe à sa première connexion
          </FieldDescription>
        </Field>

        {/* Status toggle */}
        <Field>
          <FieldLabel>
            <Shield className="w-4 h-4" />
            Statut
          </FieldLabel>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isActive"
                value="true"
                defaultChecked
                className="w-4 h-4"
              />
              <span className="text-sm">Actif</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="isActive"
                value="false"
                className="w-4 h-4"
              />
              <span className="text-sm">Inactif</span>
            </label>
          </div>
          <FieldDescription>
            Un compte inactif ne peut pas se connecter
          </FieldDescription>
        </Field>
      </FieldGroup>

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/admin/users")}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer l'utilisateur"
          )}
        </Button>
      </div>
    </form>
  )
}
