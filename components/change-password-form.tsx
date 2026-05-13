// =============================================================================
// CHANGE PASSWORD FORM - SGME
// =============================================================================
// This component provides a form for changing user password.
// It includes:
// - New password field
// - Confirm password field
// - Password validation
//
// The form validates that passwords match and meet minimum requirements.
// After successful password change, the user is redirected to their dashboard
// using a full page reload to ensure the server reads the updated session.
// =============================================================================

"use client"

import { useState } from "react"
import { z } from "zod"
import { 
  Lock, 
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"

// =============================================================================
// FORM VALIDATION SCHEMA
// =============================================================================
// Validates all form fields using Zod.
// Ensures passwords match and meet minimum requirements.
// =============================================================================
const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

// =============================================================================
// CHANGE PASSWORD FORM COMPONENT
// =============================================================================
// Main form component for changing user password.
// Uses window.location.href for a full page reload to ensure the server
// reads the updated session after password change.
// =============================================================================
export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // =============================================================================
  // HANDLE FORM SUBMISSION
  // =============================================================================
  // Handles form submission and changes user password.
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
      newPassword: formData.get("newPassword") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    }

    // Validate form data
    const validationResult = changePasswordSchema.safeParse(data)
    
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message)
      setIsLoading(false)
      return
    }

    try {
      // Send request to API
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword: data.newPassword }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erreur lors du changement de mot de passe")
        setIsLoading(false)
        return
      }

      setSuccess("Mot de passe changé avec succès")
      
      // =============================================================================
      // REDIRECT TO DASHBOARD
      // =============================================================================
      // After successfully changing the password, force a full page reload
      // to ensure the server reads the updated session with mustChangePassword: false.
      // Using window.location.href instead of router.push() because the change-password
      // page is a Server Component that reads the session fresh on each request.
      // =============================================================================
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
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
        {/* New password field */}
        <Field>
          <FieldLabel>
            <Lock className="w-4 h-4" />
            Nouveau mot de passe
          </FieldLabel>
          <div className="relative">
            <Input
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <FieldDescription>
            Le mot de passe doit contenir au moins 8 caractères
          </FieldDescription>
        </Field>

        {/* Confirm password field */}
        <Field>
          <FieldLabel>
            <Lock className="w-4 h-4" />
            Confirmer le mot de passe
          </FieldLabel>
          <div className="relative">
            <Input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmez votre mot de passe"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <FieldDescription>
            Retapez votre mot de passe pour confirmer
          </FieldDescription>
        </Field>
      </FieldGroup>

      {/* Submit button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Changement en cours...
          </>
        ) : (
          "Changer le mot de passe"
        )}
      </Button>
    </form>
  )
}
