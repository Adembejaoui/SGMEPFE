// ROLE: TECHNICIEN — Client component for intervention details with tabs
// SECURITY: Displays data already verified by API route

"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Wrench, ClipboardList, Monitor, AlertTriangle, FileText, Printer, Plus, Boxes as BoxesIcon, PackageX, MessageCircle, Brain, Calendar, User, Hash, Flag } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import type { InterventionWithRelations, RapportFormInput, RapportResultat } from "@/types/intervention"
import type { UtilisationMaterielWithMateriel } from "@/types/stock"
import { PrioriteBadge } from "@/components/demandes/badges/PrioriteBadge"
import { InfoRow } from "@/components/ui/info-row"
import { ChatTab } from "@/components/chat/ChatTab"
import { AiChatTab } from "@/components/chat/AiChatTab"
import type { StatutIntervention, StatutDemande } from "@/types/demande"

const rapportSchema = z.object({
  observation: z.string().optional(),
  diagnostic: z.string().min(10, 'Le diagnostic doit contenir au moins 10 caractères'),
  actionsEffectuees: z.string().min(10, 'Les actions doivent contenir au moins 10 caractères'),
  resultat: z.enum([
    'Problème résolu',
    'Partiellement résolu',
    'Non résolu — pièce manquante',
    'Non résolu — intervention supplémentaire requise',
  ]),
  statut: z.enum(['OUVERTE', 'EN_COURS', 'TERMINEE', 'ANNULEE']),
})

interface InterventionDetailClientProps {
  intervention: InterventionWithRelations
  technicienNom: string
  currentUserId: string
}

const etatConfig: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-800',
  EN_PANNE: 'bg-red-100 text-red-800',
  EN_MAINTENANCE: 'bg-orange-100 text-orange-800',
  HORS_SERVICE: 'bg-gray-100 text-gray-800',
}

const resultatColor: Record<RapportResultat, string> = {
  'Problème résolu': 'bg-green-100 text-green-800',
  'Partiellement résolu': 'bg-yellow-100 text-yellow-800',
  'Non résolu — pièce manquante': 'bg-orange-100 text-orange-800',
  'Non résolu — intervention supplémentaire requise': 'bg-red-100 text-red-800',
}

export function InterventionDetailClient({ intervention, technicienNom, currentUserId }: InterventionDetailClientProps) {
  const [activeTab, setActiveTab] = useState('informations')
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [usages, setUsages] = useState<UtilisationMaterielWithMateriel[]>([])
  const [usagesLoading, setUsagesLoading] = useState(false)
  const [showUsageForm, setShowUsageForm] = useState(false)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [usageSuccess, setUsageSuccess] = useState<string | null>(null)
  const [materielOptions, setMaterielOptions] = useState<Array<{ id: number; reference: string; nom: string; quantiteStock: number; unite: string }>>([])

  const rapportExists = !!intervention.rapportMaintenance
  const isEdit = rapportExists

  const form = useForm({
    resolver: zodResolver(rapportSchema),
    defaultValues: {
      observation: intervention.observation || '',
      diagnostic: intervention.rapportMaintenance?.diagnostic || '',
      actionsEffectuees: intervention.rapportMaintenance?.actionsEffectuees || '',
      resultat: (intervention.rapportMaintenance?.resultat as RapportResultat) || 'Problème résolu',
      statut: intervention.statut,
    },
  })

  const usageForm = useForm({
    defaultValues: {
      materielId: 0,
      quantiteUtilisee: 1,
      motif: '',
    },
  })

  const fetchUsages = async () => {
    setUsagesLoading(true)
    try {
      const res = await fetch(`/api/interventions/${intervention.idIntervention}/materiels`)
      if (res.ok) {
        const data = await res.json()
        setUsages(data)
      }
    } catch {
      // silent
    } finally {
      setUsagesLoading(false)
    }
  }

  const fetchMateriels = async () => {
    try {
      const res = await fetch('/api/materiels?limit=100')
      if (res.ok) {
        const data = await res.json()
        setMaterielOptions((data.data || []).map((m: { id: number; reference: string; nom: string; quantiteStock: number; unite: string }) => ({
          id: m.id,
          reference: m.reference,
          nom: m.nom,
          quantiteStock: m.quantiteStock,
          unite: m.unite,
        })))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchUsages()
    fetchMateriels()
  }, [intervention.idIntervention])

  const onSubmit = async (data: RapportFormInput) => {
    setIsSaving(true)
    setApiError(null)

    try {
      const response = await fetch(`/api/interventions/${intervention.idIntervention}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observation: data.observation,
          statut: data.statut as StatutIntervention,
          rapport: {
            diagnostic: data.diagnostic,
            actionsEffectuees: data.actionsEffectuees,
            resultat: data.resultat,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de l'enregistrement")
      }

      toast.success('Rapport enregistré')
      setActiveTab('resume')
    } catch (error: any) {
      setApiError(error.message || 'Une erreur est survenue')
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const onUsageSubmit = async (data: { materielId: number; quantiteUtilisee: number; motif?: string }) => {
    setUsageError(null)
    setUsageSuccess(null)
    setShowUsageForm(false)

    try {
      const res = await fetch(`/api/interventions/${intervention.idIntervention}/materiels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materielId: data.materielId,
          quantiteUtilisee: data.quantiteUtilisee,
          motif: data.motif || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }))
        throw new Error(err.error || err.details?.[0]?.message || "Erreur lors de l'enregistrement")
      }

      setUsageSuccess('Matériel enregistré')
      setShowUsageForm(false)
      usageForm.reset()
      fetchUsages()
      fetchMateriels()
    } catch (err: any) {
      setUsageError(err.message || 'Une erreur est survenue')
      setShowUsageForm(true)
    }
  }

  const onDeleteUsage = async (materielId: number, quantiteUtilisee: number) => {
    if (!confirm('Supprimer cette utilisation ? Le stock sera restauré.')) return

    try {
      const res = await fetch(`/api/interventions/${intervention.idIntervention}/materiels`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materielId, quantiteUtilisee }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }))
        throw new Error(err.error || "Erreur lors de la suppression")
      }

      toast.success('Utilisation supprimée')
      fetchUsages()
      fetchMateriels()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = () => {
    window.open(`/api/interventions/${intervention.idIntervention}/export`, "_blank")
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
  }

  const dateIntervention = intervention.demande?.dateDemande || intervention.createdAt

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/technicien/interventions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              Intervention #{intervention.idIntervention}
            </h1>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">{intervention.demande.equipement.nom}</span>
            <PrioriteBadge priorite={intervention.demande.priorite} />
            <StatutInterventionBadge statut={intervention.statut} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="informations" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <BoxesIcon className="w-4 h-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="rapport" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Rapport de panne
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="ia-diagnostic" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Assistant IA
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Informations */}
        <TabsContent value="informations" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Détails de l'intervention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Détails de l'intervention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Type d'intervention" value={intervention.description || 'Intervention'} icon={Wrench} />
                <InfoRow label="Date intervention" value={formatDate(dateIntervention)} icon={Calendar} />
                <InfoRow label="Statut" value={<StatutInterventionBadge statut={intervention.statut} />} icon={Flag} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observation</p>
                  {intervention.observation ? (
                    <blockquote className="mt-1 text-sm border-l-4 border-muted pl-4 italic">
                      {intervention.observation}
                    </blockquote>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">Aucune observation</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demande associée */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Demande associée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Demande" value={`#${intervention.demande.idDemande}`} icon={Hash} />
                <InfoRow label="Date de demande" value={formatDate(intervention.demande.dateDemande)} icon={Calendar} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm max-h-32 overflow-y-auto">{intervention.demande.description}</p>
                </div>
                <InfoRow label="Priorité" value={<PrioriteBadge priorite={intervention.demande.priorite} />} icon={AlertTriangle} />
                <InfoRow label="Statut demande" value={<StatutDemandeBadge statut={intervention.demande.statut} />} icon={Flag} />
                <InfoRow label="Créé par" value={`${intervention.demande.client.prenom} ${intervention.demande.client.nom}`} icon={User} />
              </CardContent>
            </Card>

            {/* Équipement concerné - full width */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Équipement concerné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border-l-4 ${
                    etatConfig[intervention.demande.equipement.etat] || 'border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">Nom:</span> {intervention.demande.equipement.nom}</p>
                    <p><span className="text-muted-foreground">Type:</span> {intervention.demande.equipement.type}</p>
                    <p><span className="text-muted-foreground">Marque:</span> {intervention.demande.equipement.marque}</p>
                    <p><span className="text-muted-foreground">Modèle:</span> {intervention.demande.equipement.modele}</p>
                  </div>
                  <div className="space-y-2">
                    <p><span className="text-muted-foreground">N° Série:</span> {intervention.demande.equipement.numeroSerie}</p>
                    <p><span className="text-muted-foreground">Localisation:</span> {intervention.demande.equipement.localisation}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Badge className={`text-base px-4 py-2 ${etatConfig[intervention.demande.equipement.etat] || ''}`}>
                      {intervention.demande.equipement.etat.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Stock / Consommables */}
        <TabsContent value="stock" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Matériels utilisés</h3>
                <p className="text-sm text-muted-foreground">
                  Consommation de pièces et consommables pour cette intervention
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowUsageForm(!showUsageForm)}
                disabled={materielOptions.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {showUsageForm && materielOptions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Enregistrer une utilisation</CardTitle>
                </CardHeader>
                <CardContent>
                  {usageError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{usageError}</AlertDescription>
                    </Alert>
                  )}
                  {usageSuccess && (
                    <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                      <AlertDescription>{usageSuccess}</AlertDescription>
                    </Alert>
                  )}
                  <form onSubmit={usageForm.handleSubmit(onUsageSubmit)} className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Matériel</label>
                      <Select onValueChange={(v) => usageForm.setValue('materielId', parseInt(v))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionnez un matériel" />
                        </SelectTrigger>
                        <SelectContent>
                          {materielOptions.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.reference} — {m.nom} (stock: {m.quantiteStock})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Quantité utilisée</label>
                      <Input type="number" min={1} defaultValue={1} {...usageForm.register('quantiteUtilisee', { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Motif / notes</label>
                      <Input {...usageForm.register('motif')} placeholder="Optionnel" />
                    </div>
                    <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                      <Button type="button" variant="outline" onClick={() => setShowUsageForm(false)}>Annuler</Button>
                      <Button type="submit" disabled={usageForm.watch('materielId') === 0}>Enregistrer</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {materielOptions.length === 0 && (
              <Alert>
                <PackageX className="h-4 w-4" />
                <AlertDescription>
                  Aucun matériel disponible dans le stock. Veuillez d'abord créer des entrées dans la gestion du stock.
                </AlertDescription>
              </Alert>
            )}

            {usagesLoading ? (
              <div className="text-sm text-muted-foreground">Chargement des consommations...</div>
            ) : usages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BoxesIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun matériel consommé pour cette intervention</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium">Référence</th>
                      <th className="text-left py-3 px-4 font-medium">Nom</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-right">Qté utilisée</th>
                      <th className="text-left py-3 px-4 font-medium">Motif</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usages.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-sm">{u.materiel.reference}</td>
                        <td className="py-3 px-4 font-medium">{u.materiel.nom}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{u.materiel.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">{u.quantiteUtilisee} {u.materiel.unite}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{u.motif || "—"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(u.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDeleteUsage(u.materielId, u.quantiteUtilisee)}
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Rapport de panne */}
        <TabsContent value="rapport" className="space-y-6">
          {rapportExists && (
            <p className="text-sm text-muted-foreground">
              Dernière modification: {format(new Date(intervention.rapportMaintenance!.dateModification), 'dd MMMM yyyy HH:mm', { locale: fr })}
            </p>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {apiError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Observation de l'intervention
              </label>
              <Textarea
                rows={3}
                placeholder="Notez vos observations sur place..."
                {...form.register('observation')}
                defaultValue={intervention.observation || ''}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Diagnostic *
              </label>
              <Textarea
                rows={4}
                placeholder="Décrivez la cause du problème identifié..."
                {...form.register('diagnostic')}
              />
              {form.formState.errors.diagnostic && (
                <p className="text-sm text-destructive">{form.formState.errors.diagnostic.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions effectuées *
              </label>
              <Textarea
                rows={4}
                placeholder="Listez les actions réalisées..."
                {...form.register('actionsEffectuees')}
              />
              {form.formState.errors.actionsEffectuees && (
                <p className="text-sm text-destructive">{form.formState.errors.actionsEffectuees.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Résultat *
              </label>
              <Select
                onValueChange={(v) => form.setValue('resultat', v as RapportResultat)}
                defaultValue={form.getValues('resultat')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Problème résolu">Problème résolu</SelectItem>
                  <SelectItem value="Partiellement résolu">Partiellement résolu</SelectItem>
                  <SelectItem value="Non résolu — pièce manquante">Non résolu — pièce manquante</SelectItem>
                  <SelectItem value="Non résolu — intervention supplémentaire requise">Non résolu — intervention supplémentaire requise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Statut de l'intervention
              </label>
              <Select
                onValueChange={(v) => form.setValue('statut', v as StatutIntervention)}
                defaultValue={form.getValues('statut')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUVERTE">Ouverte</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TERMINEE">Terminée</SelectItem>
                  <SelectItem value="ANNULEE">Annulée</SelectItem>
                </SelectContent>
              </Select>
              {form.watch('statut') === 'TERMINEE' && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    En passant à TERMINÉE, la demande sera automatiquement marquée comme TRAITÉE.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Enregistrer le rapport'}
            </Button>
          </form>
        </TabsContent>

        {/* Tab 4: Discussion */}
        <TabsContent value="discussion" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col space-y-6">
          <ChatTab
            interventionId={intervention.idIntervention}
            currentUserId={currentUserId}
            statut={intervention.statut}
          />
        </TabsContent>

        {/* Tab 5: AI Diagnostic Assistant */}
        <TabsContent value="ia-diagnostic" className="flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col space-y-6">
          <p className="text-sm text-muted-foreground mb-2">
            L'assistant IA analyse votre intervention et vous guide vers la cause probable et les actions à mener.
          </p>
          <AiChatTab
            interventionId={intervention.idIntervention}
            technicianId={currentUserId}
          />
        </TabsContent>

        {/* Tab 6: Résumé */}
        <TabsContent value="resume" className="space-y-6">
          {!rapportExists ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun rapport soumis</p>
              <p className="text-muted-foreground mb-4">Remplissez l'onglet Rapport de panne.</p>
              <Button onClick={() => setActiveTab('rapport')}>
                Rédiger le rapport →
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {/* Demande créée */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Demande créée</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(intervention.demande.dateDemande)} · par {intervention.demande.client.prenom} {intervention.demande.client.nom}
                    </p>
                  </div>
                </div>

                {/* Intervention planifiée */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Intervention planifiée</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(dateIntervention)} · {intervention.description || 'Intervention'}
                    </p>
                  </div>
                </div>

                {/* Stock summary */}
                {usages.length > 0 && (
                  <div className="relative flex items-start gap-4 pb-8">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                      <span className="text-primary-foreground text-xs">2.5</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">Consommation de stock</p>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            {usages.map((u) => (
                              <div key={u.id} className="flex justify-between text-sm">
                                <span>{u.materiel.nom} ({u.materiel.reference})</span>
                                <span className="font-medium">{u.quantiteUtilisee} {u.materiel.unite}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Rapport soumis */}
                <div className="relative flex items-start gap-4 pb-8">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <span className="text-primary-foreground text-xs">{usages.length > 0 ? 4 : 3}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="font-medium">Rapport soumis</p>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Diagnostic</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{intervention.rapportMaintenance!.diagnostic}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Actions effectuées</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{intervention.rapportMaintenance!.actionsEffectuees}</p>
                      </CardContent>
                    </Card>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Résultat</p>
                      <Badge className={resultatColor[intervention.rapportMaintenance!.resultat as RapportResultat]}>
                        {intervention.rapportMaintenance!.resultat}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Clôture */}
                {intervention.statut === 'TERMINEE' && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center relative z-10">
                      <span className="text-white text-xs">{usages.length > 0 ? 5 : 4}</span>
                    </div>
                    <div>
                      <p className="font-medium">Clôture</p>
                      <p className="text-sm text-muted-foreground">Demande marquée comme TRAITÉE</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Print button */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrint} className="flex-1 md:w-auto">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button variant="outline" onClick={handleExportPDF} className="flex-1 md:w-auto">
                  <FileText className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Print styles */}
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

// =============================================================================
// STATUT BADGE FOR INTERVENTION
// =============================================================================
function StatutInterventionBadge({ statut }: { statut: StatutIntervention }) {
  const config: Record<StatutIntervention, string> = {
    OUVERTE: 'bg-yellow-100 text-yellow-800',
    EN_COURS: 'bg-purple-100 text-purple-800',
    TERMINEE: 'bg-green-100 text-green-800',
    ANNULEE: 'bg-red-100 text-red-800',
  }
  return (
    <Badge className={config[statut]}>
      {statut.replace('_', ' ')}
    </Badge>
  )
}

function StatutDemandeBadge({ statut }: { statut: StatutDemande }) {
  const config: Record<StatutDemande, { label: string; className: string }> = {
    EN_ATTENTE: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
    VALIDEE: { label: 'Validée', className: 'bg-blue-100 text-blue-800' },
    EN_COURS: { label: 'En cours', className: 'bg-purple-100 text-purple-800' },
    TRAITEE: { label: 'Traitée', className: 'bg-green-100 text-green-800' },
    REJETEE: { label: 'Rejetée', className: 'bg-red-100 text-red-800' },
    ANNULEE: { label: 'Annulée', className: 'bg-gray-100 text-gray-800' },
  }
  return (
    <Badge className={config[statut].className}>
      {config[statut].label}
    </Badge>
  )
}
