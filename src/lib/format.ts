// Indian numbering format (1,00,000 style) and currency helpers
export const fmtINR = (n: number, opts: { decimals?: number; compact?: boolean } = {}) => {
  const { decimals = 0, compact = false } = opts;
  if (!isFinite(n)) return "₹0";
  if (compact) {
    const abs = Math.abs(n);
    if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
};

export const fmtNum = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);

export const fmtLitres = (n: number) => `${fmtNum(n, n % 1 === 0 ? 0 : 2)} L`;

export const fmtPct = (n: number, decimals = 1) =>
  `${n.toFixed(decimals)}%`;

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// Business constants (defaults)
export const DEFAULTS = {
  PURCHASE_PRICE: 103.96,
  SELLING_PRICE: 140,
  COMMISSION: 5,
};

export const calcSale = (litres: number, sellingPrice = DEFAULTS.SELLING_PRICE, purchasePrice = DEFAULTS.PURCHASE_PRICE, commission = DEFAULTS.COMMISSION) => {
  const revenue = litres * sellingPrice;
  const cost = litres * purchasePrice;
  const commTotal = litres * commission;
  const gross = revenue - cost;
  const net = gross - commTotal;
  return { revenue, cost, commission: commTotal, gross, net };
};