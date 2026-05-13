// =============================================================================
// ADMIN USERS API ROUTE - SGME
// =============================================================================
// This API route handles user CRUD operations for administrators.
// It provides:
// - GET: List all users
// - POST: Create a new user
//
// Only administrators can access these routes.
// The route checks the user's role before allowing access.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

// =============================================================================
// CREATE USER VALIDATION SCHEMA
// =============================================================================
// Validates user creation data using Zod.
// Ensures all required fields are present and valid.
// =============================================================================
const createUserSchema = z.object({
  firstName: z.string().min(4, "Le prénom est requis"),
  lastName: z.string().min(4, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 caractères"),
  role: z.enum(["ADMIN", "EMPLOYE", "TECHNICIEN"]),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  isActive: z.boolean().default(true),
})

// =============================================================================
// GET HANDLER - LIST ALL USERS
// =============================================================================
// Returns a list of all users in the system.
// Only administrators can access this route.
// =============================================================================
export async function GET() {
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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    // Fetch all users from database
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - CREATE NEW USER
// =============================================================================
// Creates a new user in the system.
// Only administrators can access this route.
// The new user will have mustChangePassword set to true by default.
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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = createUserSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, phone, role, password, isActive } = validationResult.data

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user in database
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role,
        password: hashedPassword,
        isActive,
        mustChangePassword: true, // Force password change on first login
      }
    })

    return NextResponse.json(
      { 
        message: "Utilisateur créé avec succès",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}
