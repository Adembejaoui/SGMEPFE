// =============================================================================
// CHANGE PASSWORD API ROUTE - SGME
// =============================================================================
// This API route handles password changes for authenticated users.
// It provides:
// - POST: Change user password
//
// The route validates the new password and updates it in the database.
// After successful password change, mustChangePassword is set to false.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// =============================================================================
// CHANGE PASSWORD VALIDATION SCHEMA
// =============================================================================
// Validates the new password using Zod.
// Ensures password meets minimum requirements.
// =============================================================================
const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

// =============================================================================
// POST HANDLER - CHANGE PASSWORD
// =============================================================================
// Changes the user's password in the database.
// Sets mustChangePassword to false after successful change.
// =============================================================================
export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = changePasswordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { newPassword } = validationResult.data

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false, // Set to false after password change
      }
    })

    return NextResponse.json(
      { message: "Mot de passe changé avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    )
  }
}
