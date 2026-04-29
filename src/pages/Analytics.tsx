import { useBusinessData } from "@/hooks/useBusinessData";
import { computeMetrics } from "@/lib/analytics";
import { fmtINR, fmtLitres, fmtPct, fmtNum } from "@/lib/format";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/KpiCard";
import { TrendingUp, IndianRupee, Droplets, Sparkles } from "lucide-react";

export default function Analytics() {
  const { sales, purchases, expenses, loading } = useBusinessData();
  const m = computeMetrics(sales, purchases, expenses);

  if (loading) return <div className="glass-card h-64 animate-pulse" />;

  const insights = [
    m.daysRemaining !== null && `Inventory will last ~${Math.max(0, Math.round(m.daysRemaining))} days at current pace.`,
    m.bestDays[0] && `Best day so far: ${new Date(m.bestDays[0].date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} with ${fmtINR(m.bestDays[0].revenue)} revenue.`,
    m.avgDailyLitres > 0 && `Average daily sales: ${fmtLitres(m.avgDailyLitres)}.`,
    m.profitMargin > 0 && `Overall profit margin is ${fmtPct(m.profitMargin)}.`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Total Revenue" icon={IndianRupee} accent="gold" value={fmtINR(m.revenue, { compact: true })} sub={fmtINR(m.revenue)} />
        <KpiCard label="Gross Profit" icon={TrendingUp} accent="primary" value={fmtINR(m.grossProfit, { compact: true })} sub="Before commission & expenses" />
        <KpiCard label="Net Profit" icon={TrendingUp} accent="success" value={fmtINR(m.netProfit, { compact: true })} sub={`Margin ${fmtPct(m.profitMargin)}`} />
        <KpiCard label="Avg Daily Sales" icon={Droplets} accent="primary" value={fmtNum(m.avgDailyLitres, 1) + " L"} />
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
        <h3 className="font-semibold mb-1">Revenue & Profit (14 days)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={m.trend} margin={{ left: -10, right: 8 }}>
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
        <h3 className="font-semibold mb-1">Daily Litres Sold</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={m.trend} margin={{ left: -10, right: 8 }}>
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