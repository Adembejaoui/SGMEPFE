"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
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

const equipementFormSchema = z.object({
  nom: z.string().min(2, { message: "Minimum 2 caractères" }),
  type: z.string().min(2, { message: "Minimum 2 caractères" }),
  marque: z.string().optional(),
  modele: z.string().optional(),
  numeroSerie: z.string().min(3, { message: "Minimum 3 caractères" }),
  etat: z.enum(["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"]),
  localisation: z.string().optional(),
})

type EquipementFormValues = z.infer<typeof equipementFormSchema>

interface EquipementDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const etatOptions = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_PANNE", label: "En Panne" },
  { value: "EN_MAINTENANCE", label: "En Maintenance" },
  { value: "HORS_SERVICE", label: "Hors Service" },
]

export function EquipementDrawer({
  open,
  onClose,
  onSuccess,
}: EquipementDrawerProps) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const onSubmit = async (values: EquipementFormValues) => {
    setApiError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/equipements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Erreur lors de la création")
      }

      toast.success("Équipement ajouté avec succès")
      form.reset()
      onSuccess()
      onClose()
    } catch (error: any) {
      setApiError(error.message || "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] sm:max-w-[480px] border-l">
        <SheetHeader className="pb-4">
          <SheetTitle>Ajouter un équipement</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
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
                      <Input placeholder="Nom" {...field} />
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
                      <Input placeholder="Type" {...field} />
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
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </SheetClose>
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
