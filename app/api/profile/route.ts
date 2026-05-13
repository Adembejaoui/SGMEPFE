// =============================================================================
// PROFILE API ROUTE - SGME
// =============================================================================
// This API route handles profile updates for authenticated users.
// It provides:
// - PUT: Update user profile
//
// The route validates the new profile data and updates it in the database.
// Users can only update their own profile.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// =============================================================================
// PROFILE UPDATE VALIDATION SCHEMA
// =============================================================================
// Validates the profile update data using Zod.
// Ensures data integrity before updating.
// =============================================================================
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  image: z.string().url("URL invalide").optional().or(z.literal("")),
})

// =============================================================================
// PUT HANDLER - UPDATE PROFILE
// =============================================================================
// Updates the user's profile in the database.
// Users can only update their own profile.
// =============================================================================
export async function PUT(request: Request) {
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
    const validationResult = updateProfileSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { firstName, lastName, phone, image } = validationResult.data

    // Update user profile in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone: phone || undefined,
        image: image || undefined,
      }
    })

    return NextResponse.json(
      { message: "Profil mis à jour avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    )
  }
}
