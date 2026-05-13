// =============================================================================
// PROFILE FORM - SGME
// =============================================================================
// This component provides a form for users to edit their profile.
// It includes:
// - First name and last name fields
// - Phone field (optional)
// - Profile image URL (optional)
//
// Users can only edit their own profile.
// The form uses Zod for validation and handles form submission.
// =============================================================================

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { 
  User, 
  Phone, 
  Image,
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
const profileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  image: z.string().url("URL invalide").optional().or(z.literal("")),
})

// =============================================================================
// PROFILE FORM PROPS
// =============================================================================
// Props for the ProfileForm component.
// user: The user object containing current profile data.
// =============================================================================
interface ProfileFormProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    image: string | null
  }
}

// =============================================================================
// PROFILE FORM COMPONENT
// =============================================================================
// Main form component for editing user profile.
// =============================================================================
export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Form state - controlled inputs to avoid Base UI uncontrolled component warnings
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || "",
    image: user.image || "",
  })

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  // =============================================================================
  // HANDLE FORM SUBMISSION
  // =============================================================================
  // Handles form submission and updates user profile.
  // Validates form data and sends it to the API.
  // =============================================================================
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validate form data
    const validationResult = profileSchema.safeParse(formData)
    
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      // Send request to API
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erreur lors de la mise à jour du profil")
        setIsLoading(false)
        return
      }

      setSuccess("Profil mis à jour avec succès")
      
      // Refresh the page to show updated data
      router.refresh()
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
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Entrez votre prénom"
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
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Entrez votre nom"
              required
            />
          </Field>
        </div>

        {/* Email field (read-only) */}
        <Field>
          <FieldLabel>
            <User className="w-4 h-4" />
            Email
          </FieldLabel>
          <Input
            type="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <FieldDescription>
            L'adresse email ne peut pas être modifiée
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
            value={formData.phone}
            onChange={handleChange}
            placeholder="+33 6 12 34 56 78"
          />
        </Field>

        {/* Image URL field */}
        <Field>
          <FieldLabel>
            <Image className="w-4 h-4" />
            URL de l'image de profil (optionnel)
          </FieldLabel>
          <Input
            name="image"
            type="url"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://exemple.com/image.jpg"
          />
          <FieldDescription>
            Entrez l'URL de votre image de profil
          </FieldDescription>
        </Field>
      </FieldGroup>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            "Mettre à jour le profil"
          )}
        </Button>
      </div>
    </form>
  )
}
