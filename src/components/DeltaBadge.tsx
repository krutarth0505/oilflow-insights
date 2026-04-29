import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number | null;
  /** When true, a negative change is good (e.g. expenses going down). */
  invert?: boolean;
  className?: string;
};

export function DeltaBadge({ value, invert = false, className }: Props) {
  if (value === null || !isFinite(value)) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : value > 0 ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        neutral && "bg-muted text-muted-foreground",
        !neutral && positive && "bg-success/15 text-success",
        !neutral && !positive && "bg-destructive/15 text-destructive",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}