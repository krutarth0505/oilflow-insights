import { useState } from "react";
import { useBusinessData } from "@/hooks/useBusinessData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { fmtINR, fmtDate } from "@/lib/format";

const CATEGORIES = ["Transport", "Storage", "Electricity", "Packaging", "Salaries", "Misc"];

export default function Expenses() {
  const { user } = useAuth();
  const { expenses, refresh, loading } = useBusinessData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [category, setCategory] = useState("Transport");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const total = expenses.reduce((a, e) => a + e.amount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!a || a <= 0) return toast.error("Enter valid amount");
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id, category, amount: a, description: description || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Expense recorded");
    setAmount(""); setDescription(""); setOpen(false); refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="glass-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total expenses</p>
        <p className="text-3xl font-bold mt-1">{fmtINR(total)}</p>
        <p className="text-xs text-muted-foreground mt-1">{expenses.length} entries</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">All categories</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" />Add Expense</Button></SheetTrigger>
          <SheetContent side="bottom" className="md:max-w-md md:right-0 md:left-auto md:h-full md:rounded-l-2xl rounded-t-2xl">
            <SheetHeader><SheetTitle>Add Expense</SheetTitle></SheetHeader>
            <form onSubmit={submit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Amount ₹</Label><Input type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required /></div>
              <div className="space-y-1.5"><Label>Description (optional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes" /></div>
              <Button type="submit" className="w-full bg-gradient-primary shadow-glow" disabled={busy}>Save Expense</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {loading ? <div className="glass-card h-32 animate-pulse" /> :
          expenses.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No expenses recorded</p>
              <p className="text-sm text-muted-foreground">Track your business costs to see real profit.</p>
            </div>
          ) : expenses.map(e => (
            <div key={e.id} className="glass-card p-4 hover-lift">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-destructive/15 text-destructive text-xs px-2 py-0.5 font-semibold">{e.category}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(e.expense_date)}</span>
                  </div>
                  {e.description && <p className="mt-1 text-sm truncate">{e.description}</p>}
                </div>
                <p className="font-bold text-lg">{fmtINR(e.amount)}</p>
                <Button size="icon" variant="ghost" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}