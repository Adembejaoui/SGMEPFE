// =============================================================================
// USER DETAIL API ROUTE - SGME
// =============================================================================
// This API route handles individual user operations.
// It provides:
// - GET: Get one user by id
// - PUT: Update user
// - DELETE: Delete user
//
// Only administrators can access these routes.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// =============================================================================
// UPDATE USER VALIDATION SCHEMA
// =============================================================================
const updateUserSchema = z.object({
  firstName: z.string().min(4, "Le prA nom est requis").optional(),
  lastName: z.string().min(4, "Le nom est requis").optional(),
  email: z.string().email("Adresse email invalide").optional(),
  phone: z.string().min(8, "Le numAro de tA phon A do Ait contenir au moins 8 caractA res").optional(),
  role: z.enum(["ADMIN", "EMPLOYE", "TECHNICIEN"]).optional(),
  specialization: z.enum(["PRINTER", "NETWORK", "HVAC", "ELECTRICAL", "SECURITY"]).optional().nullable(),
  password: z.string().min(8, "Le mot de passe do Ait contenir au moins 8 caractA res").optional(),
  isActive: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit A tre fourni pour la mise A jour"
})

// =============================================================================
// GET HANDLER - GET ONE USER
// =============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisA" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "AccAs refusA" }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        specialization: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvA" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Erreur lors de la rA cupA ration de l'utilisateur" }, { status: 500 })
  }
}

// =============================================================================
// PUT HANDLER - UPDATE USER
// =============================================================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisA" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "AccAs refusA" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const validationResult = updateUserSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "DonnA es invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { ...updateData } = validationResult.data

    // Check user existence
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvA" }, { status: 404 })
    }

    const finalUpdateData = {
      ...updateData,
    }

    // Role logic
    if (updateData.role !== undefined) {
      if (updateData.role === "TECHNICIEN" && !updateData.specialization && !existingUser.specialization) {
        return NextResponse.json(
          { error: "La spAcialisation est requise pour un technicien" },
          { status: 400 }
        )
      }

      // Remove specialization for non-technicians
      if (updateData.role !== "TECHNICIEN") {
        finalUpdateData.specialization = null
      }
    }

    // Hash password
    if (finalUpdateData.password) {
      finalUpdateData.password = await bcrypt.hash(finalUpdateData.password, 12)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: finalUpdateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        specialization: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: "Utilisateur mis A jour avec succAs",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Erreur lors de la mise A jour de l'utilisateur" }, { status: 500 })
  }
}

// =============================================================================
// DELETE HANDLER - DELETE USER
// =============================================================================
// Only ADMIN can delete users. Prevents self-deletion.
// =============================================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisA" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "AccAs refusA" }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvA" }, { status: 404 })
    }

    // Clean up all related records in a transaction before deleting the user.
    // The database constraints do not enforce CASCADE, so we must handle
    // every FK relation explicitly to avoid foreign key constraint violations.
    await prisma.$transaction(async (tx) => {
      // 1. Interventions belonging to this user (as technician)
      const interventionIds = await tx.intervention
        .findMany({
          where: { technicianId: id },
          select: { idIntervention: true },
        })
        .then((rows) => rows.map((r) => r.idIntervention))

      // 2. AI chat sessions referencing this user (as technician) and/or their interventions
      await tx.aiChatSession.deleteMany({ where: { technicianId: id } })

      // 3. Messages sent by this user OR belonging to their interventions
      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: id },
            ...(interventionIds.length > 0
              ? [{ interventionId: { in: interventionIds } }]
              : []),
          ],
        },
      })

      // 4. Equipment utilisations tied to their interventions
      if (interventionIds.length > 0) {
        await tx.utilisationMateriel.deleteMany({
          where: { interventionId: { in: interventionIds } },
        })
      }

      // 5. Interventions themselves
      await tx.intervention.deleteMany({ where: { technicianId: id } })

      // 6. Demandes where this user is the assigned technician (SetNull)
      await tx.demandeMaintenance.updateMany({
        where: { technicianId: id },
        data: { technicianId: null },
      })

      // 7. Auth accounts and sessions for this user
      await tx.account.deleteMany({ where: { userId: id } })
      await tx.session.deleteMany({ where: { userId: id } })

      // 8. Finally, delete the user
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ message: "Utilisateur supprimA A vec succAs" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur" }, { status: 500 })
  }
}
