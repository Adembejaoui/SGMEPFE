// =============================================================================
// RAPPORTS API ROUTE - SGME
// =============================================================================
// This API route handles maintenance reports (rapports) for technicians and admins.
// It provides:
// - GET: List reports with optional filters
//   * TECHNICIEN role: reports for their own interventions only
//   * ADMIN role: all reports on the system, with optional technician filter
// Query params:
// - search: search in diagnostic, actions, or equipment name
// - technicianId: filter by technician (admin only)
// - priorite: filter by priority (BASSE, MOYENNE, HAUTE, URGENTE)
// - page: page number (default: 1)
// - limit: items per page (default: 10)
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { PrioriteDemande, StatutDemande } from "@/types/demande"

const VALID_PRIORITES: PrioriteDemande[] = ["BASSE", "MOYENNE", "HAUTE", "URGENTE"]

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (!["TECHNICIEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès réservé" }, { status: 403 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const technicianId = url.searchParams.get("technicianId") || undefined
    const priorite = url.searchParams.get("priorite") as PrioriteDemande | undefined
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)))
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    if (session.user.role === "TECHNICIEN") {
      // Technicians see only their own
      whereClause.demande = { technicianId: session.user.id }
    } else if (session.user.role === "ADMIN") {
      // Admin can optionally filter by technicianId
      if (technicianId) {
        whereClause.demande = { technicianId }
      }
    }

    // Search
    if (search.trim()) {
      whereClause.OR = [
        { diagnostic: { contains: search, mode: 'insensitive' } },
        { actionsEffectuees: { contains: search, mode: 'insensitive' } },
        { demande: { equipement: { nom: { contains: search, mode: 'insensitive' } } } },
        { demande: { description: { contains: search, mode: 'insensitive' } } },
        { demande: { client: { firstName: { contains: search, mode: 'insensitive' } } } },
        { demande: { client: { lastName: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Priority filter
    if (priorite && VALID_PRIORITES.includes(priorite)) {
      whereClause.demande = whereClause.demande || {}
      whereClause.demande.priorite = priorite
    }

    // Fetch rapports
    const rapports = await prisma.rapportMaintenance.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { dateModification: "desc" },
      include: {
        demande: {
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            equipement: {
              select: {
                id: true, nom: true, type: true, marque: true,
                modele: true, numeroSerie: true, localisation: true,
              },
            },
            interventions: {
              take: 1,
              orderBy: { createdAt: "desc" },
            },
            technician: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    })

    const total = await prisma.rapportMaintenance.count({ where: whereClause })
    const totalPages = Math.ceil(total / limit)

    const data = rapports.map((rapport) => ({
      idRapport: rapport.idRapport,
      demandeId: rapport.demandeId,
      diagnostic: rapport.diagnostic,
      actionsEffectuees: rapport.actionsEffectuees,
      resultat: rapport.resultat,
      dateCreation: rapport.dateCreation,
      dateModification: rapport.dateModification,
      demande: {
        idDemande: rapport.demande.idDemande,
        description: rapport.demande.description,
        priorite: rapport.demande.priorite,
        statut: rapport.demande.statut,
        dateDemande: rapport.demande.dateDemande,
        client: {
          id: rapport.demande.client.id,
          nom: rapport.demande.client.lastName,
          prenom: rapport.demande.client.firstName,
          email: rapport.demande.client.email,
        },
        technician: rapport.demande.technician ? {
          id: rapport.demande.technician.id,
          nom: rapport.demande.technician.lastName,
          prenom: rapport.demande.technician.firstName,
          email: rapport.demande.technician.email,
        } : null,
        equipement: {
          idEquipement: rapport.demande.equipement.id,
          nom: rapport.demande.equipement.nom,
          type: rapport.demande.equipement.type,
          marque: rapport.demande.equipement.marque,
          modele: rapport.demande.equipement.modele,
          numeroSerie: rapport.demande.equipement.numeroSerie,
          localisation: rapport.demande.equipement.localisation,
        },
        interventions: (rapport.demande.interventions || []).map(i => ({
          idIntervention: i.idIntervention,
          description: i.description,
          statut: i.statut,
        })),
      },
    }))

    return NextResponse.json({
      data,
      pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    })
  } catch (error) {
    console.error("Error fetching rapports:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des rapports" }, { status: 500 })
  }
}
