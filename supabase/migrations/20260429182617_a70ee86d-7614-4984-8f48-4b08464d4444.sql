-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- inventory purchases
CREATE TABLE public.inventory_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  litres NUMERIC(12,2) NOT NULL CHECK (litres > 0),
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 103.96,
  supplier_name TEXT,
  invoice_number TEXT,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own inv select" ON public.inventory_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own inv insert" ON public.inventory_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own inv update" ON public.inventory_purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own inv delete" ON public.inventory_purchases FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_inv_user_date ON public.inventory_purchases(user_id, purchase_date DESC);

-- sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  litres NUMERIC(12,2) NOT NULL CHECK (litres > 0),
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 140,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 103.96,
  commission_per_litre NUMERIC(12,2) NOT NULL DEFAULT 5,
  salesman_name TEXT,
  payment_mode TEXT,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales select" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sales insert" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sales update" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sales delete" ON public.sales FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_sales_user_date ON public.sales(user_id, sale_date DESC);

-- expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  expense_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exp select" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own exp insert" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exp update" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own exp delete" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_exp_user_date ON public.expenses(user_id, expense_date DESC);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();