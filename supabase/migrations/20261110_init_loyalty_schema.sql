-- ====================================================================
-- LOYALTYPASS MOBILE APP - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'merchant');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
-- Linked 1-to-1 with Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on role for fast merchant/customer filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast customer point balance queries and merchant statistics
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.loyalty_transactions(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.loyalty_transactions(created_at);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 5A. PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Merchants can view customer profiles to verify customer identity and point balance upon scanning QR
CREATE POLICY "Merchants can view customer profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles m
      WHERE m.id = auth.uid() AND m.role = 'merchant'
    )
    AND role = 'customer'
  );

-- Customers can view merchant profiles (so transaction history can display merchant name)
CREATE POLICY "Customers can view merchant profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles c
      WHERE c.id = auth.uid() AND c.role = 'customer'
    )
    AND role = 'merchant'
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5B. LOYALTY TRANSACTIONS POLICIES
-- Customers can view only their own transactions
CREATE POLICY "Customers can view their own transactions"
  ON public.loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Merchants can view only transactions awarded by them
CREATE POLICY "Merchants can view transactions awarded by them"
  ON public.loyalty_transactions
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

-- Direct inserts: only authenticated merchants can insert transactions where merchant_id = auth.uid()
CREATE POLICY "Merchants can insert transactions"
  ON public.loyalty_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    merchant_id = auth.uid()
    AND points > 0
    AND EXISTS (
      SELECT 1 FROM public.profiles m
      WHERE m.id = auth.uid() AND m.role = 'merchant'
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles c
      WHERE c.id = customer_id AND c.role = 'customer'
    )
  );

-- Customers CANNOT insert, update, or delete transactions
-- Transactions are immutable: no UPDATE or DELETE allowed by anyone
CREATE POLICY "Transactions are immutable"
  ON public.loyalty_transactions
  FOR UPDATE
  USING (false);

CREATE POLICY "Transactions cannot be deleted"
  ON public.loyalty_transactions
  FOR DELETE
  USING (false);

-- 6. SECURE DATABASE FUNCTION / RPC: award_points
-- Derives merchant identity strictly from auth.uid()
CREATE OR REPLACE FUNCTION public.award_points(
  p_customer_id UUID,
  p_points INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_merchant_id UUID;
  v_merchant_role user_role;
  v_customer_exists BOOLEAN;
  v_customer_name TEXT;
  v_tx_id UUID;
  v_new_balance BIGINT;
BEGIN
  -- 1. Identify caller from active Supabase auth session
  v_merchant_id := auth.uid();
  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Merchant must be logged in';
  END IF;

  -- 2. Verify caller has merchant role
  SELECT role INTO v_merchant_role FROM public.profiles WHERE id = v_merchant_id;
  IF v_merchant_role IS NULL OR v_merchant_role <> 'merchant' THEN
    RAISE EXCEPTION 'Forbidden: Only verified merchants can award points';
  END IF;

  -- 3. Validate points argument
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'Invalid points: Must be a positive integer greater than 0';
  END IF;

  IF p_points > 10000 THEN
    RAISE EXCEPTION 'Invalid points: Exceeds maximum award limit (10,000)';
  END IF;

  -- 4. Verify customer exists and has customer role
  SELECT full_name INTO v_customer_name
  FROM public.profiles
  WHERE id = p_customer_id AND role = 'customer';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or invalid customer identifier';
  END IF;

  -- 5. Insert immutable loyalty transaction
  INSERT INTO public.loyalty_transactions (customer_id, merchant_id, points)
  VALUES (p_customer_id, v_merchant_id, p_points)
  RETURNING id INTO v_tx_id;

  -- 6. Calculate new customer balance
  SELECT COALESCE(SUM(points), 0) INTO v_new_balance
  FROM public.loyalty_transactions
  WHERE customer_id = p_customer_id;

  -- 7. Return summary
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'customer_id', p_customer_id,
    'customer_name', v_customer_name,
    'points_awarded', p_points,
    'new_balance', v_new_balance,
    'created_at', now()
  );
END;
$$;

-- 7. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- Automatically creates a profile record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role user_role;
BEGIN
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'customer'::user_role);

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
