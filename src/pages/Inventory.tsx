import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { fmtINR, fmtLitres, fmtDate, DEFAULTS } from "@/lib/format";
import { computeMetrics } from "@/lib/analytics";
import { KpiCard } from "@/components/KpiCard";
import { Wallet, Droplets } from "lucide-react";

export default function Inventory() {
  const { user } = useAuth();
  const { sales, purchases, expenses, refresh, loading } = useBusinessData();
  const m = computeMetrics(sales, purchases, expenses);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [litres, setLitres] = useState("");
  const [price, setPrice] = useState(String(DEFAULTS.PURCHASE_PRICE));
  const [supplier, setSupplier] = useState("");
  const [invoice, setInvoice] = useState("");

  const reset = () => { setLitres(""); setPrice(String(DEFAULTS.PURCHASE_PRICE)); setSupplier(""); setInvoice(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(litres); const p = parseFloat(price);
    if (!l || l <= 0) return toast.error("Enter valid litres");
    if (!p || p <= 0) return toast.error("Enter valid price");
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("inventory_purchases").insert({
      user_id: user.id, litres: l, purchase_price: p,
      supplier_name: supplier || null, invoice_number: invoice || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${fmtLitres(l)} added to inventory`);
    reset(); setOpen(false); refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("inventory_purchases").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Purchase deleted"); refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Stock Remaining" icon={Package} accent={m.inventoryRemaining < 500 ? "warning" : "success"} value={fmtLitres(Math.max(0, m.inventoryRemaining))} />
        <KpiCard label="Total Purchased" icon={Droplets} accent="primary" value={fmtLitres(m.purchasedLitres)} />
        <KpiCard label="Total Sold" icon={Droplets} accent="gold" value={fmtLitres(m.litresSold)} />
        <KpiCard label="Stock Value Spent" icon={Wallet} accent="primary" value={fmtINR(m.purchaseSpend, { compact: true })} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{purchases.length} purchase records</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" />Add Stock</Button></SheetTrigger>
          <SheetContent side="bottom" className="md:max-w-md md:right-0 md:left-auto md:h-full md:rounded-l-2xl rounded-t-2xl">
            <SheetHeader><SheetTitle>Add Oil Purchase</SheetTitle></SheetHeader>
            <form onSubmit={submit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Litres</Label><Input type="number" inputMode="decimal" step="0.01" value={litres} onChange={(e) => setLitres(e.target.value)} autoFocus required /></div>
                <div className="space-y-1.5"><Label>Price ₹/L</Label><Input type="number" inputMode="decimal" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              </div>
              <div className="space-y-1.5"><Label>Supplier</Label><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" /></div>
              <div className="space-y-1.5"><Label>Invoice number</Label><Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="INV-..." /></div>
              <div className="glass-card p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold">{fmtINR((parseFloat(litres) || 0) * (parseFloat(price) || 0))}</p>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary shadow-glow" disabled={busy}>Save Purchase</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {loading ? <div className="glass-card h-32 animate-pulse" /> :
          purchases.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No purchases yet</p>
              <p className="text-sm text-muted-foreground">Add your first oil stock to get started.</p>
            </div>
          ) : purchases.map(p => (
            <div key={p.id} className="glass-card p-4 hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-semibold">{fmtLitres(p.litres)}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(p.purchase_date)}</span>
                    {p.invoice_number && <span className="text-xs rounded-full bg-secondary px-2 py-0.5">#{p.invoice_number}</span>}
                  </div>
                  <p className="mt-1 font-medium truncate">{p.supplier_name || "Supplier"}</p>
                  <p className="text-xs text-muted-foreground mt-1">@ {fmtINR(p.purchase_price, { decimals: 2 })}/L · Total <span className="font-semibold text-foreground">{fmtINR(p.litres * p.purchase_price)}</span></p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}