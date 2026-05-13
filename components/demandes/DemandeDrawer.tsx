"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PrioriteDemande } from "@/types/demande"
import type { EquipementListItem } from "@/types/equipement"

const PRIORITES: PrioriteDemande[] = ["BASSE", "MOYENNE", "HAUTE", "URGENTE"]

interface DemandeDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DemandeDrawer({ open, onClose, onSuccess }: DemandeDrawerProps) {
  const [eqs, setEqs] = useState<EquipementListItem[]>([])
  const [eqLoading, setEqLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState("")
  const [eqId, setEqId] = useState("")
  const [desc, setDesc] = useState("")
  const [prio, setPrio] = useState<PrioriteDemande>("BASSE")

  useEffect(() => {
    if (!open) return
    setEqs([])
    setErr("")
    setEqLoading(true)

    let alive = true

    async function load() {
      try {
        const [a, b] = await Promise.all([
          fetch("/api/equipements?etat=DISPONIBLE"),
          fetch("/api/equipements?etat=EN_PANNE"),
        ])
        const aa = a.ok ? await a.json() : { data: [] }
        const bb = b.ok ? await b.json() : { data: [] }
        if (alive) setEqs([...(aa.data || []), ...(bb.data || [])])
      } catch {
        if (alive) setErr("Erreur chargement équipements")
      } finally {
        if (alive) setEqLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [open])

  async function send() {
    setErr("")
    if (!eqId || Number(eqId) <= 0) return void setErr("Choisir un équipement")
    if ((desc || "").trim().length < 10) return void setErr("Min 10 caractères")
    setSending(true)
    try {
      const r = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc.trim(),
          priorite: prio,
          equipementId: Number(eqId),
        }),
      })
      if (!r.ok) {
        const b = await r.json().catch(() => null)
        throw new Error(b?.error || "Erreur")
      }
      toast.success("Demande soumise")
      onSuccess()
      onClose()
    } catch (e: any) {
      setErr(e?.message || "Erreur")
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose()
    }}>
      <SheetContent className="w-120 max-w-120 border-l">
        <SheetHeader>
          <SheetTitle>Nouvelle demande de maintenance</SheetTitle>
        </SheetHeader>

        {!!err && <p className="mt-2 text-sm text-red-600">{err}</p>}

        <div className="mt-3 space-y-3">
          {/* Equipement */}
          <div>
            <p className="text-sm font-medium mb-1">Équipement *</p>
            {eqLoading ? (
              <p className="text-sm">Chargement…</p>
            ) : eqs.length === 0 ? (
              <p className="text-sm">Aucun équipement</p>
            ) : (
               <Select value={eqId} onValueChange={setEqId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Sélectionner…" />
                 </SelectTrigger>
                 <SelectContent>
                   {eqs.map((e) => (
                     <SelectItem key={e.id} value={String(e.id)}>
                       {e.nom} — {e.type}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-medium mb-1">Description *</p>
            <textarea
              rows={4}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Décrivez le problème…"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-20"
            />
            <p className="text-xs mt-1">{desc.length}/10 min</p>
          </div>

          {/* Priorité */}
          <div>
            <p className="text-sm font-medium mb-1">Priorité *</p>
            <Select value={prio} onValueChange={(v) => setPrio(v as PrioriteDemande)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex flex-row-reverse gap-2 pt-3">
          <Button variant="outline" onClick={onClose} disabled={sending || eqLoading}>
            Annuler
          </Button>
          <Button
            onClick={send}
            disabled={sending || eqLoading || !eqId || desc.trim().length < 10}
          >
            {sending ? "Envoi…" : "Soumettre"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}