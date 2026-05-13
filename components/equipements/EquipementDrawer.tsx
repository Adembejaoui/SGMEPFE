"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EquipementWithDemandes } from "@/types/equipement"
import type { EtatEquipement } from "@/types/equipement"

const etatOptions: { value: EtatEquipement; label: string }[] = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_PANNE", label: "En Panne" },
  { value: "EN_MAINTENANCE", label: "En Maintenance" },
  { value: "HORS_SERVICE", label: "Hors Service" },
]

const equipementFormSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  type: z.string().min(2, { message: "Le type doit contenir au moins 2 caractères" }),
  marque: z.string().optional(),
  modele: z.string().optional(),
  numeroSerie: z.string().min(3, { message: "Le numéro de série doit contenir au moins 3 caractères" }),
  etat: z.enum(["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"]),
  localisation: z.string().optional(),
})

type EquipementFormValues = z.infer<typeof equipementFormSchema>

interface EquipementDrawerProps {
  open: boolean
  onClose: () => void
  equipement?: EquipementWithDemandes | null
  onSuccess: () => void
}

export function EquipementDrawer({
  open,
  onClose,
  equipement,
  onSuccess,
}: EquipementDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isEditMode = !!equipement

  const form = useForm<EquipementFormValues>({
    resolver: zodResolver(equipementFormSchema),
    defaultValues: {
      nom: "",
      type: "",
      marque: "",
      modele: "",
      numeroSerie: "",
      etat: "DISPONIBLE",
      localisation: "",
    },
  })

  useEffect(() => {
    if (open) {
      setApiError(null)
      if (isEditMode && equipement) {
        form.reset({
          nom: equipement.nom,
          type: equipement.type,
          marque: equipement.marque || "",
          modele: equipement.modele || "",
          numeroSerie: equipement.numeroSerie,
          etat: equipement.etat,
          localisation: equipement.localisation || "",
        })
      } else {
        form.reset({
          nom: "",
          type: "",
          marque: "",
          modele: "",
          numeroSerie: "",
          etat: "DISPONIBLE",
          localisation: "",
        })
      }
    }
  }, [open, isEditMode, equipement, form])

  const onSubmit = async (values: EquipementFormValues) => {
    setIsSubmitting(true)
    setApiError(null)

    try {
      if (isEditMode && equipement) {
        // Edit mode - PUT request
        const response = await fetch(`/api/equipements/${equipement.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || "Erreur lors de la mise à jour de l'équipement")
        }

        toast.success("Équipement mis à jour avec succès")
        onSuccess()
        onClose()
      } else {
        // Create mode - POST request
        const response = await fetch("/api/equipements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          throw new Error(errorData?.error || "Erreur lors de la création de l'équipement")
        }

        toast.success("Équipement enregistré avec succès")
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      setApiError(error.message || "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] max-w-[480px] sm:max-w-[480px]">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {isEditMode ? "Modifier l'équipement" : "Ajouter un équipement"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Modifiez les informations de l'équipement"
              : "Ajoutez un nouvel équipement au système"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col">
            {apiError && (
              <div className="bg-destructive/15 text-destructive px-3 py-2 rounded-md text-sm">
                {apiError}
              </div>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'équipement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <FormControl>
                      <Input placeholder="Type d'équipement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque</FormLabel>
                    <FormControl>
                      <Input placeholder="Marque" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modele"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl>
                      <Input placeholder="Modèle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de série *</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de série" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="etat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un état" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {etatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="localisation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <FormControl>
                      <Input placeholder="Localisation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}