import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Sale = {
  id: string;
  user_id: string;
  customer_name: string | null;
  litres: number;
  selling_price: number;
  purchase_price: number;
  commission_per_litre: number;
  salesman_name: string | null;
  payment_mode: string | null;
  sale_date: string;
  notes: string | null;
  created_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  litres: number;
  purchase_price: number;
  supplier_name: string | null;
  invoice_number: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
};

export function useBusinessData() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [s, p, e] = await Promise.all([
      supabase.from("sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("inventory_purchases").select("*").order("purchase_date", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    ]);
    setSales((s.data as Sale[] | null)?.map(r => ({ ...r, litres: Number(r.litres), selling_price: Number(r.selling_price), purchase_price: Number(r.purchase_price), commission_per_litre: Number(r.commission_per_litre) })) ?? []);
    setPurchases((p.data as Purchase[] | null)?.map(r => ({ ...r, litres: Number(r.litres), purchase_price: Number(r.purchase_price) })) ?? []);
    setExpenses((e.data as Expense[] | null)?.map(r => ({ ...r, amount: Number(r.amount) })) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { sales, purchases, expenses, loading, refresh };
}