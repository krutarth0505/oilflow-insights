import { useBusinessData } from "@/hooks/useBusinessData";
import { computeMetrics } from "@/lib/analytics";
import { fmtINR, fmtLitres, fmtPct, fmtNum } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Droplets, IndianRupee, TrendingUp, Package, Receipt, Wallet, Calendar, Sparkles, AlertTriangle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--primary-glow))"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { sales, purchases, expenses, loading } = useBusinessData();
  const m = computeMetrics(sales, purchases, expenses);
  const lowStock = m.inventoryRemaining < 500 && m.purchasedLitres > 0;

  if (loading) return <DashboardSkeleton />;

  if (sales.length === 0 && purchases.length === 0) {
    return (
      <div className="glass-card p-8 md:p-12 text-center animate-fade-in">
        <div className="inline-flex rounded-2xl bg-gradient-primary p-4 shadow-glow mb-4">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to OilFlow Manager</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start by adding your first oil purchase to inventory, then record sales to see beautiful analytics here.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button onClick={() => navigate("/inventory")} className="bg-gradient-primary shadow-glow"><Package className="h-4 w-4 mr-2" />Add Purchase</Button>
          <Button onClick={() => navigate("/sales")} variant="outline"><Droplets className="h-4 w-4 mr-2" />Record Sale</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {lowStock && (
        <div className="glass-card p-4 border-warning/40 flex items-center gap-3">
          <div className="rounded-lg bg-warning/15 p-2"><AlertTriangle className="h-4 w-4 text-warning" /></div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Low stock alert</p>
            <p className="text-muted-foreground">Only {fmtLitres(m.inventoryRemaining)} remaining. Consider purchasing more soon.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => navigate("/inventory")}>Restock</Button>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Today's Litres" icon={Droplets} accent="primary"
          value={<AnimatedCounter value={m.todayLitres} format={n => fmtNum(n, n % 1 === 0 ? 0 : 1) + " L"} />}
          sub={`${sales.filter(s => new Date(s.sale_date).toDateString() === new Date().toDateString()).length} transactions`} />
        <KpiCard label="Today's Revenue" icon={IndianRupee} accent="gold"
          value={<AnimatedCounter value={m.todayRevenue} format={n => fmtINR(n)} />}
          sub={`Net ₹${fmtNum(m.todayNet)}`} />
        <KpiCard label="Inventory" icon={Package} accent={lowStock ? "warning" : "success"}
          value={<AnimatedCounter value={m.inventoryRemaining} format={n => fmtNum(Math.max(0, n)) + " L"} />}
          sub={m.daysRemaining ? `~${Math.max(0, Math.round(m.daysRemaining))} days left` : "Add purchases"} />
        <KpiCard label="Profit Margin" icon={TrendingUp} accent="success"
          value={<AnimatedCounter value={m.profitMargin} format={n => fmtPct(n)} />}
          sub={`Net ${fmtINR(m.netProfit, { compact: true })}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Month Revenue" icon={IndianRupee} accent="gold" value={fmtINR(m.monthRevenue, { compact: true })} sub={fmtINR(m.monthRevenue)} />
        <KpiCard label="Month Profit" icon={TrendingUp} accent="success" value={fmtINR(m.monthProfitAfterExpenses, { compact: true })} sub="After expenses" />
        <KpiCard label="Month Expenses" icon={Receipt} accent="destructive" value={fmtINR(m.monthExpenses, { compact: true })} />
        <KpiCard label="Total Spent on Stock" icon={Wallet} accent="primary" value={fmtINR(m.purchaseSpend, { compact: true })} sub={`${fmtLitres(m.purchasedLitres)} purchased`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Sales Trend</h3>
              <p className="text-xs text-muted-foreground">Last 14 days revenue & profit</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={m.trend} margin={{ left: -12, right: 8, top: 5 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => fmtINR(v, { compact: true })} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtINR(v)} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="hsl(var(--gold))" strokeWidth={2} fill="url(#prof)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 animate-slide-up">
          <h3 className="font-semibold mb-1">Expense Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-2">By category</p>
          {m.expenseBreakdown.length === 0 ? (
            <div className="h-[230px] flex items-center justify-center text-sm text-muted-foreground">No expenses yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={m.expenseBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {m.expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtINR(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5 animate-slide-up">
          <h3 className="font-semibold mb-1">Inventory Usage</h3>
          <p className="text-xs text-muted-foreground mb-2">Daily litres sold</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={m.trend} margin={{ left: -12, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `${fmtNum(v)} L`} />
              <Bar dataKey="litres" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Top Sales Days</h3>
              <p className="text-xs text-muted-foreground">Highest revenue</p>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          {m.bestDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {m.bestDays.map((d, i) => (
                <li key={d.date} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? "bg-gradient-gold text-gold-foreground shadow-gold" : "bg-secondary text-secondary-foreground"}`}>{i + 1}</span>
                    <span className="text-sm font-medium">{new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <span className="text-sm font-semibold">{fmtINR(d.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28" />)}
      </div>
      <div className="glass-card h-72" />
    </div>
  );
}