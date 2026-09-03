'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { InfoRow } from '@/components/ui/info-row'
import { User } from 'lucide-react'

interface TechnicianOption {
  id: string
  firstName: string
  lastName: string
  email: string
  specialization: string | null
}

interface AssignTechnicienSelectProps {
  interventionId: number
  currentTechnicienId: string | null
  onAssigned?: () => void
}

export function AssignTechnicienSelect({ interventionId, currentTechnicienId, onAssigned }: AssignTechnicienSelectProps) {
  const [techniciens, setTechniciens] = useState<TechnicianOption[]>([])
  const [selectedId, setSelectedId] = useState<string>(currentTechnicienId || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchTechniciens()
  }, [])

  const fetchTechniciens = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/techniciens')
      if (res.ok) {
        const data = await res.json()
        setTechniciens(data)
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedId || selectedId === currentTechnicienId) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/interventions/${interventionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selectedId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur' }))
        throw new Error(err.error || 'Erreur lors de l\'assignation')
      }

      const technicien = techniciens.find(t => t.id === selectedId)
      toast.success(`Technicien assigné: ${technicien?.firstName} ${technicien?.lastName}`)
      onAssigned?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const currentTechnicien = techniciens.find(t => t.id === currentTechnicienId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Assignation du technicien
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTechnicien && (
          <InfoRow
            label="Technicien actuel"
            value={`${currentTechnicien.firstName} ${currentTechnicien.lastName} (${currentTechnicien.email})`}
            icon={User}
          />
        )}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Assigner un technicien
          </label>
          <Select
            value={selectedId}
            onValueChange={setSelectedId}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez un technicien" />
            </SelectTrigger>
            <SelectContent>
              {techniciens.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} {t.specialization ? `(${t.specialization})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAssign}
            disabled={!selectedId || selectedId === currentTechnicienId || isSaving}
            className="w-full"
          >
            {isSaving ? 'Assignation...' : 'Assigner'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
