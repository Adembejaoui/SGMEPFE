import { Badge } from '@/components/ui/badge'
import type { StatutDemande } from '@/types/demande'

interface StatutBadgeProps {
  statut: StatutDemande
}

const statutConfig: Record<StatutDemande, { label: string; className: string }> = {
  EN_ATTENTE: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  VALIDEE: {
    label: 'Validée',
    className: 'bg-blue-100 text-blue-800',
  },
  EN_COURS: {
    label: 'En cours',
    className: 'bg-purple-100 text-purple-800',
  },
  TRAITEE: {
    label: 'Traitée',
    className: 'bg-green-100 text-green-800',
  },
  REJETEE: {
    label: 'Rejetée',
    className: 'bg-red-100 text-red-800',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-gray-100 text-gray-800',
  },
}

export function StatutBadge({ statut }: StatutBadgeProps) {
  const config = statutConfig[statut]
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}