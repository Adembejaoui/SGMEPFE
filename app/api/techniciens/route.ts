import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    if (!["ADMIN", "TECHNICIEN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs et techniciens" },
        { status: 403 }
      )
    }

    const techniciens = await prisma.user.findMany({
      where: {
        role: "TECHNICIEN",
        isActive: true,
      },
      orderBy: {
        lastName: "asc",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
      },
    })

    return NextResponse.json(techniciens)
  } catch (error) {
    console.error("Error fetching techniciens:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des techniciens" },
      { status: 500 }
    )
  }
}
