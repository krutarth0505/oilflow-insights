import { useMemo, useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Trash2, Droplets, IndianRupee, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { fmtINR, fmtLitres, fmtDateTime, calcSale, DEFAULTS } from "@/lib/format";

export default function Sales() {
  const { user } = useAuth();
  const { sales, refresh, loading } = useBusinessData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [litres, setLitres] = useState("");
  const [sellingPrice, setSellingPrice] = useState(String(DEFAULTS.SELLING_PRICE));
  const [customerName, setCustomerName] = useState("");
  const [salesman, setSalesman] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");

  const preview = useMemo(() => calcSale(parseFloat(litres) || 0, parseFloat(sellingPrice) || DEFAULTS.SELLING_PRICE), [litres, sellingPrice]);

  const reset = () => { setLitres(""); setSellingPrice(String(DEFAULTS.SELLING_PRICE)); setCustomerName(""); setSalesman(""); setPaymentMode("Cash"); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(litres);
    const sp = parseFloat(sellingPrice);
    if (!l || l <= 0) return toast.error("Enter valid litres");
    if (!sp || sp <= 0) return toast.error("Enter valid selling price");
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("sales").insert({
      user_id: user.id,
      litres: l,
      selling_price: sp,
      purchase_price: DEFAULTS.PURCHASE_PRICE,
      commission_per_litre: DEFAULTS.COMMISSION,
      customer_name: customerName || null,
      salesman_name: salesman || null,
      payment_mode: paymentMode,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Sale recorded — Net profit ${fmtINR(preview.net)}`);
    reset();
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Sale deleted");
    refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{sales.length} total sales</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" />New Sale</Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="md:max-w-md md:right-0 md:left-auto md:h-full md:rounded-l-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
            <SheetHeader><SheetTitle>Record Sale</SheetTitle></SheetHeader>
            <form onSubmit={submit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Litres sold</Label>
                  <Input type="number" inputMode="decimal" step="0.01" value={litres} onChange={(e) => setLitres(e.target.value)} placeholder="e.g. 50" autoFocus required />
                </div>
                <div className="space-y-1.5">
                  <Label>Selling price ₹/L</Label>
                  <Input type="number" inputMode="decimal" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100, 200].map(q => (
                  <Button key={q} type="button" size="sm" variant="outline" onClick={() => setLitres(String(q))}>{q} L</Button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label>Customer (optional)</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Salesman</Label>
                  <Input value={salesman} onChange={(e) => setSalesman(e.target.value)} placeholder="Name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="glass-card p-3 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-[10px] uppercase text-muted-foreground">Revenue</p><p className="font-bold">{fmtINR(preview.revenue)}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Commission</p><p className="font-bold">{fmtINR(preview.commission)}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Net Profit</p><p className="font-bold text-success">{fmtINR(preview.net)}</p></div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary shadow-glow" disabled={busy}>Save Sale</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {loading ? <div className="glass-card h-32 animate-pulse" /> :
          sales.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Droplets className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No sales yet</p>
              <p className="text-sm text-muted-foreground">Tap "New Sale" to record your first transaction.</p>
            </div>
          ) : sales.map(s => {
            const c = calcSale(s.litres, s.selling_price, s.purchase_price, s.commission_per_litre);
            return (
              <div key={s.id} className="glass-card p-4 hover-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-primary/15 text-primary text-xs px-2 py-0.5 font-semibold">{fmtLitres(s.litres)}</span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(s.sale_date)}</span>
                      {s.payment_mode && <span className="text-xs rounded-full bg-secondary px-2 py-0.5">{s.payment_mode}</span>}
                    </div>
                    <p className="mt-1 font-medium truncate">{s.customer_name || "Walk-in customer"}{s.salesman_name && <span className="text-muted-foreground font-normal"> · {s.salesman_name}</span>}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1"><IndianRupee className="h-3 w-3 text-muted-foreground" /> {fmtINR(c.revenue)}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">Comm. {fmtINR(c.commission)}</div>
                      <div className="flex items-center gap-1 text-success font-semibold"><TrendingUp className="h-3 w-3" /> {fmtINR(c.net)}</div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}