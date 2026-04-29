import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { buildRange, DateRange, RangePreset } from "@/lib/dateRange";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

type Props = {
  value: DateRange;
  onChange: (r: DateRange) => void;
  className?: string;
};

export function DateRangeFilter({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ from?: Date; to?: Date }>({
    from: value.from ?? undefined,
    to: value.to ?? undefined,
  });

  return (
    <div className={cn("glass-card p-2 flex flex-wrap items-center gap-1.5", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {PRESETS.map(p => {
          const active = value.preset === p.value;
          return (
            <button
              key={p.value}
              onClick={() => onChange(buildRange(p.value))}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={value.preset === "custom" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              value.preset === "custom" && "bg-gradient-primary shadow-glow",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {value.preset === "custom" ? value.label : "Custom"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: draft.from, to: draft.to }}
            onSelect={(range) => setDraft({ from: range?.from, to: range?.to })}
            numberOfMonths={1}
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border p-2">
            <p className="text-xs text-muted-foreground px-1">
              {draft.from ? format(draft.from, "dd MMM") : "Start"} – {draft.to ? format(draft.to, "dd MMM yyyy") : "End"}
            </p>
            <Button
              size="sm"
              disabled={!draft.from || !draft.to}
              onClick={() => {
                if (draft.from && draft.to) {
                  onChange(buildRange("custom", { from: draft.from, to: draft.to }));
                  setOpen(false);
                }
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}