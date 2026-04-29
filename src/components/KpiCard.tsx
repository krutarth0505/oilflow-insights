import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: LucideIcon;
  accent?: "primary" | "gold" | "success" | "warning" | "destructive";
  className?: string;
};

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  primary: "from-primary/20 to-primary/5 text-primary",
  gold: "from-gold/30 to-gold/5 text-gold",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
  destructive: "from-destructive/20 to-destructive/5 text-destructive",
};

export function KpiCard({ label, value, sub, icon: Icon, accent = "primary", className }: Props) {
  return (
    <div className={cn("glass-card p-5 hover-lift relative overflow-hidden animate-scale-in", className)}>
      <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60", accentMap[accent])} />
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight truncate">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5 bg-gradient-to-br", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}