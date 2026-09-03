import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoRowProps {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  className?: string
}

export function InfoRow({ label, value, icon: Icon, className }: InfoRowProps) {
  return (
    <div className={cn("flex items-start gap-3 py-2", className)}>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground break-words">
          {value}
        </div>
      </div>
    </div>
  )
}
