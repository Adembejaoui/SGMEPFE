import { Badge } from '@/components/ui/badge'
import type { PrioriteDemande } from '@/types/demande'

interface PrioriteBadgeProps {
  priorite: PrioriteDemande
}

const prioriteConfig: Record<PrioriteDemande, { label: string; className: string }> = {
  BASSE: {
    label: 'Basse',
    className: 'bg-gray-100 text-gray-800',
  },
  MOYENNE: {
    label: 'Moyenne',
    className: 'bg-blue-100 text-blue-800',
  },
  HAUTE: {
    label: 'Haute',
    className: 'bg-orange-100 text-orange-800',
  },
  URGENTE: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-800 animate-pulse',
  },
}

export function PrioriteBadge({ priorite }: PrioriteBadgeProps) {
  const config = prioriteConfig[priorite]
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}