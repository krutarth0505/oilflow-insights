import { useState, useMemo } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { computeMetrics, computeRangeMetrics } from "@/lib/analytics";
import { fmtINR, fmtLitres, fmtPct, fmtNum } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DeltaBadge } from "@/components/DeltaBadge";
import { buildRange, previousRange } from "@/lib/dateRange";
import { TrendingUp, IndianRupee, Droplets, Sparkles, Receipt } from "lucide-react";

export default function Analytics() {
  const { sales, purchases, expenses, loading } = useBusinessData();
  const [range, setRange] = useState(() => buildRange("month"));
  const prev = useMemo(() => previousRange(range), [range]);
  const m = computeMetrics(sales, purchases, expenses);
  const r = useMemo(() => computeRangeMetrics(sales, purchases, expenses, range, prev), [sales, purchases, expenses, range, prev]);
  const rPrev = useMemo(() => computeRangeMetrics(sales, purchases, expenses, prev), [sales, purchases, expenses, prev]);

  if (loading) return <div className="glass-card h-64 animate-pulse" />;

  // Build a comparison dataset by index (current vs previous bucket-by-bucket)
  const compareData = r.trend.map((d, i) => ({
    date: d.date,
    current: d.revenue,
    previous: rPrev.trend[i]?.revenue ?? 0,
  }));

  const insights = [
    m.daysRemaining !== null && `Inventory will last ~${Math.max(0, Math.round(m.daysRemaining))} days at current pace.`,
    r.bestDays[0] && `Best day in ${range.label}: ${new Date(r.bestDays[0].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} with ${fmtINR(r.bestDays[0].revenue)} revenue.`,
    r.avgDailyLitres > 0 && `Average daily sales (${range.label}): ${fmtLitres(r.avgDailyLitres)}.`,
    r.delta?.revenue !== null && r.delta?.revenue !== undefined && `Revenue is ${r.delta.revenue >= 0 ? "up" : "down"} ${Math.abs(r.delta.revenue).toFixed(1)}% vs previous period.`,
    r.delta?.net !== null && r.delta?.net !== undefined && `Net profit is ${r.delta.net >= 0 ? "up" : "down"} ${Math.abs(r.delta.net).toFixed(1)}% vs previous period.`,
    r.margin > 0 && `Margin in ${range.label}: ${fmtPct(r.margin)}.`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5 animate-fade-in">
      <DateRangeFilter value={range} onChange={setRange} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Revenue" icon={IndianRupee} accent="gold"
          value={fmtINR(r.revenue, { compact: true })}
          trailing={<DeltaBadge value={r.delta?.revenue ?? null} />}
          sub={`vs ${fmtINR(rPrev.revenue, { compact: true })}`} />
        <KpiCard label="Net Profit" icon={TrendingUp} accent="success"
          value={fmtINR(r.netAfterExpenses, { compact: true })}
          trailing={<DeltaBadge value={r.delta?.net ?? null} />}
          sub={`Margin ${fmtPct(r.margin)}`} />
        <KpiCard label="Litres Sold" icon={Droplets} accent="primary"
          value={fmtNum(r.litres) + " L"}
          trailing={<DeltaBadge value={r.delta?.litres ?? null} />}
          sub={`Avg ${fmtNum(r.avgDailyLitres, 1)} L/day`} />
        <KpiCard label="Expenses" icon={Receipt} accent="destructive"
          value={fmtINR(r.expensesTotal, { compact: true })}
          trailing={<DeltaBadge value={r.delta?.expenses ?? null} invert />}
          sub={`vs ${fmtINR(rPrev.expensesTotal, { compact: true })}`} />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-gradient-gold p-2 shadow-gold"><Sparkles className="h-4 w-4 text-gold-foreground" /></div>
          <h3 className="font-semibold">Smart Insights</h3>
        </div>
        {insights.length === 0 ? <p className="text-sm text-muted-foreground">Record more sales to unlock insights.</p> : (
          <ul className="space-y-2">
            {insights.map((i, idx) => (
              <li key={idx} className="flex gap-2 text-sm"><span className="text-gold">•</span><span>{i}</span></li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-1">Revenue & Profit · {range.label}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={r.trend} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => fmtINR(v, { compact: true })} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtINR(v)} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} name="Revenue" />
            <Line type="monotone" dataKey="profit" stroke="hsl(var(--gold))" strokeWidth={2.5} dot={{ r: 3 }} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-1">Period Comparison</h3>
        <p className="text-xs text-muted-foreground mb-2">Current vs previous period (revenue)</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={compareData} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => fmtINR(v, { compact: true })} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtINR(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="current" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name={range.label} />
            <Line type="monotone" dataKey="previous" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Previous" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold mb-1">Litres Sold · {range.label}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={r.trend} margin={{ left: -10, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `${fmtNum(v)} L`} />
            <Bar dataKey="litres" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}