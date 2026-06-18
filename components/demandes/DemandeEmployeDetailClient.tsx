// ROLE: EMPLOYE — Client component for demande details
// SECURITY: Displays data already verified by page

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Wrench, ClipboardList, Monitor, FileText, MessageCircle, FileDown } from "lucide-react"
import Link from "next/link"
import { PrioriteBadge } from "@/components/demandes/badges/PrioriteBadge"
import { ChatTab } from "@/components/chat/ChatTab"
import type { InterventionWithRelations } from "@/types/intervention"
import type { StatutIntervention, StatutDemande } from "@/types/demande"

interface DemandeEmployeDetailClientProps {
  demande: InterventionWithRelations
  currentUserId: string
}

const etatConfig: Record<string, string> = {
  DISPONIBLE: "bg-green-100 text-green-800",
  EN_PANNE: "bg-red-100 text-red-800",
  EN_MAINTENANCE: "bg-orange-100 text-orange-800",
  HORS_SERVICE: "bg-gray-100 text-gray-800",
}

const resultatColor: Record<string, string> = {
  "Problème résolu": "bg-green-100 text-green-800",
  "Partiellement résolu": "bg-yellow-100 text-yellow-800",
  "Non résolu — pièce manquante": "bg-orange-100 text-orange-800",
  "Non résolu — intervention supplémentaire requise": "bg-red-100 text-red-800",
}

export function DemandeEmployeDetailClient({ demande, currentUserId }: DemandeEmployeDetailClientProps) {
  const [activeTab, setActiveTab] = useState("informations")
  const hasIntervention = demande.idIntervention > 0

  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMMM yyyy HH:mm", { locale: fr })
  }

  const handleExportPDF = () => {
    window.open(`/api/demandes/${demande.demande.idDemande}/export`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/employe/demandes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Demande #{demande.demande.idDemande}
            </h1>
            <div className="text-muted-foreground">
              {demande.demande.equipement.nom} · <PrioriteBadge priorite={demande.demande.priorite} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatutDemandeBadge statut={demande.demande.statut} />
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="hidden sm:inline-flex">
              <FileDown className="w-4 h-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informations" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2" disabled={!hasIntervention}>
            <MessageCircle className="w-4 h-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="resume" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Résumé
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Détails de la demande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date de demande</p>
                  <p className="text-sm font-medium text-foreground">{formatDate(demande.demande.dateDemande)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statut</p>
                  <div className="mt-1">
                    <StatutDemandeBadge statut={demande.demande.statut} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm max-h-32 overflow-y-auto">{demande.demande.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priorité</p>
                  <div className="mt-1">
                    <PrioriteBadge priorite={demande.demande.priorite} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasIntervention && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Intervention associée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Intervention #{demande.idIntervention}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date intervention</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(demande.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statut</p>
                    <div className="mt-1">
                      <StatutInterventionBadge statut={demande.statut} />
                    </div>
                  </div>
                  {demande.observation && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observation</p>
                      <blockquote className="mt-1 text-sm border-l-4 border-muted pl-4 italic">{demande.observation}</blockquote>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className={hasIntervention ? "md:col-span-2" : "md:col-span-2"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Équipement concerné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border-l-4 ${
                    etatConfig[demande.demande.equipement.etat] || "border-gray-200"
                  }`}
                >
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Nom:</span> {demande.demande.equipement.nom}</p>
                    <p><span className="text-muted-foreground">Type:</span> {demande.demande.equipement.type}</p>
                    <p><span className="text-muted-foreground">Marque:</span> {demande.demande.equipement.marque}</p>
                    <p><span className="text-muted-foreground">Modèle:</span> {demande.demande.equipement.modele}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">N° Série:</span> {demande.demande.equipement.numeroSerie}</p>
                    <p><span className="text-muted-foreground">Localisation:</span> {demande.demande.equipement.localisation}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge className={`text-base px-4 py-2 ${etatConfig[demande.demande.equipement.etat] || ""}`}>
                      {demande.demande.equipement.etat.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {hasIntervention && (
          <>
            <TabsContent value="discussion" className="space-y-6">
              <ChatTab
                interventionId={demande.idIntervention}
                currentUserId={currentUserId}
                statut={demande.statut}
              />
            </TabsContent>

            <TabsContent value="resume" className="space-y-6">
              {!demande.rapportMaintenance ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucun rapport soumis</p>
                  <p className="text-muted-foreground mb-4">Le technicien n&apos;a pas encore soumis de rapport.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                    <div className="relative flex items-start gap-4 pb-8">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                        <span className="text-primary-foreground text-xs">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Demande créée</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(demande.demande.dateDemande)} · par {demande.demande.client.prenom} {demande.demande.client.nom}
                        </p>
                      </div>
                    </div>

                    {demande.statut !== "ANNULEE" && (
                      <div className="relative flex items-start gap-4 pb-8">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                          <span className="text-primary-foreground text-xs">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Intervention planifiée</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(demande.createdAt)} · {demande.description || "Intervention"}
                          </p>
                        </div>
                      </div>
                    )}

                    {demande.rapportMaintenance && (
                      <div className="relative flex items-start gap-4 pb-8">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                          <span className="text-primary-foreground text-xs">3</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <p className="font-medium">Rapport soumis</p>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Diagnostic</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{demande.rapportMaintenance.diagnostic}</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Actions effectuées</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{demande.rapportMaintenance.actionsEffectuees}</p>
                            </CardContent>
                          </Card>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Résultat</p>
                            <Badge className={resultatColor[demande.rapportMaintenance.resultat as string]}>
                              {demande.rapportMaintenance.resultat}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {demande.statut === "TERMINEE" && (
                      <div className="relative flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center relative z-10">
                          <span className="text-white text-xs">4</span>
                        </div>
                        <div>
                          <p className="font-medium">Clôture</p>
                          <p className="text-sm text-muted-foreground">Demande marquée comme TRAITÉE</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </>
        )}

        {!hasIntervention && (
          <TabsContent value="resume" className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune intervention</p>
              <p className="text-muted-foreground mb-4">Un technicien n&apos;a pas encore pris en charge votre demande.</p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <style jsx global>{`
        @media print {
          [data-radix-tabs-content] > div:not(.space-y-6) {
            display: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function StatutDemandeBadge({ statut }: { statut: StatutDemande }) {
  const config: Record<StatutDemande, { label: string; className: string }> = {
    EN_ATTENTE: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
    VALIDEE: { label: "Validée", className: "bg-blue-100 text-blue-800" },
    EN_COURS: { label: "En cours", className: "bg-purple-100 text-purple-800" },
    TRAITEE: { label: "Traitée", className: "bg-green-100 text-green-800" },
    REJETEE: { label: "Rejetée", className: "bg-red-100 text-red-800" },
    ANNULEE: { label: "Annulée", className: "bg-gray-100 text-gray-800" },
  }
  return (
    <Badge className={config[statut].className}>
      {config[statut].label}
    </Badge>
  )
}

function StatutInterventionBadge({ statut }: { statut: StatutIntervention }) {
  const config: Record<string, string> = {
    OUVERTE: "bg-yellow-100 text-yellow-800",
    EN_COURS: "bg-purple-100 text-purple-800",
    TERMINEE: "bg-green-100 text-green-800",
    ANNULEE: "bg-red-100 text-red-800",
  }
  return (
    <Badge className={config[statut]}>
      {statut.replace("_", " ")}
    </Badge>
  )
}