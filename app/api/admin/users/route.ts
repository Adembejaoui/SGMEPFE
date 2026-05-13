
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// =============================================================================
// CREATE USER VALIDATION SCHEMA
// =============================================================================

const createUserSchema = z.object({
  firstName: z
    .string()
    .min(4, "Le prénom est requis"),

  lastName: z
    .string()
    .min(4, "Le nom est requis"),

  email: z
    .string()
    .email("Adresse email invalide"),

  phone: z
    .string()
    .min(
      8,
      "Le numéro de téléphone doit contenir au moins 8 caractères"
    ),

  role: z.enum([
    "ADMIN",
    "EMPLOYE",
    "TECHNICIEN",
  ]),

  specialization: z
    .enum([
      "PRINTER",
      "NETWORK",
      "HVAC",
      "ELECTRICAL",
      "SECURITY",
    ])
    .optional()
    .nullable(),

  password: z
    .string()
    .min(
      8,
      "Le mot de passe doit contenir au moins 8 caractères"
    ),

  isActive: z.boolean(),
})

// =============================================================================
// UPDATE USER VALIDATION SCHEMA
// =============================================================================

const updateUserSchema = z
  .object({
    id: z.string().cuid(
      "ID utilisateur invalide"
    ),

    firstName: z
      .string()
      .min(
        4,
        "Le prénom est requis"
      )
      .optional(),

    lastName: z
      .string()
      .min(
        4,
        "Le nom est requis"
      )
      .optional(),

    email: z
      .string()
      .email(
        "Adresse email invalide"
      )
      .optional(),

    phone: z
      .string()
      .min(
        8,
        "Le numéro de téléphone doit contenir au moins 8 caractères"
      )
      .optional(),

    role: z
      .enum([
        "ADMIN",
        "EMPLOYE",
        "TECHNICIEN",
      ])
      .optional(),

    specialization: z
      .enum([
        "PRINTER",
        "NETWORK",
        "HVAC",
        "ELECTRICAL",
        "SECURITY",
      ])
      .optional()
      .nullable(),

    password: z
      .string()
      .min(
        8,
        "Le mot de passe doit contenir au moins 8 caractères"
      )
      .optional(),

    isActive:
      z.boolean().optional(),
  })
  .refine(
    (data) =>
      Object.keys(data)
        .length > 1,
    {
      message:
        "Au moins un champ doit être fourni pour la mise à jour",
    }
  )

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Non autorisé",
        },
        { status: 401 }
      )
    }

    if (
      session.user.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès refusé",
        },
        { status: 403 }
      )
    }

    const users =
      await prisma.user.findMany(
        {
          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            specialization:
              true,
            isActive: true,
            mustChangePassword:
              true,
            createdAt: true,
            updatedAt: true,
          },
        }
      )

    return NextResponse.json(
      users
    )
  } catch (error) {
    console.error(
      "Error fetching users:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Erreur lors de la récupération des utilisateurs",
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER
// =============================================================================

export async function POST(
  request: Request
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Non autorisé",
        },
        { status: 401 }
      )
    }

    if (
      session.user.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès refusé",
        },
        { status: 403 }
      )
    }

    const body =
      await request.json()

    const validationResult =
      createUserSchema.safeParse(
        body
      )

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            validationResult
              .error.issues[0]
              .message,
        },
        { status: 400 }
      )
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      specialization,
      password,
      isActive,
    } = validationResult.data

    // Validate technician specialization
    if (
      role === "TECHNICIEN" &&
      !specialization
    ) {
      return NextResponse.json(
        {
          error:
            "La spécialisation est obligatoire pour un technicien",
        },
        { status: 400 }
      )
    }

    // Check existing user
    const existingUser =
      await prisma.user.findUnique(
        {
          where: {
            email,
          },
        }
      )

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Un utilisateur avec cet email existe déjà",
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      )

    // Create user
    const user =
      await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          role,

          specialization:
            role ===
            "TECHNICIEN"
              ? specialization
              : null,

          password:
            hashedPassword,

          isActive,

          mustChangePassword:
            true,
        },
      })

    return NextResponse.json(
      {
        message:
          "Utilisateur créé avec succès",

        user: {
          id: user.id,
          firstName:
            user.firstName,
          lastName:
            user.lastName,
          email: user.email,
          role: user.role,
          specialization:
            user.specialization,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      "Error creating user:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Erreur lors de la création de l'utilisateur",
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT HANDLER
// =============================================================================

export async function PUT(
  request: Request
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Non autorisé",
        },
        { status: 401 }
      )
    }

    if (
      session.user.role !==
      "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Accès refusé",
        },
        { status: 403 }
      )
    }

    const body =
      await request.json()

    const validationResult =
      updateUserSchema.safeParse(
        body
      )

    if (
      !validationResult.success
    ) {
      return NextResponse.json(
        {
          error:
            "Données invalides",

          details:
            validationResult
              .error.issues,
        },
        { status: 400 }
      )
    }

    const {
      id,
      ...updateData
    } = validationResult.data

    // Check user existence
    const existingUser =
      await prisma.user.findUnique(
        {
          where: { id },
        }
      )

    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "Utilisateur non trouvé",
        },
        { status: 404 }
      )
    }

    const finalUpdateData: Record<
      string,
      unknown
    > = {
      ...updateData,
    }

    // Role logic
    if (
      updateData.role !==
      undefined
    ) {
      // TECHNICIEN requires specialization
      if (
        updateData.role ===
          "TECHNICIEN" &&
        !updateData.specialization &&
        !existingUser.specialization
      ) {
        return NextResponse.json(
          {
            error:
              "La spécialisation est requise pour un technicien",
          },
          { status: 400 }
        )
      }

      // Remove specialization for non-technicians
      if (
        updateData.role !==
        "TECHNICIEN"
      ) {
        finalUpdateData.specialization =
          null
      }
    }

    // Hash password
    if (
      finalUpdateData.password
    ) {
      finalUpdateData.password =
        await bcrypt.hash(
          finalUpdateData.password as string,
          12
        )
    }

    // Update user
    const updatedUser =
      await prisma.user.update({
        where: { id },

        data: finalUpdateData,

        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          specialization:
            true,
          isActive: true,
          mustChangePassword:
            true,
          createdAt: true,
          updatedAt: true,
        },
      })

    return NextResponse.json(
      {
        message:
          "Utilisateur mis à jour avec succès",

        user: updatedUser,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      "Error updating user:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Erreur lors de la mise à jour de l'utilisateur",
      },
      { status: 500 }
    )
  }
}
