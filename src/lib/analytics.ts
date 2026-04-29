import { Sale, Purchase, Expense } from "@/hooks/useBusinessData";
import { DateRange, buildBuckets, inRange } from "./dateRange";

const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
const monthKey = (d: string) => new Date(d).toISOString().slice(0, 7);

export function computeMetrics(sales: Sale[], purchases: Purchase[], expenses: Expense[]) {
  const today = dayKey(new Date().toISOString());
  const thisMonth = monthKey(new Date().toISOString());

  // sums helpers
  let litresSold = 0, revenue = 0, cost = 0, commission = 0;
  for (const s of sales) {
    litresSold += s.litres;
    revenue += s.litres * s.selling_price;
    cost += s.litres * s.purchase_price;
    commission += s.litres * s.commission_per_litre;
  }
  const expensesTotal = expenses.reduce((a, e) => a + e.amount, 0);
  const purchasedLitres = purchases.reduce((a, p) => a + p.litres, 0);
  const purchaseSpend = purchases.reduce((a, p) => a + p.litres * p.purchase_price, 0);
  const inventoryRemaining = purchasedLitres - litresSold;

  const todaySales = sales.filter(s => dayKey(s.sale_date) === today);
  const todayLitres = todaySales.reduce((a, s) => a + s.litres, 0);
  const todayRevenue = todaySales.reduce((a, s) => a + s.litres * s.selling_price, 0);
  const todayNet = todaySales.reduce((a, s) => a + s.litres * (s.selling_price - s.purchase_price - s.commission_per_litre), 0);

  const monthSales = sales.filter(s => monthKey(s.sale_date) === thisMonth);
  const monthRevenue = monthSales.reduce((a, s) => a + s.litres * s.selling_price, 0);
  const monthNet = monthSales.reduce((a, s) => a + s.litres * (s.selling_price - s.purchase_price - s.commission_per_litre), 0);
  const monthExpenses = expenses.filter(e => monthKey(e.expense_date) === thisMonth).reduce((a, e) => a + e.amount, 0);
  const monthProfitAfterExpenses = monthNet - monthExpenses;

  const grossProfit = revenue - cost;
  const netProfit = grossProfit - commission - expensesTotal;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // last 14 days trend
  const trend: { date: string; revenue: number; profit: number; litres: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const day = sales.filter(s => dayKey(s.sale_date) === k);
    trend.push({
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: day.reduce((a, s) => a + s.litres * s.selling_price, 0),
      profit: day.reduce((a, s) => a + s.litres * (s.selling_price - s.purchase_price - s.commission_per_litre), 0),
      litres: day.reduce((a, s) => a + s.litres, 0),
    });
  }

  // average daily sales (over days that have sales)
  const dailyMap = new Map<string, number>();
  sales.forEach(s => dailyMap.set(dayKey(s.sale_date), (dailyMap.get(dayKey(s.sale_date)) ?? 0) + s.litres));
  const avgDailyLitres = dailyMap.size ? litresSold / dailyMap.size : 0;

  // best selling days
  const dailyRevenueMap = new Map<string, number>();
  sales.forEach(s => {
    const k = dayKey(s.sale_date);
    dailyRevenueMap.set(k, (dailyRevenueMap.get(k) ?? 0) + s.litres * s.selling_price);
  });
  const bestDays = [...dailyRevenueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([date, rev]) => ({ date, revenue: rev }));

  // expense breakdown
  const expenseByCategory = new Map<string, number>();
  expenses.forEach(e => expenseByCategory.set(e.category, (expenseByCategory.get(e.category) ?? 0) + e.amount));
  const expenseBreakdown = [...expenseByCategory.entries()].map(([name, value]) => ({ name, value }));

  // inventory days remaining (avg last 7 days consumption)
  const last7 = trend.slice(-7);
  const avg7 = last7.reduce((a, d) => a + d.litres, 0) / 7;
  const daysRemaining = avg7 > 0 ? inventoryRemaining / avg7 : null;

  return {
    litresSold, revenue, cost, commission, expensesTotal,
    purchasedLitres, purchaseSpend, inventoryRemaining,
    todayLitres, todayRevenue, todayNet,
    monthRevenue, monthNet, monthExpenses, monthProfitAfterExpenses,
    grossProfit, netProfit, profitMargin,
    trend, avgDailyLitres, bestDays, expenseBreakdown,
    daysRemaining,
  };
}

/** Metrics scoped to a date range, with a comparable previous-period summary. */
export function computeRangeMetrics(
  sales: Sale[], purchases: Purchase[], expenses: Expense[],
  range: DateRange, previous?: DateRange,
) {
  const inSales = sales.filter(s => inRange(s.sale_date, range));
  const inPurch = purchases.filter(p => inRange(p.purchase_date, range));
  const inExp = expenses.filter(e => inRange(e.expense_date, range));

  const sum = (arr: Sale[]) => {
    let litres = 0, revenue = 0, cost = 0, commission = 0;
    for (const s of arr) {
      litres += s.litres;
      revenue += s.litres * s.selling_price;
      cost += s.litres * s.purchase_price;
      commission += s.litres * s.commission_per_litre;
    }
    return { litres, revenue, cost, commission, gross: revenue - cost, net: revenue - cost - commission };
  };

  const cur = sum(inSales);
  const expensesTotal = inExp.reduce((a, e) => a + e.amount, 0);
  const netAfterExpenses = cur.net - expensesTotal;
  const margin = cur.revenue > 0 ? (netAfterExpenses / cur.revenue) * 100 : 0;

  const purchasedLitres = inPurch.reduce((a, p) => a + p.litres, 0);
  const purchaseSpend = inPurch.reduce((a, p) => a + p.litres * p.purchase_price, 0);

  // Trend buckets across the range
  const earliest = sales.length || purchases.length
    ? new Date(Math.min(
        ...sales.map(s => new Date(s.sale_date).getTime()),
        ...purchases.map(p => new Date(p.purchase_date).getTime()),
      ))
    : undefined;
  const buckets = buildBuckets(range, earliest);
  const trend = buckets.map(b => {
    const day = inSales.filter(s => {
      const t = new Date(s.sale_date).getTime();
      return t >= b.start.getTime() && t <= b.end.getTime();
    });
    return {
      date: b.label,
      revenue: day.reduce((a, s) => a + s.litres * s.selling_price, 0),
      profit: day.reduce((a, s) => a + s.litres * (s.selling_price - s.purchase_price - s.commission_per_litre), 0),
      litres: day.reduce((a, s) => a + s.litres, 0),
    };
  });

  // Expense breakdown
  const byCat = new Map<string, number>();
  inExp.forEach(e => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
  const expenseBreakdown = [...byCat.entries()].map(([name, value]) => ({ name, value }));

  // Best days within range
  const dailyRev = new Map<string, number>();
  inSales.forEach(s => {
    const k = dayKey(s.sale_date);
    dailyRev.set(k, (dailyRev.get(k) ?? 0) + s.litres * s.selling_price);
  });
  const bestDays = [...dailyRev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([date, revenue]) => ({ date, revenue }));

  // Average daily
  const dayCount = new Set(inSales.map(s => dayKey(s.sale_date))).size || 1;
  const avgDailyLitres = cur.litres / dayCount;

  // Previous-period comparison
  let prev: ReturnType<typeof sum> & { expensesTotal: number; netAfterExpenses: number } | null = null;
  if (previous) {
    const prevSales = sales.filter(s => inRange(s.sale_date, previous));
    const prevExp = expenses.filter(e => inRange(e.expense_date, previous));
    const ps = sum(prevSales);
    const pe = prevExp.reduce((a, e) => a + e.amount, 0);
    prev = { ...ps, expensesTotal: pe, netAfterExpenses: ps.net - pe };
  }

  const pctChange = (c: number, p: number | undefined) => {
    if (p === undefined || p === 0) return null;
    return ((c - p) / Math.abs(p)) * 100;
  };

  return {
    range, previous: previous ?? null,
    litres: cur.litres, revenue: cur.revenue, cost: cur.cost, commission: cur.commission,
    grossProfit: cur.gross, netProfit: cur.net, expensesTotal, netAfterExpenses, margin,
    purchasedLitres, purchaseSpend,
    trend, expenseBreakdown, bestDays, avgDailyLitres,
    salesCount: inSales.length,
    prev,
    delta: prev ? {
      revenue: pctChange(cur.revenue, prev.revenue),
      net: pctChange(netAfterExpenses, prev.netAfterExpenses),
      litres: pctChange(cur.litres, prev.litres),
      expenses: pctChange(expensesTotal, prev.expensesTotal),
    } : null,
  };
}