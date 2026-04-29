export type RangePreset = "today" | "week" | "month" | "year" | "all" | "custom";

export type DateRange = {
  preset: RangePreset;
  from: Date | null; // null = unbounded (for "all")
  to: Date | null;
  label: string;
  granularity: "hour" | "day" | "week" | "month";
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
const addYears = (d: Date, n: number) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; };

export function buildRange(preset: RangePreset, custom?: { from: Date; to: Date }): DateRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { preset, from: startOfDay(now), to: endOfDay(now), label: "Today", granularity: "hour" };
    case "week": {
      const from = startOfDay(addDays(now, -6));
      return { preset, from, to: endOfDay(now), label: "Last 7 days", granularity: "day" };
    }
    case "month": {
      const from = startOfDay(addDays(now, -29));
      return { preset, from, to: endOfDay(now), label: "Last 30 days", granularity: "day" };
    }
    case "year": {
      const from = startOfDay(addMonths(now, -11));
      from.setDate(1);
      return { preset, from, to: endOfDay(now), label: "Last 12 months", granularity: "month" };
    }
    case "all":
      return { preset, from: null, to: null, label: "All time", granularity: "month" };
    case "custom": {
      if (!custom) return buildRange("month");
      const from = startOfDay(custom.from);
      const to = endOfDay(custom.to);
      const days = Math.ceil((to.getTime() - from.getTime()) / 86400000);
      const granularity: DateRange["granularity"] = days <= 1 ? "hour" : days <= 60 ? "day" : days <= 365 ? "week" : "month";
      return { preset, from, to, label: `${from.toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} – ${to.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`, granularity };
    }
  }
}

export function previousRange(r: DateRange): DateRange {
  if (!r.from || !r.to) return r;
  switch (r.preset) {
    case "today": {
      const from = addDays(r.from, -1);
      return { ...r, from: startOfDay(from), to: endOfDay(from), label: "Yesterday" };
    }
    case "week":
      return { ...r, from: addDays(r.from, -7), to: addDays(r.to, -7), label: "Previous 7 days" };
    case "month":
      return { ...r, from: addDays(r.from, -30), to: addDays(r.to, -30), label: "Previous 30 days" };
    case "year":
      return { ...r, from: addYears(r.from, -1), to: addYears(r.to, -1), label: "Previous 12 months" };
    case "all":
      return r;
    case "custom": {
      const span = r.to.getTime() - r.from.getTime();
      const to = new Date(r.from.getTime() - 1);
      const from = new Date(to.getTime() - span);
      return { ...r, from, to, label: "Previous period" };
    }
  }
}

export function inRange(date: string | Date, r: DateRange): boolean {
  const t = new Date(date).getTime();
  if (r.from && t < r.from.getTime()) return false;
  if (r.to && t > r.to.getTime()) return false;
  return true;
}

/** Build empty buckets covering the range at the given granularity. */
export function buildBuckets(r: DateRange, fallbackEarliest?: Date) {
  const from = r.from ?? fallbackEarliest ?? addDays(new Date(), -29);
  const to = r.to ?? new Date();
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];

  if (r.granularity === "hour") {
    for (let h = 0; h < 24; h++) {
      const start = new Date(from); start.setHours(h, 0, 0, 0);
      const end = new Date(start); end.setMinutes(59, 59, 999);
      buckets.push({ key: `${start.toISOString().slice(0,13)}`, label: `${String(h).padStart(2,"0")}h`, start, end });
    }
  } else if (r.granularity === "day") {
    let cur = startOfDay(from);
    while (cur <= to) {
      const end = endOfDay(cur);
      buckets.push({
        key: cur.toISOString().slice(0, 10),
        label: cur.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        start: new Date(cur), end,
      });
      cur = addDays(cur, 1);
    }
  } else if (r.granularity === "week") {
    let cur = startOfDay(from);
    while (cur <= to) {
      const end = endOfDay(addDays(cur, 6));
      buckets.push({
        key: cur.toISOString().slice(0, 10),
        label: cur.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        start: new Date(cur), end,
      });
      cur = addDays(cur, 7);
    }
  } else {
    let cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const last = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cur <= last) {
      const end = endOfDay(new Date(cur.getFullYear(), cur.getMonth() + 1, 0));
      buckets.push({
        key: `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`,
        label: cur.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        start: new Date(cur), end,
      });
      cur = addMonths(cur, 1);
    }
  }
  return buckets;
}