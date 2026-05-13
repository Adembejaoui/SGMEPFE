import { Badge } from '@/components/ui/badge'
import type { EquipmentType } from '@/types/equipement'

interface EquipementTypeBadgeProps {
  type: EquipmentType
}

const equipementTypeConfig: Record<EquipmentType, { label: string; className: string }> = {
  PRINTER: {
    label: 'Imprimante',
    className: 'bg-indigo-100 text-indigo-800',
  },
  NETWORK: {
    label: 'Réseau',
    className: 'bg-cyan-100 text-cyan-800',
  },
  HVAC: {
    label: 'HVAC',
    className: 'bg-orange-100 text-orange-800',
  },
  ELECTRICAL: {
    label: 'Électrique',
    className: 'bg-yellow-100 text-yellow-800',
  },
  SECURITY: {
    label: 'Sécurité',
    className: 'bg-red-100 text-red-800',
  },
}

export function EquipementTypeBadge({ type }: EquipementTypeBadgeProps) {
  const config = equipementTypeConfig[type]
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}